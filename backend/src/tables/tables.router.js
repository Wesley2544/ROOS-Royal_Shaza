import { Router } from 'express'
import {
  getAllTables,
  getTableByNumber,
  updateTableStatus,
} from './tables.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/auth.middleware.js'

export const tablesRouter = Router()

// Waiter and manager can see all tables and their statuses (e.g., for seating guests and managing reservations)
tablesRouter.get('/',
  requireAuth,
  requireRole('waiter', 'manager'),
  getAllTables)

// Get a single table by table number (used for waiter to quickly find a table)
tablesRouter.get('/:number',
  requireAuth,
  requireRole('waiter', 'manager'),
  getTableByNumber)

// Manually update a table status (e.g., set to 'occupied' when guests arrive without reservation)
tablesRouter.patch('/:id/status',
  requireAuth,
  requireRole('waiter', 'manager'),
  updateTableStatus)