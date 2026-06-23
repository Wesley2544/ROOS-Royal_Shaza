import prisma from '../lib/prisma.js'
// Service function to fetch summary data for reports
export async function fetchSummary() {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  // Active orders count
  const active_orders = await prisma.order.count({
    where: { status: { not: 'served' } }
  })

  // Tables currently occupied
  const tables_occupied = await prisma.restaurantTable.count({
    where: { status: { not: 'free' } }
  })

  // Today's served orders for revenue and wait time
  const todaysOrders = await prisma.order.findMany({
    where: {
      created_at: { gte: startOfToday },
    },
    include: { items: { include: { menu_item: { include: { category: true } } } } },
  })

  const servedToday = todaysOrders.filter(o => o.status === 'served')
  const revenue_today = servedToday.reduce((sum, o) => sum + o.total_amount, 0)

  // Average wait time (created_at to updated_at) for served orders
  const avg_wait_minutes = servedToday.length
    ? Math.round(
        servedToday.reduce((sum, o) => {
          const mins = (new Date(o.updated_at) - new Date(o.created_at)) / 1000 / 60
          return sum + mins
        }, 0) / servedToday.length
      )
    : 0

  // Top items today
  const itemCounts = {}
  todaysOrders.forEach(order => {
    order.items.forEach(item => {
      itemCounts[item.item_name] = (itemCounts[item.item_name] || 0) + item.quantity
    })
  })
  const top_items = Object.entries(itemCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Revenue by category (served orders only)
  const categoryRevenue = {}
  servedToday.forEach(order => {
    order.items.forEach(item => {
      const catName = item.menu_item?.category?.name || 'Other'
      categoryRevenue[catName] = (categoryRevenue[catName] || 0) + item.subtotal
    })
  })
  const revenue_by_category = Object.entries(categoryRevenue)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)

  return {
    active_orders,
    tables_occupied,
    avg_wait_minutes,
    revenue_today,
    top_items,
    revenue_by_category,
  }
}