'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useOrders } from '@/hooks/useOrders'
import { useAuth } from '@/hooks/useAuth'
import { connectSocket } from '@/lib/socket'
import OrderListItem  from '@/components/waiter/OrderListItem'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage   from '@/components/ui/ErrorMessage'

const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'new',       label: 'New' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready',     label: 'Ready' },
]

export default function WaiterPage() {
  const router = useRouter()
  const { user, logout } = useAuth(['waiter', 'manager'])
  const queryClient = useQueryClient()
  const { data: orders, isLoading, error } = useOrders()

  const [activeTab, setActiveTab] = useState('all')

  // Socket.io — join waiters room
  useEffect(() => {
    const socket = connectSocket('waiters')

    socket.on('new_order', () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    })
    socket.on('order_status_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    })
    socket.on('order_served', () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    })

    return () => {
      socket.off('new_order')
      socket.off('order_status_updated')
      socket.off('order_served')
    }
  }, [queryClient])

  if (isLoading) return <LoadingSpinner message="Loading orders…" />
  if (error)      return <ErrorMessage message="Could not load orders." onRetry={() => window.location.reload()} />

  const activeOrders = orders?.filter(o => o.status !== 'served') || []
  const filtered = activeTab === 'all'
    ? activeOrders
    : activeOrders.filter(o => o.status === activeTab)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F5F9FE] border-b border-[#E0EAF5] px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-base font-bold text-[#1A3C5E]">Waiter dashboard</div>
          <div className="text-xs text-gray-400 mt-0.5">{user?.role === 'manager' ? 'Manager view' : 'Floor staff'}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
            {activeOrders.length} active
          </span>
          <button
            onClick={() => router.push('/waiter/tables')}
            className="text-xs font-semibold text-[#185FA5] border border-[#185FA5] px-3 py-1.5 rounded-lg hover:bg-blue-50"
          >
            Table map
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-gray-200 bg-white sticky top-[57px] z-10">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.key
                ? 'border-[#1A3C5E] text-[#1A3C5E]'
                : 'border-transparent text-gray-400'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Order list */}
      <div className="bg-white mt-2 mx-2 rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No orders in this view
          </div>
        ) : (
          filtered.map(order => (
            <OrderListItem
              key={order.id}
              order={order}
              onClick={() => router.push(`/waiter/order/${order.id}`)}
            />
          ))
        )}
      </div>
    </div>
  )
}