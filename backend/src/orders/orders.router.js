import { Router } from 'express'
import {
  placeOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getOrderHistory,
  deleteOrder,
} from './orders.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/auth.middleware.js'

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
// ── Manager routes — specific paths BEFORE the /:id catch-all ────
  ordersRouter.delete('/:id',
  requireAuth, requireRole('manager'), deleteOrder)
// ── Public — must come AFTER /history, or /history gets eaten ──
ordersRouter.get('/:id', getOrderById)
// ── Manager routes — must come AFTER /:id, or /:id gets eaten ─────
ordersRouter.delete('/:id', requireAuth, requireRole('manager'), deleteOrder)