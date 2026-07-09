import { Router } from 'express'
import { getUsers, updateUserStatus } from './users.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

export const usersRouter = Router()

usersRouter.get('/', requireAuth, requireRole('manager'), getUsers)
usersRouter.patch('/:id/status', requireAuth, requireRole('manager'), updateUserStatus)