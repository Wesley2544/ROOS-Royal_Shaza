import { Router } from 'express'
import prisma from '../lib/prisma.js'
import {
  getAllTables,
  getTableByNumber,
  updateTableStatus,
} from './tables.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/auth.middleware.js'

export const tablesRouter = Router()

//  Public — must be defined BEFORE /:number to avoid conflict with table number route
tablesRouter.get('/by-number/:number', async (req, res, next) => {
  try {
    const tableNumber = parseInt(req.params.number)
    if (isNaN(tableNumber)) {
      return res.status(400).json({ error: 'Invalid table number' })
    }
    const table = await prisma.restaurantTable.findUnique({
      where:  { table_number: tableNumber },
      select: { id: true, table_number: true, status: true },
    })
    if (!table) {
      return res.status(404).json({ error: 'Table not found' })
    }
    res.json(table)
  } catch (err) { next(err) }
})

// Auth-protected routes for waiters and managers
tablesRouter.get('/',
  requireAuth, requireRole('waiter', 'manager'), getAllTables)

tablesRouter.get('/:number',
  requireAuth, requireRole('waiter', 'manager'), getTableByNumber)

tablesRouter.patch('/:id/status',
  requireAuth, requireRole('waiter', 'manager'), updateTableStatus)