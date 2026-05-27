import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { authRouter } from './src/auth/auth.router.js'
import { menuRouter } from './src/menu/menu.router.js'
import { ordersRouter } from './src/orders/orders.router.js'
import { tablesRouter }        from './src/tables/tables.router.js'
import { healthRouter }        from './src/health/health.router.js'
import { notificationsRouter } from './src/notifications/notifications.router.js'

const app = express()

// Security headers
app.use(helmet())

//  CORS configuration 
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))

//  Body parser with size limit
app.use(express.json({ limit: '10kb' })) // limit body size

// Global rate limiter (applies to all routes)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}))

//  Routes 
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/menu', menuRouter)
app.use('/api/v1/orders', ordersRouter)
app.use('/api/v1/tables', tablesRouter)
app.use('/api/v1/notifications', notificationsRouter)
app.use('/health', healthRouter)
//  Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 handler 
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  const status = err.status || 500
  const message = process.env.NODE_ENV === 'production'
    ? 'Something went wrong'
    : err.message
  res.status(status).json({ error: message })
})

export default app