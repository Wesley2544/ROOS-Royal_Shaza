'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import apiClient from '@/lib/apiClient'
import { formatPrice } from '@/utils/format'
import { useUpdateOrderStatus } from '@/hooks/useOrders'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage   from '@/components/ui/ErrorMessage'

interface OrderDetail {
  id:            string
  status:        string
  total_amount:  number
  special_notes: string | null
  created_at:    string
  items: {
    id: string; item_name: string; quantity: number;
    unit_price: number; subtotal: number; item_notes: string | null
  }[]
  table: { table_number: number }
}

const BADGE_STYLE: Record<string, string> = {
  new:       'bg-red-100 text-red-700',
  preparing: 'bg-amber-100 text-amber-700',
  ready:     'bg-green-100 text-green-700',
  served:    'bg-gray-100 text-gray-500',
}

export default function WaiterOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order,   setOrder]   = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F5F9FE] border-b border-[#E0EAF5] px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm font-semibold text-[#185FA5]">
          ← Orders
        </button>
        <span className="text-base font-bold text-[#1A3C5E]">
          Table {order.table.table_number} · #{order.id.slice(-6).toUpperCase()}
        </span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${BADGE_STYLE[order.status]}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <div className="px-4 py-4 space-y-3">

        {/* Items */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Order items</span>
          </div>
          {order.items.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 ${idx % 2 === 1 ? 'bg-gray-50' : ''}`}
            >
              <div>
                <span className="text-sm text-gray-800 font-medium">
                  {item.item_name} <span className="text-gray-400">×{item.quantity}</span>
                </span>
                {item.item_notes && (
                  <div className="text-xs text-gray-400 italic mt-0.5">{item.item_notes}</div>
                )}
              </div>
              <span className="text-sm font-bold text-[#1A3C5E]">{formatPrice(item.subtotal)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center px-4 py-3 border-t-2 border-[#1A3C5E]">
            <span className="text-sm font-bold text-[#1A3C5E]">Total</span>
            <span className="text-sm font-bold text-[#1A3C5E]">{formatPrice(order.total_amount)}</span>
          </div>
        </div>

        {/* Customer notes */}
        {order.special_notes && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Customer notes
            </div>
            <div className="text-sm text-amber-700 italic bg-amber-50 border-l-2 border-amber-400 px-3 py-2 rounded">
              {order.special_notes}
            </div>
          </div>
        )}

        {/* Action */}
        <div className="pt-2">
          {canServe ? (
            <>
              <p className="text-xs text-gray-400 mb-2 text-center">
                Food is ready at the pass — collect and deliver to the table
              </p>
              <button
                onClick={handleMarkServed}
                disabled={updateStatus.isPending}
                className="w-full py-3.5 bg-green-700 text-white rounded-xl font-bold text-sm hover:bg-green-800 disabled:opacity-60 transition-colors"
              >
                {updateStatus.isPending ? 'Updating…' : 'Mark as served ✓'}
              </button>
            </>
          ) : (
            <p className="text-xs text-gray-400 text-center py-3">
              {order.status === 'served'
                ? 'This order has already been served.'
                : 'Waiting for the kitchen to mark this order ready.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}