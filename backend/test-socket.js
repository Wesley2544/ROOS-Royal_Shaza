import { io } from 'socket.io-client'

const SERVER = 'http://localhost:3001'

// Simulate CUSTOMER at table 4 — this client will receive real-time updates about their order status and when their food is served
const customer = io(SERVER, { transports: ['websocket'] })

customer.on('connect', () => {
  console.log(' Customer connected:', customer.id)
  customer.emit('join_room', { room: 'table-4' })
})

customer.on('room_joined', (data) => {
  console.log(' Customer joined room:', data.room)
})

customer.on('order_status_updated', (data) => {
  console.log(' Customer received status update:', data)
})

customer.on('order_served', (data) => {
  console.log(' Customer received served notification:', data)
})

//  Simulate KITCHEN screen — this client will receive new orders in real-time as they are placed by customers, allowing kitchen staff to see incoming orders immediately and start preparing them without delay 
const kitchen = io(SERVER, { transports: ['websocket'] })

kitchen.on('connect', () => {
  console.log('Kitchen connected:', kitchen.id)
  kitchen.emit('join_room', { room: 'kitchen' })
})

kitchen.on('room_joined', (data) => {
  console.log('Kitchen joined room:', data.room)
})

kitchen.on('new_order', (data) => {
  console.log('Kitchen received new order:', JSON.stringify(data, null, 2))
})

//  Simulate WAITER screen — this client will receive new orders in real-time as they are placed by customers, and will also receive updates when the kitchen changes the status of an order (e.g. from "preparing" to "ready"), allowing waiters to know immediately when an order is ready to be served and to keep track of the status of all their tables' orders in real-time
const waiter = io(SERVER, { transports: ['websocket'] })

waiter.on('connect', () => {
  console.log('Waiter connected:', waiter.id)
  waiter.emit('join_room', { room: 'waiters' })
})

waiter.on('room_joined', (data) => {
  console.log('Waiter joined room:', data.room)
})

waiter.on('new_order', (data) => {
  console.log('Waiter received new order for table:', data.tableNumber)
})

waiter.on('order_status_updated', (data) => {
  console.log('Waiter received status update:', data)
})

//  Error handlers (this will log any connection errors that occur for any of the clients, which can help with debugging connection issues and ensuring that all clients are able to connect successfully to the server)
;[customer, kitchen, waiter].forEach(s => {
  s.on('connect_error', (err) => {
    console.error('Connection error:', err.message)
  })
})

console.log('\nAll three clients connecting...\n')
console.log('Now place an order using curl in another terminal.')
console.log('You should see the new_order event appear here.\n')