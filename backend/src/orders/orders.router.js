import { Router } from 'express'
import {
  placeOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getOrderHistory,
  deleteOrder,
} from './orders.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

export const ordersRouter = Router()

// ── Public ─────────────────────────────────────────────────────
ordersRouter.post('/', placeOrder)

// ── Staff routes — specific paths BEFORE the /:id catch-all ────
ordersRouter.get('/history',
  requireAuth, requireRole('manager'), getOrderHistory)

ordersRouter.get('/',
  requireAuth, requireRole('kitchen', 'waiter', 'manager'), getOrders)

ordersRouter.patch('/:id/status',
  requireAuth, requireRole('kitchen', 'waiter', 'manager'), updateOrderStatus)

ordersRouter.delete('/:id',
  requireAuth, requireRole('manager'), deleteOrder)

// ── Public — must come AFTER /history, or /history gets eaten ──
ordersRouter.get('/:id', getOrderById)