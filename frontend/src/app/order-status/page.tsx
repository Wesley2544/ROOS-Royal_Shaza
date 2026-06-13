'use client'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import apiClient from '@/lib/apiClient'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import { formatPrice } from '@/utils/format'
import StatusProgressBar  from '@/components/orders/StatusProgressBar'
import NotificationBanner from '@/components/orders/NotificationBanner'
import LoadingSpinner     from '@/components/ui/LoadingSpinner'
import ErrorMessage       from '@/components/ui/ErrorMessage'

interface OrderItem {
  item_name:  string
  quantity:   number
  unit_price: number
  subtotal:   number
}

interface Notification {
  id:         string
  type:       string
  message:    string
  created_at: string
}

interface Order {
  id:            string
  status:        string
  total_amount:  number
  special_notes: string | null
  items:         OrderItem[]
  notifications: Notification[]
  table:         { table_number: number }
}

const STATUS_MESSAGES: Record<string, string> = {
  new:       'Your order has been received. The kitchen has been notified.',
  preparing: 'Your food is being prepared in the kitchen.',
  ready:     'Your food is on its way to your table!',
  served:    'Your order has been served. Enjoy your meal!',
}

const STATUS_HEADINGS: Record<string, string> = {
  new:       'Order received',
  preparing: 'Being prepared in kitchen',
  ready:     'On its way to your table',
  served:    'Served — enjoy your meal!',
}

export default function OrderStatusPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const orderId      = searchParams.get('orderId')
  const tableNumber  = searchParams.get('table') || '1'

  const [order,          setOrder]          = useState<Order | null>(null)
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')
  const [latestNotif,    setLatestNotif]    = useState<Notification | null>(null)
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null)

  // Load order on mount
  useEffect(() => {
    if (!orderId) {
      router.replace('/menu?table=1')
      return
    }

    async function loadOrder() {
      try {
        const [orderRes, notifRes] = await Promise.all([
          apiClient.get(`/orders/${orderId}`),
          apiClient.get(`/notifications?order_id=${orderId}`),
        ])
        const orderData = orderRes.data
        orderData.notifications = notifRes.data
        setOrder(orderData)

        // Show the latest notification on load
        if (notifRes.data.length > 0) {
          setLatestNotif(notifRes.data[notifRes.data.length - 1])
        }
      } catch (err) {
        setError('Could not load your order. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderId, router])

  // Connect to Socket.io room for this table
  useEffect(() => {
    if (!tableNumber) return

    const socket = connectSocket(`table-${tableNumber}`)
    socketRef.current = socket

    // Listen for status updates
    socket.on('order_status_updated', (data: any) => {
      if (data.orderId !== orderId) return
      setOrder(prev => prev ? { ...prev, status: data.status } : prev)
      setLatestNotif({
        id:         Date.now().toString(),
        type:       data.status,
        message:    data.message || STATUS_MESSAGES[data.status],
        created_at: new Date().toISOString(),
      })
    })

    // Listen for served event
    socket.on('order_served', (data: any) => {
      if (data.orderId !== orderId) return
      setOrder(prev => prev ? { ...prev, status: 'served' } : prev)
      setLatestNotif({
        id:         Date.now().toString(),
        type:       'served',
        message:    STATUS_MESSAGES.served,
        created_at: new Date().toISOString(),
      })
    })

    return () => {
      socket.off('order_status_updated')
      socket.off('order_served')
    }
  }, [tableNumber, orderId])

  if (loading) return <LoadingSpinner message="Loading your order…" />
  if (error)   return <ErrorMessage message={error} onRetry={() => window.location.reload()} />
  if (!order)  return <ErrorMessage message="Order not found." />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#F5F9FE] border-b border-[#E0EAF5] px-4 py-3 flex items-center justify-between">
        <span className="text-base font-bold text-[#1A3C5E]">Order tracker</span>
        <span className="text-xs text-gray-500">
          #{order.id.slice(-6).toUpperCase()} · Table {order.table.table_number}
        </span>
      </div>

      {/* Live notification banner */}
      {latestNotif && (
        <NotificationBanner
          message={latestNotif.message}
          type={latestNotif.type}
        />
      )}

      {/* Progress section */}
      <div className="bg-[#F5F9FE] border-b border-[#E0EAF5] px-4 py-5">
        <StatusProgressBar status={order.status} />
        <div className="mt-4">
          <div className="text-sm font-bold text-[#1A3C5E]">
            {STATUS_HEADINGS[order.status] || order.status}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {STATUS_MESSAGES[order.status]}
          </div>
        </div>
      </div>

      {/* Order items */}
      <div className="px-4 py-4 space-y-3">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Your order
            </span>
          </div>
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 ${idx % 2 === 1 ? 'bg-gray-50' : ''}`}
            >
              <span className="text-sm text-gray-700">
                {item.item_name}
                <span className="text-gray-400 ml-1">×{item.quantity}</span>
              </span>
              <span className="text-sm font-semibold text-[#1A3C5E]">
                {formatPrice(item.subtotal)}
              </span>
            </div>
          ))}
          <div className="flex justify-between items-center px-4 py-3 border-t-2 border-[#1A3C5E]">
            <span className="text-sm font-bold text-[#1A3C5E]">Total</span>
            <span className="text-sm font-bold text-[#1A3C5E]">
              {formatPrice(order.total_amount)}
            </span>
          </div>
        </div>

        {/* Special notes */}
        {order.special_notes && (
          <div className="bg-white rounded-xl shadow-sm px-4 py-3">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Your notes
            </div>
            <div className="text-sm text-gray-600 italic">
              {order.special_notes}
            </div>
          </div>
        )}

        {/* Notification history */}
        {order.notifications.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Updates
              </span>
            </div>
            {[...order.notifications].reverse().map(notif => (
              <div
                key={notif.id}
                className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0"
              >
                <span className="text-base mt-0.5">
                  {notif.type === 'received'  ? '🔔' :
                   notif.type === 'preparing' ? '👨‍🍳' :
                   notif.type === 'ready'     ? '🍽'  : '✅'}
                </span>
                <div>
                  <div className="text-sm text-gray-700">{notif.message}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(notif.created_at).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New order button (shown when served) */}
        {order.status === 'served' && (
          <button
            onClick={() => router.push(`/menu?table=${order.table.table_number}`)}
            className="w-full py-3 bg-[#1A3C5E] text-white rounded-xl font-semibold text-sm hover:bg-[#15324f] transition-colors"
          >
            Order again
          </button>
        )}
      </div>
    </div>
  )
}