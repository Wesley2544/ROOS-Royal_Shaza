import { z } from 'zod'
import prisma from '../lib/prisma.js'

//  Validation schemas 
const orderSchema = z.object({
  table_id: z.string().uuid('Invalid table ID'),
  items: z.array(z.object({
    menu_item_id: z.string().uuid('Invalid menu item ID'),
    quantity:     z.number().int().positive('Quantity must be at least 1'),
    item_notes:   z.string().optional(),
  })).min(1, 'Order must contain at least one item'),
  special_notes: z.string().optional(),
})

//  State machine for order status transitions 
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

//  Place order 
export async function createOrder(body) {
  // 1. Validate input
  const parsed = orderSchema.safeParse(body)
  if (!parsed.success) {
    const err = new Error(parsed.error.errors[0].message)
    err.status = 400
    throw err
  }

  const { table_id, items, special_notes } = parsed.data

  // 2. Confirm table exists
  const table = await prisma.restaurantTable.findUnique({
    where: { id: table_id }
  })
  if (!table) notFound('Table')

  // 3. Fetch all ordered menu items in one query
  const menuItemIds = items.map(i => i.menu_item_id)
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id:           { in: menuItemIds },
      is_available: true,
      is_deleted:   false,
    }
  })

  // 4. Confirm every item exists and is available
  if (menuItems.length !== menuItemIds.length) {
    const err = new Error(
      'One or more items are unavailable or do not exist'
    )
    err.status = 400
    throw err
  }

  // 5. Build order items with locked prices
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

    // Write initial status log entry
    await tx.orderStatusLog.create({
      data: {
        order_id: newOrder.id,
        status:   'new',
      }
    })

    // Update table status to ordering
    await tx.restaurantTable.update({
      where: { id: table_id },
      data:  { status: 'ordering' },
    })

    return newOrder
  })

  // 7. Write notification record
  await prisma.notification.create({
    data: {
      order_id: order.id,
      type:     'received',
      message:  'Your order has been received. The kitchen has been notified.',
    }
  })

  return order
}

//  Get orders (role-filtered) 
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

//  Get single order with details 
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

//  Update order status 
export async function changeOrderStatus(orderId, newStatus, userId) {
  // 1. Validate new status value
  const validStatuses = ['new','preparing','ready','served']
  if (!validStatuses.includes(newStatus)) {
    const err = new Error(
      `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    )
    err.status = 400
    throw err
  }

  // 2. Fetch current order
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) notFound('Order')

  // 3. Validate state machine transition
  const allowed = ALLOWED_TRANSITIONS[order.status]
  if (!allowed.includes(newStatus)) {
    const err = new Error(
      `Cannot move order from "${order.status}" to "${newStatus}"`
    )
    err.status = 400
    throw err
  }

  // 4. Update order + write status log in a transaction
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

    // If served, reset table to free
    if (newStatus === 'served') {
      await tx.restaurantTable.update({
        where: { id: updatedOrder.table.id },
        data:  { status: 'free' },
      })
    }

    return updatedOrder
  })

  // 5. Write notification for customer
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

  return updated
}

//  Order history (manager)
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