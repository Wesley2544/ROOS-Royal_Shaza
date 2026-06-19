import { Order } from '@/hooks/useOrders'
import { formatPrice, getElapsedTime, getUrgencyLevel, getUrgencyColor } from '@/utils/format'

interface Props {
  order:        Order
  onAdvance:    (orderId: string, nextStatus: string) => void
  isUpdating:   boolean
}

const NEXT_STATUS: Record<string, string> = {
  new:       'preparing',
  preparing: 'ready',
}

const BUTTON_LABEL: Record<string, string> = {
  new:       'Start preparing',
  preparing: 'Mark ready',
  ready:     'Waiting for waiter',
}

const BADGE_STYLE: Record<string, string> = {
  new:       'bg-red-100 text-red-700',
  preparing: 'bg-amber-100 text-amber-700',
  ready:     'bg-green-100 text-green-700',
}

const BADGE_LABEL: Record<string, string> = {
  new:       'New',
  preparing: 'Preparing',
  ready:     'Ready',
}

export default function OrderCard({ order, onAdvance, isUpdating }: Props) {
  const urgency      = getUrgencyLevel(order.created_at, order.status)
  const urgencyColor = getUrgencyColor(urgency)
  const elapsed       = getElapsedTime(order.created_at)
  const nextStatus     = NEXT_STATUS[order.status]
  const buttonDisabled = order.status === 'ready' || isUpdating

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      {/* Urgency bar */}
      <div className="h-1.5" style={{ backgroundColor: urgencyColor }} />

      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sm font-extrabold text-blue-800">
            {order.table.table_number}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">
              Table {order.table.table_number}
            </div>
            <div className="text-[11px] text-gray-400">
              #{order.id.slice(-6).toUpperCase()}
            </div>
          </div>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${BADGE_STYLE[order.status]}`}>
          {BADGE_LABEL[order.status]}
        </span>
      </div>

      {/* Items */}
      <div className="px-3.5 py-3">
        {order.items.map(item => (
          <div key={item.id} className="text-xs text-gray-800 font-medium leading-relaxed">
            {item.item_name} <span className="text-gray-400">×{item.quantity}</span>
            {item.item_notes && (
              <span className="text-gray-400 italic ml-1">— {item.item_notes}</span>
            )}
          </div>
        ))}
        {order.special_notes && (
          <div className="mt-2 text-[11px] text-red-700 italic bg-red-50 border-l-2 border-red-400 px-2.5 py-1.5 rounded">
            ⚠ {order.special_notes}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-gray-100">
        <span
          className="text-xs font-extrabold font-mono"
          style={{ color: urgencyColor }}
        >
          {elapsed}
        </span>
        <button
          onClick={() => nextStatus && onAdvance(order.id, nextStatus)}
          disabled={buttonDisabled}
          className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors
            ${buttonDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#185FA5] text-white hover:bg-[#134d87]'
            }`}
        >
          {BUTTON_LABEL[order.status]}
        </button>
      </div>
    </div>
  )
}