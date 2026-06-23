'use client'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useReportSummary } from '@/hooks/useReports'
import { useOrders } from '@/hooks/useOrders'
import { useTables } from '@/hooks/useTables'
import { connectSocket } from '@/lib/socket'
import { formatPrice } from '@/utils/format'
import StatCard from '@/components/manager/StatCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage   from '@/components/ui/ErrorMessage'
// Styles for order status badges
const STATUS_STYLE: Record<string, string> = {
  new:       'bg-red-100 text-red-700',
  preparing: 'bg-amber-100 text-amber-700',
  ready:     'bg-green-100 text-green-700',
}
// Manager dashboard page component
export default function ManagerDashboardPage() {
  const queryClient = useQueryClient()
  const { data: summary, isLoading, error } = useReportSummary()
  const { data: orders }  = useOrders()
  const { data: tables }  = useTables()
// Set up WebSocket connection for real-time updates
  useEffect(() => {
    const socket = connectSocket('managers')
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['report-summary'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    }
    socket.on('new_order',    invalidate)
    socket.on('order_served', invalidate)
    socket.on('menu_updated', invalidate)
    return () => {
      socket.off('new_order',    invalidate)
      socket.off('order_served', invalidate)
      socket.off('menu_updated', invalidate)
    }
  }, [queryClient])
// Handle loading and error states
  if (isLoading) return <LoadingSpinner message="Loading dashboard…" />
  if (error)      return <ErrorMessage message="Could not load dashboard data." onRetry={() => window.location.reload()} />

  const activeOrders = (orders?.filter(o => o.status !== 'served') || [])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)

  const maxTopCount = Math.max(...(summary?.top_items.map(i => i.count) || [1]))
  const maxCatAmount = Math.max(...(summary?.revenue_by_category.map(c => c.amount) || [1]))
// Render the dashboard UI
  return (
    <div className="p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-base font-bold text-[#1A3C5E]">Dashboard — today</span>
        <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">● Live</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard value={summary?.active_orders ?? 0}        label="Active orders"    color="#E24B4A" />
        <StatCard value={summary?.tables_occupied ?? 0}      label="Tables occupied"  color="#1A3C5E" />
        <StatCard value={`${summary?.avg_wait_minutes ?? 0} min`} label="Avg wait"     color="#B45309" />
        <StatCard value={formatPrice(summary?.revenue_today ?? 0)} label="Revenue today" color="#3B6D11" />
      </div>

      <div className="grid grid-cols-2 gap-4">

        {/* Active orders table */}
        <div className="bg-[#F5F9FE] border border-[#E0EAF5] rounded-xl p-4">
          <div className="text-sm font-bold text-[#1A3C5E] mb-3">Active orders</div>
          {activeOrders.length === 0 ? (
            <div className="text-xs text-gray-400 py-6 text-center">No active orders</div>
          ) : (
            <div className="space-y-1.5">
              {activeOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 last:border-0">
                  <span className="font-bold text-[#1A3C5E] w-8">T{order.table.table_number}</span>
                  <span className="text-gray-400 w-14">#{order.id.slice(-4).toUpperCase()}</span>
                  <span className="text-gray-600 flex-1 truncate px-2">
                    {order.items.map(i => `${i.item_name} ×${i.quantity}`).join(', ')}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_STYLE[order.status]}`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top dishes */}
        <div className="bg-[#F5F9FE] border border-[#E0EAF5] rounded-xl p-4">
          <div className="text-sm font-bold text-[#1A3C5E] mb-3">Top dishes today</div>
          {summary?.top_items.length === 0 ? (
            <div className="text-xs text-gray-400 py-6 text-center">No data yet today</div>
          ) : (
            <div className="space-y-2.5">
              {summary?.top_items.map(item => (
                <div key={item.name} className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-600 w-28 flex-shrink-0 truncate">{item.name}</span>
                  <div className="flex-1 h-2 bg-[#E0EAF5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#185FA5] rounded-full"
                      style={{ width: `${(item.count / maxTopCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-5 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue by category */}
        <div className="bg-[#F5F9FE] border border-[#E0EAF5] rounded-xl p-4">
          <div className="text-sm font-bold text-[#1A3C5E] mb-3">Revenue by category</div>
          {summary?.revenue_by_category.length === 0 ? (
            <div className="text-xs text-gray-400 py-6 text-center">No served orders yet today</div>
          ) : (
            <div className="space-y-2.5">
              {summary?.revenue_by_category.map(cat => (
                <div key={cat.category} className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-600 w-20 flex-shrink-0">{cat.category}</span>
                  <div className="flex-1 h-2 bg-[#E0EAF5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-700 rounded-full"
                      style={{ width: `${(cat.amount / maxCatAmount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-16 text-right">{formatPrice(cat.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Table status map */}
        <div className="bg-[#F5F9FE] border border-[#E0EAF5] rounded-xl p-4">
          <div className="text-sm font-bold text-[#1A3C5E] mb-3">Table status map</div>
          <div className="grid grid-cols-4 gap-1.5">
            {tables?.map(table => {
              const active = table.orders.find(o => o.status !== 'served')
              const isReady = active?.status === 'ready'
              const style = isReady
                ? 'bg-green-50 border-green-300 text-green-700'
                : table.status === 'free'
                ? 'bg-gray-50 border-gray-200 text-gray-400'
                : 'bg-blue-50 border-blue-200 text-blue-700'
              return (
                <div key={table.id} className={`rounded-lg border px-1.5 py-1.5 text-center ${style}`}>
                  <div className="text-xs font-bold">T{table.table_number}</div>
                  <div className="text-[9px] mt-0.5">
                    {isReady ? 'Ready' : table.status === 'free' ? 'Free' : 'Active'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}