import { ROOMS } from './socket.rooms.js'

export function registerSocketEvents(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    // Client tells us which room to join (e.g., 'kitchen', 'waiters', 'managers', or 'table-1')
    socket.on('join_room', (data) => {
      const { room } = data

      // Validate room name before joining 
      const validRooms = [
        ROOMS.kitchen,
        ROOMS.waiters,
        ROOMS.managers,
      ]

      const isTableRoom = typeof room === 'string' &&
        room.startsWith('table-') &&
        !isNaN(room.split('-')[1])

      const isValidRoom = validRooms.includes(room) || isTableRoom

      if (!isValidRoom) {
        socket.emit('error', { message: `Invalid room: ${room}` })
        return
      }

      socket.join(room)
      console.log(`Socket ${socket.id} joined room: ${room}`)
      socket.emit('room_joined', { room })
    })

    // Client disconnects from the server — we can log this for debugging purposes 
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} — ${reason}`)
    })

    // Handle any client-side errors and log them for debugging purposes 
    socket.on('error', (err) => {
      console.error(`Socket error from ${socket.id}:`, err)
    })
  })
}