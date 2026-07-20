'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useOrders } from '@/hooks/useOrders'
import { useAuth } from '@/hooks/useAuth'
import { connectSocket } from '@/lib/socket'
import { playNewOrderAlert } from '@/lib/audioAlert'
import OrderListItem  from '@/components/waiter/OrderListItem'
import RefreshButton  from '@/components/ui/RefreshButton'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage   from '@/components/ui/ErrorMessage'

export default function WaiterPage() {
  const router = useRouter()
  const { user, logout } = useAuth(['waiter', 'manager'])
  const queryClient = useQueryClient()
  const { data: orders, isLoading, error } = useOrders()

  useEffect(() => {
    const socket = connectSocket('waiters')
    socket.on('new_order', () => {
      playNewOrderAlert()
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    })
    socket.on('order_status_updated', () => queryClient.invalidateQueries({ queryKey: ['orders'] }))
    socket.on('order_served', () => queryClient.invalidateQueries({ queryKey: ['orders'] }))
    return () => {
      socket.off('new_order')
      socket.off('order_status_updated')
      socket.off('order_served')
    }
  }, [queryClient])

  if (isLoading) return <LoadingSpinner message="Loading orders…" />
  if (error)      return <ErrorMessage message="Could not load orders." onRetry={() => window.location.reload()} />

  const activeOrders = (orders?.filter(o => o.status !== 'served') || [])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="sticky top-0 z-10 bg-white border-b border-[#E5E5E5] px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-base font-extrabold text-[#0A0A0A]">Waiter dashboard</div>
          <div className="text-xs text-gray-400 mt-0.5">{user?.role === 'manager' ? 'Manager view' : 'Floor staff'}</div>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={() => queryClient.invalidateQueries({ queryKey: ['orders'] })} />
          <span className="bg-[#F4F4F5] text-[#0A0A0A] text-xs font-bold px-3 py-1 rounded-full">{activeOrders.length} active</span>
          <button onClick={() => router.push('/waiter/tables')} className="text-xs font-bold text-[#0A0A0A] border border-[#E5E5E5] px-3 py-1.5 rounded-xl hover:bg-[#F5F5F5]">
            Table map
          </button>
          <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600 ml-1">Sign out</button>
        </div>
      </div>

      <div className="bg-white mt-2 mx-2 rounded-[18px] border border-[#E5E5E5] shadow-sm overflow-hidden">
        {activeOrders.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No active orders</div>
        ) : (
          activeOrders.map(order => (
            <OrderListItem key={order.id} order={order} onClick={() => router.push(`/waiter/order/${order.id}`)} />
          ))
        )}
      </div>
    </div>
  )
}