import { getBroadcast } from '../socket/socket.server.js'
import { z } from 'zod'
import prisma from '../lib/prisma.js'
import { verifyCustomerSession, issueCustomerSession } from '../lib/customerSession.js'

//  Validation schemas 
const orderSchema = z.object({
  table_id: z.string().uuid('Invalid table ID'),
  items: z.array(z.object({
    menu_item_id: z.string().uuid('Invalid menu item ID'),
    quantity:     z.number().int().positive('Quantity must be at least 1'),
    item_notes:   z.string().optional(),
  })).min(1, 'Order must contain at least one item'),
  special_notes: z.string().optional(),
  session_token: z.string().optional(),
})

//  State machine for order status transitions (only allow valid progressions to prevent accidental skips or regressions)
const ALLOWED_TRANSITIONS = {
  new:       ['preparing'],
  preparing: ['ready'],
  ready:     ['served'],
  served:    [],
}

function notFound(item) {
  const err = new Error(`${item} not found`)
  err.status = 404
  throw err
}

//  Place order (returns created order with items and table info)
export async function createOrder(body) {
  // 1. Validate input data against schema and provide clear error messages for invalid input
  const parsed = orderSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.errors?.[0].message || 'Invalid request data'
    const err = new Error(message)
    err.status = 400
    throw err
  }

  const { table_id, items, special_notes, session_token } = parsed.data

  // Verify customer session at the start
  verifyCustomerSession(session_token, table_id)

  // 2. Confirm table exists and is in a state that can accept new orders (e.g., not occupied with an active order)
  const table = await prisma.restaurantTable.findUnique({
    where: { id: table_id }
  })
  if (!table) notFound('Table')

  // 3. Fetch all ordered menu items in one query to confirm they exist and are available, and to get their current prices for locking in the order total (preventing issues if prices change after order is placed but before it's processed)
  const menuItemIds = items.map(i => i.menu_item_id)
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id:           { in: menuItemIds },
      is_available: true,
      is_deleted:   false,
    }
  })

  // 4. Confirm every item exists and is available — if any are missing, return a clear error message to the client so they can adjust their order (e.g., "The following items are unavailable: X, Y, Z")
  if (menuItems.length !== menuItemIds.length) {
    const err = new Error(
      'One or more items are unavailable or do not exist'
    )
    err.status = 400
    throw err
  }

  // 5. Build order items with locked prices and calculate total amount (this ensures the order total is based on the prices at the time of ordering, even if menu prices change later)
  const menuItemMap = Object.fromEntries(menuItems.map(i => [i.id, i]))
  const orderItems  = items.map(item => {
    const menuItem = menuItemMap[item.menu_item_id]
    const subtotal = menuItem.price * item.quantity
    return {
      menu_item_id: item.menu_item_id,
      item_name:    menuItem.name,
      quantity:     item.quantity,
      unit_price:   menuItem.price,
      subtotal,
      item_notes:   item.item_notes || null,
    }
  })

  const total_amount = orderItems.reduce((sum, i) => sum + i.subtotal, 0)

  // 6. Write order + items + initial status log in a single transaction
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        table_id,
        total_amount,
        special_notes: special_notes || null,
        status: 'new',
        items: { create: orderItems },
      },
      include: {
        items: true,
        table: { select: { table_number: true } },
      },
    })

    // Write initial status log entry (this provides a complete history of status changes starting from the moment the order is created, which is important for auditing and debugging purposes)
    await tx.orderStatusLog.create({
      data: {
        order_id: newOrder.id,
        status:   'new',
      }
    })

    // Update table status to ordering  (this ensures the table is marked as occupied and prevents new orders from being placed at the same table until the current order is served and the table is reset to free)
    await tx.restaurantTable.update({
      where: { id: table_id },
      data:  { status: 'ordering' },
    })

    return newOrder
  })

  // 7. Write notification record for customer (this allows the frontend to display a notification in the customer's order history or notifications section, confirming that their order was received and is being processed)
  await prisma.notification.create({
    data: {
      order_id: order.id,
      type:     'received',
      message:  'Your order has been received. The kitchen has been notified.',
    }
  })
  // Broadcast new order to kitchen and waiters (this allows kitchen staff and waiters to see new orders in real-time without needing to refresh or poll for updates, improving efficiency and responsiveness in the order processing workflow)
  try {
    const broadcast = getBroadcast()
    broadcast.newOrder({
      orderId:     order.id,
      tableId:     order.table_id,
      tableNumber: order.table.table_number,
      items:       order.items.map(i => ({
        name: i.item_name,
        qty:  i.quantity,
      })),
      notes:     order.special_notes,
      createdAt: order.created_at,
    })
  } catch (e) {
    // Don't fail the order if Socket broadcast fails — just log the error for debugging purposes (this ensures that even if there are temporary issues with the Socket server, customers can still place orders successfully, and the issue can be investigated and resolved without impacting the core functionality of the ordering system)
    console.error('Broadcast error:', e.message)
  }

  // Issue fresh session token (resets on each order)
  const { token: fresh_session_token, expiresAt: session_expires_at } =
    issueCustomerSession(table_id)

  return { ...order, session_token: fresh_session_token, session_expires_at }
}

