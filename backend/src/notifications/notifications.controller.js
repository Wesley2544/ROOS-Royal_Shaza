import { fetchNotifications } from './notifications.service.js'

export async function getNotifications(req, res, next) {
  try {
    const { order_id } = req.query
    const data = await fetchNotifications(order_id)
    res.json(data)
  } catch (err) { next(err) }
}