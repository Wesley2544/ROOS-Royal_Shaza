'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import apiClient from '@/lib/apiClient'
import { formatPrice } from '@/utils/format'
import { useUpdateOrderStatus } from '@/hooks/useOrders'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage   from '@/components/ui/ErrorMessage'

interface OrderDetail {
  id: string; status: string; total_amount: number; special_notes: string | null; created_at: string
  items: { id: string; item_name: string; quantity: number; unit_price: number; subtotal: number; item_notes: string | null }[]
  table: { table_number: number }
}

const BADGE_STYLE: Record<string, string> = {
  new: 'bg-red-200 text-red-800',
  preparing: 'bg-amber-200 text-amber-800',
  ready: 'bg-green-200 text-green-800',
  served: 'bg-gray-100 text-gray-500',
}

export default function WaiterOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const updateStatus = useUpdateOrderStatus()

  useEffect(() => {
    async function load() {
      try {
        const res = await apiClient.get(`/orders/${orderId}`)
        setOrder(res.data)
      } catch {
        setError('Could not load this order.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId])

  async function handleMarkServed() {
    try {
      await updateStatus.mutateAsync({ orderId, status: 'served' })
      router.push('/waiter')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not mark as served.')
    }
  }

  if (loading) return <LoadingSpinner message="Loading order…" />
  if (error)   return <ErrorMessage message={error} onRetry={() => window.location.reload()} />
  if (!order)  return <ErrorMessage message="Order not found." />

  const canServe = order.status === 'ready'

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="sticky top-0 z-10 bg-white border-b border-[#E5E5E5] px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm font-bold text-[#0A0A0A]">← Orders</button>
        <span className="text-base font-extrabold text-[#0A0A0A]">Table {order.table.table_number} · #{order.id.slice(-6).toUpperCase()}</span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${BADGE_STYLE[order.status]}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <div className="px-4 py-4 space-y-3">

        <div className="bg-white rounded-[18px] border border-[#E5E5E5] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E5E5]">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Order items</span>
          </div>
          {order.items.map((item, idx) => (
            <div key={item.id} className={`flex items-center justify-between px-4 py-3 border-b border-[#E5E5E5] last:border-0 ${idx % 2 === 1 ? 'bg-[#F5F5F5]' : ''}`}>
              <div>
                <span className="text-sm text-[#0A0A0A] font-medium">{item.item_name} <span className="text-gray-400">×{item.quantity}</span></span>
                {item.item_notes && <div className="text-xs text-gray-400 italic mt-0.5">{item.item_notes}</div>}
              </div>
              <span className="text-sm font-bold text-[#0A0A0A]">{formatPrice(item.subtotal)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center px-4 py-3 border-t-2 border-[#0A0A0A]">
            <span className="text-sm font-bold text-[#0A0A0A]">Total</span>
            <span className="text-sm font-bold text-[#0A0A0A]">{formatPrice(order.total_amount)}</span>
          </div>
        </div>

        {order.special_notes && (
          <div className="bg-white rounded-[18px] border border-[#E5E5E5] shadow-sm p-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Customer notes</div>
            <div className="text-sm text-amber-800 italic bg-amber-100 border-l-[3px] border-amber-500 px-3 py-2 rounded">
              {order.special_notes}
            </div>
          </div>
        )}

        <div className="pt-2">
          {canServe ? (
            <>
              <p className="text-xs text-gray-400 mb-2 text-center">Food is ready at the pass — collect and deliver to the table</p>
              <button
                onClick={handleMarkServed} disabled={updateStatus.isPending}
                className="w-full py-3.5 bg-green-700 text-white rounded-[18px] font-bold text-sm hover:bg-green-800 disabled:opacity-60 transition-colors"
              >
                {updateStatus.isPending ? 'Updating…' : 'Mark as served ✓'}
              </button>
            </>
          ) : (
            <p className="text-xs text-gray-400 text-center py-3">
              {order.status === 'served' ? 'This order has already been served.' : 'Waiting for the kitchen to mark this order ready.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}