'use client'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useReportSummary } from '@/hooks/useReports'
import { useOrders } from '@/hooks/useOrders'
import { useTables } from '@/hooks/useTables'
import { connectSocket } from '@/lib/socket'
import { formatPrice } from '@/utils/format'
import { STATUS } from '@/lib/statusStyles'
import StatCard from '@/components/manager/StatCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage   from '@/components/ui/ErrorMessage'
import RefreshButton from '@/components/ui/RefreshButton'

export default function ManagerDashboardPage() {
  const queryClient = useQueryClient()
  const { data: summary, isLoading, error } = useReportSummary()
  const { data: orders }  = useOrders()
  const { data: tables }  = useTables()

  useEffect(() => {
    const socket = connectSocket('managers')
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['report-summary'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    }
    socket.on('new_order', invalidate)
    socket.on('order_served', invalidate)
    socket.on('menu_updated', invalidate)
    return () => {
      socket.off('new_order', invalidate)
      socket.off('order_served', invalidate)
      socket.off('menu_updated', invalidate)
    }
  }, [queryClient])

  if (isLoading) return <LoadingSpinner message="Loading dashboard…" />
  if (error)      return <ErrorMessage message="Could not load dashboard data." onRetry={() => window.location.reload()} />

  const activeOrders = (orders?.filter(o => o.status !== 'served') || [])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)

  const maxTopCount  = Math.max(...(summary?.top_items.map(i => i.count) || [1]))
  const maxCatAmount = Math.max(...(summary?.revenue_by_category.map(c => c.amount) || [1]))

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
  <span className="text-base font-extrabold text-[#0A0A0A]">Dashboard — today</span>
  <div className="flex items-center gap-2">
    <RefreshButton onClick={() => {
      queryClient.invalidateQueries({ queryKey: ['report-summary'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    }} />
    <span className="bg-green-200 text-green-800 text-xs font-bold px-3 py-1 rounded-full">● Live</span>
  </div>
</div>


      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard value={summary?.active_orders ?? 0}             label="Active orders"    color="#DC2626" />
        <StatCard value={summary?.tables_occupied ?? 0}           label="Tables occupied"  color="#0A0A0A" />
        <StatCard value={`${summary?.avg_wait_minutes ?? 0} min`} label="Avg wait"         color="#D97706" />
        <StatCard value={formatPrice(summary?.revenue_today ?? 0)} label="Revenue today"   color="#16A34A" />
      </div>

      <div className="grid grid-cols-2 gap-4">

        <div className="bg-white border border-[#E5E5E5] rounded-[18px] p-4">
          <div className="text-sm font-bold text-[#0A0A0A] mb-3">Active orders</div>
          {activeOrders.length === 0 ? (
            <div className="text-xs text-gray-400 py-6 text-center">No active orders</div>
          ) : (
            <div className="space-y-1.5">
              {activeOrders.map(order => {
                const s = STATUS[order.status]
                return (
                  <div key={order.id} className="flex items-center justify-between text-xs py-1.5 border-b border-[#E5E5E5] last:border-0">
                    <span className="font-bold text-[#0A0A0A] w-8">T{order.table.table_number}</span>
                    <span className="text-gray-400 w-14">#{order.id.slice(-4).toUpperCase()}</span>
                    <span className="text-gray-600 flex-1 truncate px-2">
                      {order.items.map(i => `${i.item_name} ×${i.quantity}`).join(', ')}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${s.bg} ${s.text}`}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-[18px] p-4">
          <div className="text-sm font-bold text-[#0A0A0A] mb-3">Top dishes today</div>
          {summary?.top_items.length === 0 ? (
            <div className="text-xs text-gray-400 py-6 text-center">No data yet today</div>
          ) : (
            <div className="space-y-2.5">
              {summary?.top_items.map(item => (
                <div key={item.name} className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-600 w-28 flex-shrink-0 truncate">{item.name}</span>
                  <div className="flex-1 h-2 bg-[#F4F4F5] rounded-full overflow-hidden">
                    <div className="h-full bg-[#FDC700] rounded-full" style={{ width: `${(item.count / maxTopCount) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-5 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-[18px] p-4">
          <div className="text-sm font-bold text-[#0A0A0A] mb-3">Revenue by category</div>
          {summary?.revenue_by_category.length === 0 ? (
            <div className="text-xs text-gray-400 py-6 text-center">No served orders yet today</div>
          ) : (
            <div className="space-y-2.5">
              {summary?.revenue_by_category.map(cat => (
                <div key={cat.category} className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-600 w-20 flex-shrink-0">{cat.category}</span>
                  <div className="flex-1 h-2 bg-[#F4F4F5] rounded-full overflow-hidden">
                    <div className="h-full bg-green-700 rounded-full" style={{ width: `${(cat.amount / maxCatAmount) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-16 text-right">{formatPrice(cat.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-[18px] p-4">
          <div className="text-sm font-bold text-[#0A0A0A] mb-3">Table status map</div>
          <div className="grid grid-cols-4 gap-1.5">
            {tables?.map(table => {
              const active = table.orders.find(o => o.status !== 'served')
              const isReady = active?.status === 'ready'
              const key = isReady ? 'ready' : table.status === 'free' ? 'free' : 'ordering'
              const s = STATUS[key]
              return (
                <div key={table.id} className={`rounded-lg px-1.5 py-1.5 text-center ${s.bg}`}>
                  <div className={`text-xs font-bold ${s.text}`}>T{table.table_number}</div>
                  <div className={`text-[9px] mt-0.5 ${s.text}`}>{isReady ? 'Ready' : table.status === 'free' ? 'Free' : 'Active'}</div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}