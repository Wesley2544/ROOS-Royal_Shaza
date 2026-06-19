'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useTables } from '@/hooks/useTables'
import { connectSocket } from '@/lib/socket'
import TableCell from '@/components/waiter/TableCell'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage   from '@/components/ui/ErrorMessage'

export default function TableMapPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: tables, isLoading, error } = useTables()

  useEffect(() => {
    const socket = connectSocket('waiters')
    socket.on('new_order',            () => queryClient.invalidateQueries({ queryKey: ['tables'] }))
    socket.on('order_status_updated', () => queryClient.invalidateQueries({ queryKey: ['tables'] }))
    socket.on('order_served',         () => queryClient.invalidateQueries({ queryKey: ['tables'] }))
    return () => {
      socket.off('new_order')
      socket.off('order_status_updated')
      socket.off('order_served')
    }
  }, [queryClient])

  if (isLoading) return <LoadingSpinner message="Loading table map…" />
  if (error)     return <ErrorMessage message="Could not load tables." onRetry={() => window.location.reload()} />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-[#F5F9FE] border-b border-[#E0EAF5] px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm font-semibold text-[#185FA5]">
          ← Orders
        </button>
        <span className="text-base font-bold text-[#1A3C5E]">Table map</span>
        <span className="text-xs text-gray-400">{tables?.length || 0} tables</span>
      </div>

      <div className="grid grid-cols-4 gap-2.5 p-4">
        {tables?.map(table => (
          <TableCell
            key={table.id}
            table={table}
            onClick={() => {
              const activeOrder = table.orders.find(o => o.status !== 'served')
              if (activeOrder) router.push(`/waiter/order/${activeOrder.id}`)
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-200 flex-wrap">
        {[
          ['bg-blue-50 border-blue-200',  'Active'],
          ['bg-green-50 border-green-300','Ready'],
          ['bg-amber-50 border-amber-200','Waiting'],
          ['bg-gray-50 border-gray-200',  'Free'],
        ].map(([cls, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded border-2 ${cls}`} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}