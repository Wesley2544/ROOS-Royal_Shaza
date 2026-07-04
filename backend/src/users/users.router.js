import { Router } from 'express'
import {
  getUsers,
  getTrash,
  updateUserStatus,
  deleteUser,
  restoreUserAccount,
  permanentDeleteUser,
} from './users.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

export const usersRouter = Router()

usersRouter.get('/trash', requireAuth, requireRole('manager'), getTrash)
usersRouter.get('/', requireAuth, requireRole('manager'), getUsers)
usersRouter.patch('/:id/status', requireAuth, requireRole('manager'), updateUserStatus)
usersRouter.patch('/:id/restore', requireAuth, requireRole('manager'), restoreUserAccount)
usersRouter.delete('/:id/permanent', requireAuth, requireRole('manager'), permanentDeleteUser)
usersRouter.delete('/:id', requireAuth, requireRole('manager'), deleteUser)