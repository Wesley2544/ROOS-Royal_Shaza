import { Router } from 'express'
import {
  getCategories,
  getItems,
  getItemById,
  createItem,
  updateItem,
  toggleAvailability,
  deleteItem,
  createCategory,
  updateCategory,
} from './menu.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/auth.middleware.js'

export const menuRouter = Router()

// ── Public routes (no auth — customer menu) ───────────────────
menuRouter.get('/categories',   getCategories)
menuRouter.get('/items',        getItems)
menuRouter.get('/items/:id',    getItemById)

// ── Manager only routes ────────────
menuRouter.post('/items',
  requireAuth, requireRole('manager'), createItem)

menuRouter.put('/items/:id',
  requireAuth, requireRole('manager'), updateItem)

menuRouter.patch('/items/:id/availability',
  requireAuth, requireRole('manager'), toggleAvailability)

menuRouter.delete('/items/:id',
  requireAuth, requireRole('manager'), deleteItem)

menuRouter.post('/categories',
  requireAuth, requireRole('manager'), createCategory)

menuRouter.put('/categories/:id',
  requireAuth, requireRole('manager'), updateCategory)