//  Get orders (role-filtered) — kitchen sees all except served, waiters see all except served, managers see all
export async function fetchOrders(role) {
  const where = role === 'kitchen'
    ? { status: { not: 'served' } }
    : role === 'waiter'
    ? { status: { not: 'served' } }
    : {}  // manager sees all 

  return prisma.order.findMany({
    where,
    include: {
      items: {
        include: { menu_item: { select: { name: true } } }
      },
      table: { select: { table_number: true } },
    },
    orderBy: { created_at: 'asc' },
  })
}

//  Get single order with details  (this is used for order details view for waiters and managers, and for customers to view their own order history)
export async function fetchOrderById(id) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      table: { select: { table_number: true } },
      notifications: {
        orderBy: { created_at: 'asc' }
      },
    },
  })
  if (!order) notFound('Order')
  return order
}

//  Update order status (this is used by waiters and kitchen staff to update the status of an order as it progresses through the preparation and serving process, and by managers to update status if needed for any reason)
export async function changeOrderStatus(orderId, newStatus, userId) {
  // 1. Validate new status value (this prevents invalid status values from being set, which could cause confusion and errors in the order processing workflow, and provides clear feedback to the client if they attempt to set an invalid status)
  const validStatuses = ['new','preparing','ready','served']
  if (!validStatuses.includes(newStatus)) {
    const err = new Error(
      `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    )
    err.status = 400
    throw err
  }

  // 2. Fetch current order to get current status and validate it exists — this is necessary to enforce valid state machine transitions and to ensure we have the current status for logging and notifications
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) notFound('Order')

  // 3. Validate state machine transition (this prevents invalid status changes that could cause confusion or errors in the order processing workflow, such as skipping directly from "new" to "ready" without going through "preparing", or trying to move back from "ready" to "preparing")
  const allowed = ALLOWED_TRANSITIONS[order.status]
  if (!allowed.includes(newStatus)) {
    const err = new Error(
      `Cannot move order from "${order.status}" to "${newStatus}"`
    )
    err.status = 400
    throw err
  }

  // 4. Update order + write status log in a transaction (this ensures that the order status update and the corresponding log entry are atomic, preventing inconsistencies in the database if something goes wrong during the update process)
  const updated = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data:  {
        status:    newStatus,
        served_by: newStatus === 'served' ? userId : undefined,
      },
      include: {
        table: { select: { table_number: true, id: true } },
        items: true,
      },
    })

    await tx.orderStatusLog.create({
      data: {
        order_id:   orderId,
        status:     newStatus,
        changed_by: userId,
      }
    })

    // If served, reset table to free.
    if (newStatus === 'served') {
      await tx.restaurantTable.update({
        where: { id: updatedOrder.table.id },
        data:  { status: 'free' },
      })
    }

    return updatedOrder
  })

  // 5. Write notification for customer (this allows the frontend to display real-time updates to the customer about the status of their order, improving the customer experience by keeping them informed about the progress of their order without needing to refresh or check manually)
  const notifMessages = {
    preparing: 'Your food is being prepared in the kitchen.',
    ready:     'Your food is on its way — expect it at your table in about 2 minutes!',
    served:    'Your order has been served. Enjoy your meal!',
  }

  if (notifMessages[newStatus]) {
    await prisma.notification.create({
      data: {
        order_id: orderId,
        type:     newStatus,
        message:  notifMessages[newStatus],
      }
    })
  }
  // Broadcast status change to the right rooms (this allows the relevant parties to receive real-time updates about the status of the order without needing to refresh or poll for updates, improving efficiency and responsiveness in the order processing workflow)
  try {
    const broadcast = getBroadcast()
    const tableNumber = updated.table.table_number

    if (newStatus === 'served') {
      broadcast.orderServed(tableNumber, {
        orderId:     orderId,
        tableId:     updated.table_id,
        servedAt:    new Date().toISOString(),
      })
    } else {
      const messages = {
        preparing: 'Your food is being prepared in the kitchen.',
        ready:     'Your food is on its way — about 2 minutes!',
      }
      broadcast.orderStatusUpdated(tableNumber, {
        orderId:  orderId,
        status:   newStatus,
        message:  messages[newStatus] || '',
      })
    }
  } catch (e) {
    console.error('Broadcast error:', e.message)
  }

  return updated
}

//  Order history (manager) (this allows managers to view historical orders for reporting, auditing, and analysis purposes, and to filter by date range to focus on specific time periods)
export async function fetchOrderHistory({ from, to, limit, offset }) {
  const where = {}
  if (from || to) {
    where.created_at = {}
    if (from) where.created_at.gte = new Date(from)
    if (to)   where.created_at.lte = new Date(to)
  }

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        table: { select: { table_number: true } },
      },
      orderBy: { created_at: 'desc' },
      take:    limit,
      skip:    offset,
    }),
    prisma.order.count({ where }),
  ])

  return { orders, total, limit, offset }
}