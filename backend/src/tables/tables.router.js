import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { checkTableSession, startTableSession } from '../lib/customerSession.js'
import {
  getAllTables,
  getTableByNumber,
  updateTableStatus,
} from './tables.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/auth.middleware.js'

export const tablesRouter = Router()

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

    const session = await checkTableSession(table.id)

    res.json({
      ...table,
      session_active: session.active,
      session_token: session.token,
      session_expires_at: session.expiresAt,
    })
  } catch (err) { next(err) }
})

tablesRouter.post('/:id/start-session', async (req, res, next) => {
  try {
    const table = await prisma.restaurantTable.findUnique({ where: { id: req.params.id } })
    if (!table) {
      return res.status(404).json({ error: 'Table not found' })
    }
    const { token, expiresAt } = await startTableSession(table.id)
    res.json({ session_token: token, session_expires_at: expiresAt })
  } catch (err) { next(err) }
})

tablesRouter.get('/',
  requireAuth, requireRole('waiter', 'manager'), getAllTables)

tablesRouter.get('/:number',
  requireAuth, requireRole('waiter', 'manager'), getTableByNumber)

tablesRouter.patch('/:id/status',
  requireAuth, requireRole('waiter', 'manager'), updateTableStatus)