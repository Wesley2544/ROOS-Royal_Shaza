import { Router } from 'express'
import { getNotifications } from './notifications.controller.js'

export const notificationsRouter = Router()

// Public — customer tracker loads notification history on page load and then listens for new notifications via WebSocket
notificationsRouter.get('/', getNotifications)