export function createBroadcasters(io) {
  return {
    // New order — notify kitchen and waiters (but not customers, since they just placed the order and don't need a notification)
    newOrder(orderData) {
      io.to('kitchen').to('waiters').emit('new_order', orderData)
    },

    // Status changed — notify customer table + waiters (but not kitchen, since they already know)
    orderStatusUpdated(tableNumber, payload) {
      io.to(`table-${tableNumber}`)
        .to('waiters')
        .emit('order_status_updated', payload)
    },

    // Order served — notify customer + kitchen + managers (so they can update inventory, etc.)
    orderServed(tableNumber, payload) {
      io.to(`table-${tableNumber}`)
        .to('kitchen')
        .to('managers')
        .emit('order_served', payload)
    },

    // Menu item availability changed — notify all rooms (waiters, kitchen, customers)
    menuUpdated(payload) {
      io.emit('menu_updated', payload)
    },
  }
}