import { Router } from 'express'
import { getSummary } from './reports.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

export const reportsRouter = Router()

reportsRouter.get('/summary',
  requireAuth, requireRole('manager'), getSummary)