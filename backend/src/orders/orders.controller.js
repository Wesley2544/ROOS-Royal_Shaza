import {
  createOrder,
  fetchOrders,
  fetchOrderById,
  changeOrderStatus,
  fetchOrderHistory,
} from './orders.service.js'

export async function placeOrder(req, res, next) {
  try {
    const data = await createOrder(req.body)
    res.status(201).json(data)
  } catch (err) { next(err) }
}

export async function getOrders(req, res, next) {
  try {
    const data = await fetchOrders(req.user.role)
    res.json(data)
  } catch (err) { next(err) }
}

export async function getOrderById(req, res, next) {
  try {
    const data = await fetchOrderById(req.params.id)
    res.json(data)
  } catch (err) { next(err) }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const data = await changeOrderStatus(
      req.params.id,
      req.body.status,
      req.user.userId
    )
    res.json(data)
  } catch (err) { next(err) }
}

export async function getOrderHistory(req, res, next) {
  try {
    const { from, to, limit = '20', offset = '0' } = req.query
    const data = await fetchOrderHistory({ from, to,
      limit: parseInt(limit), offset: parseInt(offset) })
    res.json(data)
  } catch (err) { next(err) }
}