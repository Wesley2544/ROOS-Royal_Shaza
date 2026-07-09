import prisma from '../lib/prisma.js'

function getDateRange(range) {
  const now = new Date()
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  if (range === 'week') {
    start.setDate(start.getDate() - 6)
  } else if (range === 'month') {
    start.setDate(1)
  }
  return { start, end: now }
}

export async function fetchSummary(range = 'today') {
  const { start } = getDateRange(range)

  const active_orders = await prisma.order.count({
    where: { is_deleted: false, status: { not: 'served' } }
  })

  const tables_occupied = await prisma.restaurantTable.count({
    where: { status: { not: 'free' } }
  })

  const rangeOrders = await prisma.order.findMany({
    where: { is_deleted: false, created_at: { gte: start } },
    include: {
      items: { include: { menu_item: { include: { category: true } } } },
      waiter: { select: { id: true, name: true } },
    },
  })

  const servedOrders = rangeOrders.filter(o => o.status === 'served')
  const revenue_today = servedOrders.reduce((sum, o) => sum + o.total_amount, 0)

  const avg_wait_minutes = servedOrders.length
    ? Math.round(
        servedOrders.reduce((sum, o) => {
          const mins = (new Date(o.updated_at) - new Date(o.created_at)) / 1000 / 60
          return sum + mins
        }, 0) / servedOrders.length
      )
    : 0

  const total_orders = rangeOrders.length

  const itemCounts = {}
  rangeOrders.forEach(order => {
    order.items.forEach(item => {
      itemCounts[item.item_name] = (itemCounts[item.item_name] || 0) + item.quantity
    })
  })
  const top_items = Object.entries(itemCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const categoryRevenue = {}
  servedOrders.forEach(order => {
    order.items.forEach(item => {
      const catName = item.menu_item?.category?.name || 'Other'
      categoryRevenue[catName] = (categoryRevenue[catName] || 0) + item.subtotal
    })
  })
  const revenue_by_category = Object.entries(categoryRevenue)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)

  const staffMap = {}
  servedOrders.forEach(o => {
    if (!o.waiter) return
    const key = o.waiter.id
    if (!staffMap[key]) {
      staffMap[key] = { name: o.waiter.name, orders: 0, totalWaitMins: 0, revenue: 0 }
    }
    staffMap[key].orders += 1
    staffMap[key].totalWaitMins += (new Date(o.updated_at) - new Date(o.created_at)) / 1000 / 60
    staffMap[key].revenue += o.total_amount
  })
  const staff_performance = Object.values(staffMap)
    .map(s => ({
      name: s.name,
      orders: s.orders,
      avg_minutes: Math.round(s.totalWaitMins / s.orders),
      revenue: s.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  return {
    active_orders,
    tables_occupied,
    avg_wait_minutes,
    revenue_today,
    total_orders,
    orders_served: servedOrders.length,
    top_items,
    revenue_by_category,
    staff_performance,
  }
}