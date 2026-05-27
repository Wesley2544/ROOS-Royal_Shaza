import prisma from '../lib/prisma.js'

export async function fetchNotifications(order_id) {
  if (!order_id) {
    const err = new Error('order_id query parameter is required')
    err.status = 400
    throw err
  }

  return prisma.notification.findMany({
    where:   { order_id },
    orderBy: { created_at: 'asc' },
  })
}