import { Server } from 'socket.io'
import { registerSocketEvents } from './socket.events.js'
import { createBroadcasters } from './broadcast.helpers.js'

let io
let broadcast

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin:      process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    // Reconnection settings to improve reliability in case of temporary network issues
    pingTimeout:  60000,
    pingInterval: 25000,
  })

  registerSocketEvents(io)
  broadcast = createBroadcasters(io)

  console.log(' Socket.io server initialised')
  return { io, broadcast }
}

export function getBroadcast() {
  if (!broadcast) {
    throw new Error('Socket not initialised — call initSocket first')
  }
  return broadcast
}

export function getIo() {
  if (!io) {
    throw new Error('Socket not initialised — call initSocket first')
  }
  return io
}