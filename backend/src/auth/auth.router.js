import { Router } from 'express'
import { login, register, getMe } from './auth.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

export const authRouter = Router()

// Stricter rate limit for auth routes specifically
import rateLimit from 'express-rate-limit'

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // only 10 login attempts per IP per 15 min
  message: { error: 'Too many login attempts, please try again later.' },
})

authRouter.post('/login',    authLimiter, login)
authRouter.post('/register', authLimiter, register)
authRouter.get('/me',        requireAuth, getMe)