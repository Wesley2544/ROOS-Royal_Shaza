import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { login, register, getMe } from './auth.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

export const authRouter = Router()

const authLimiter = process.env.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: { error: 'Too many login attempts, please try again later.' },
    })

authRouter.post('/login',    authLimiter, login)
authRouter.post('/register', authLimiter, register)
authRouter.get('/me',        requireAuth, getMe)