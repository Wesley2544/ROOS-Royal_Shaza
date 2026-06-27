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
import { reportsRouter } from './src/reports/reports.router.js'
import { usersRouter } from './src/users/users.router.js'

const app = express()

// Security headers
app.use(helmet())

//  CORS configuration 
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

//  Body parser with size limit
app.use(express.json({ limit: '10kb' })) // limit body size

// Global rate limiter (applies to all routes)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,                  // 500 requests per IP per window
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
app.use('/api/v1/reports', reportsRouter)
app.use('/api/v1/users', usersRouter)
//  Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 handler 
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

//  Global error handler 
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${new Date().toISOString()}] ${err.stack}`)
  } else {
    console.error(`[${new Date().toISOString()}] ${err.message}`)
  }

  // Ensure status is always a valid HTTP status code 
  let status = err.status || err.statusCode || 500
  if (typeof status !== 'number' || status < 100 || status > 599) {
    status = 500
  }

  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Something went wrong. Please try again.'
    : err.message || 'Internal server error'

  res.status(status).json({
    error:     message,
    status,
    timestamp: new Date().toISOString(),
    path:      req.path,
  })
})
export default app