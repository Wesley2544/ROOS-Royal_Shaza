import { Router } from 'express'
import {
  placeOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getOrderHistory,
} from './orders.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/auth.middleware.js'

export const ordersRouter = Router()

// Public routes 
ordersRouter.post('/',     placeOrder)
ordersRouter.get('/:id',   getOrderById)

// Staff routes 
ordersRouter.get('/',
  requireAuth,
  requireRole('kitchen', 'waiter', 'manager'),
  getOrders)

ordersRouter.patch('/:id/status',
  requireAuth,
  requireRole('kitchen', 'waiter', 'manager'),
  updateOrderStatus)

ordersRouter.get('/history',
  requireAuth,
  requireRole('manager'),
  getOrderHistory)