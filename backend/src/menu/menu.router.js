import { Router } from 'express'
import {
  getCategories,
  getItems,
  getItemById,
  createItem,
  updateItem,
  toggleAvailability,
  deleteItem,
  postCategory,
  putCategory,
} from './menu.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/auth.middleware.js'
import { uploadMiddleware, uploadItemImage } from './menu.image.js'

export const menuRouter = Router()

menuRouter.get('/items/all',
  requireAuth, requireRole('manager'), async (req, res, next) => {
    try {
      const items = await import('../lib/prisma.js').then(m => m.default.menuItem.findMany({
        where: { is_deleted: false },
        include: { category: { select: { id: true, name: true } } },
        orderBy: { name: 'asc' },
      }))
      res.json(items)
    } catch (err) { next(err) }
  })
  
//  Public routes (no auth — customer menu) 
menuRouter.get('/categories',   getCategories)
menuRouter.get('/items',        getItems)
menuRouter.get('/items/:id',    getItemById)

// ── Manager only routes (require auth + manager role)
menuRouter.post('/items',
  requireAuth, requireRole('manager'), createItem)

menuRouter.put('/items/:id',
  requireAuth, requireRole('manager'), updateItem)

menuRouter.patch('/items/:id/availability',
  requireAuth, requireRole('manager'), toggleAvailability)

menuRouter.delete('/items/:id',
  requireAuth, requireRole('manager'), deleteItem)

menuRouter.post('/categories',
  requireAuth, requireRole('manager'), postCategory)

menuRouter.put('/categories/:id',
  requireAuth, requireRole('manager'), putCategory)
menuRouter.post('/items/:id/image', 
  requireAuth, requireRole('manager'), uploadMiddleware, uploadItemImage)
