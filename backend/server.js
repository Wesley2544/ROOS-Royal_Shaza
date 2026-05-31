import 'dotenv/config'
import { z } from 'zod'
import { createServer } from 'http'

//  Validate required env variables 
const envSchema = z.object({
  DATABASE_URL:   z.string().min(1),
  JWT_SECRET:     z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('24h'),
  PORT:           z.string().default('3001'),
  NODE_ENV:       z.string().default('development'),
  CORS_ORIGIN:    z.string().default('http://localhost:3000'),
})

const env = envSchema.safeParse(process.env)
if (!env.success) {
  console.error('Missing required environment variables:')
  console.error(env.error.format())
  process.exit(1)
}

import app from './app.js'
import { initSocket } from './src/socket/socket.server.js'

const PORT       = process.env.PORT || 3001
const httpServer = createServer(app)

// Attach Socket.io to the same HTTP server as Express so they can share the same port and handle both HTTP and WebSocket traffic seamlessly
initSocket(httpServer)

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV}`)
  console.log(`Socket.io ready`)
})