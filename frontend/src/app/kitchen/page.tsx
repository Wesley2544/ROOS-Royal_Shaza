'use client'
import { useEffect, useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useOrders, useUpdateOrderStatus, Order } from '@/hooks/useOrders'
import { useTicker } from '@/hooks/useTicker'
import { useAuth } from '@/hooks/useAuth'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import { playNewOrderAlert } from '@/lib/audioAlert'
import OrderCard from '@/components/kitchen/OrderCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage   from '@/components/ui/ErrorMessage'

export default function KitchenPage() {
  const { user, logout } = useAuth(['kitchen', 'manager'])
  const queryClient = useQueryClient()
  const { data: orders, isLoading, error } = useOrders()
  const updateStatus = useUpdateOrderStatus()

  const [clock, setClock] = useState('')
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null)

  useTicker(1000) // re-render every second for live elapsed timers

  // Live clock display
  useEffect(() => {
    function tick() {
      setClock(new Date().toLocaleTimeString([], { hour12: false }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Socket.io — join kitchen room, listen for events
  useEffect(() => {
    const socket = connectSocket('kitchen')
    socketRef.current = socket

    socket.on('new_order', () => {
      playNewOrderAlert()
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    })

    socket.on('order_served', () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    })

    return () => {
      socket.off('new_order')
      socket.off('order_served')
    }
  }, [queryClient])

  function handleAdvance(orderId: string, nextStatus: string) {
    updateStatus.mutate({ orderId, status: nextStatus })
  }

  const activeOrders = orders?.filter(o => o.status !== 'served') || []
  const newCount       = activeOrders.filter(o => o.status === 'new').length
  const preparingCount  = activeOrders.filter(o => o.status === 'preparing').length
  const readyCount      = activeOrders.filter(o => o.status === 'ready').length

  if (isLoading) return <LoadingSpinner message="Loading kitchen queue…" />
  if (error)      return <ErrorMessage message="Could not load orders." onRetry={() => window.location.reload()} />

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-[#1A3C5E]">🍳 Kitchen display</span>
          <span className="text-xs text-gray-400">Royal Shaza Suites</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-gray-500">{clock}</span>
          <span className="bg-red-50 text-red-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
            {newCount} new
          </span>
          <span className="bg-amber-50 text-amber-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
            {preparingCount} preparing
          </span>
          <span className="bg-green-50 text-green-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
            {readyCount} ready
          </span>
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-gray-600 ml-2"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Order grid — responsive: 2 cols tablet, 3 laptop, 4 PC, 5 wide monitor */}
      {activeOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <div className="text-4xl mb-3">✓</div>
          <div className="text-sm">No active orders — all caught up</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-5">
          {activeOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onAdvance={handleAdvance}
              isUpdating={updateStatus.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}