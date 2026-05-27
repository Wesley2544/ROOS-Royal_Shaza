import { Router } from 'express'
import prisma from '../lib/prisma.js'

export const healthRouter = Router()

healthRouter.get('/', async (req, res) => {
  try {
    // Ping the database to confirm it is reachable and responsive
    await prisma.$queryRaw`SELECT 1`
    res.json({
      status:    'ok',
      timestamp: new Date().toISOString(),
      database:  'connected',
      uptime:    Math.floor(process.uptime()) + 's',
    })
  } catch (err) {
    res.status(503).json({
      status:   'error',
      database: 'unreachable',
      message:  err.message,
    })
  }
})