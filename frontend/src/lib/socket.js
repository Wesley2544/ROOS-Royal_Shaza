import { io } from 'socket.io-client'

let socket = null
// Singleton pattern to ensure only one socket instance is created
export function getSocket() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      transports:       ['websocket', 'polling'],
      autoConnect:      false,
      reconnection:     true,
      reconnectionDelay:1000,
      reconnectionAttempts: 10,
    })
  }
  return socket
}
// Connect to the socket server and handle events (e.g. join room, connection status)
export function connectSocket(room) {
  const s = getSocket()
  if (!s.connected) {
    s.connect()
  }
  s.on('connect', () => {
    console.log('Socket connected:', s.id)
    if (room) {
      s.emit('join_room', { room })
    }
  })
  s.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason)
  })
  s.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message)
  })
  return s
}
// Disconnect from the socket server and clean up event listeners
export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect()
  }
}