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
    socket.on('new_order', () => queryClient.invalidateQueries({ queryKey: ['tables'] }))
    socket.on('order_status_updated', () => queryClient.invalidateQueries({ queryKey: ['tables'] }))
    socket.on('order_served', () => queryClient.invalidateQueries({ queryKey: ['tables'] }))
    return () => {
      socket.off('new_order')
      socket.off('order_status_updated')
      socket.off('order_served')
    }
  }, [queryClient])

  if (isLoading) return <LoadingSpinner message="Loading table map…" />
  if (error)     return <ErrorMessage message="Could not load tables." onRetry={() => window.location.reload()} />

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="sticky top-0 z-10 bg-white border-b border-[#E5E5E5] px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm font-bold text-[#0A0A0A]">← Orders</button>
        <span className="text-base font-extrabold text-[#0A0A0A]">Table map</span>
        <span className="text-xs text-gray-400">{tables?.length || 0} tables</span>
      </div>

      <div className="grid grid-cols-4 gap-2.5 p-4">
        {tables?.map(table => (
          <TableCell
            key={table.id} table={table}
            onClick={() => {
              const activeOrder = table.orders.find(o => o.status !== 'served')
              if (activeOrder) router.push(`/waiter/order/${activeOrder.id}`)
            }}
          />
        ))}
      </div>

      <div className="flex items-center gap-4 px-4 py-3 border-t border-[#E5E5E5] flex-wrap">
        {[
          ['bg-gray-200', 'Active'],
          ['bg-green-200', 'Ready'],
          ['bg-amber-200', 'Waiting'],
          ['bg-gray-50', 'Free'],
        ].map(([cls, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded border border-[#E5E5E5] ${cls}`} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}