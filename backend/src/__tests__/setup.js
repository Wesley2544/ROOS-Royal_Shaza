import 'dotenv/config'
import { createServer } from 'http'
import { initSocket }   from '../socket/socket.server.js'
import app              from '../../app.js'
import prisma           from '../lib/prisma.js'

// Create a shared HTTP server with Socket.io for all tests
const httpServer = createServer(app)
initSocket(httpServer)

// Start server on a random available port
let server
beforeAll(async () => {
  await new Promise(resolve => {
    server = httpServer.listen(0, resolve)
  })
  const { port } = server.address()
  process.env.TEST_PORT = port
  console.log(`\n Test server running on port ${port}\n`)
})

afterAll(async () => {
  await prisma.$disconnect()
  await new Promise(resolve => server.close(resolve))
})