import { Order } from '@/hooks/useOrders'
import { getElapsedTime, getUrgencyLevel, getUrgencyColor } from '@/utils/format'
import { STATUS } from '@/lib/statusStyles'

interface Props {
  order:      Order
  onAdvance:  (orderId: string, nextStatus: string) => void
  isUpdating: boolean
}

const NEXT_STATUS: Record<string, string> = { new: 'preparing', preparing: 'ready' }
const BUTTON_LABEL: Record<string, string> = { new: 'Start preparing', preparing: 'Mark ready', ready: 'Waiting for waiter' }

export default function OrderCard({ order, onAdvance, isUpdating }: Props) {
  const urgency        = getUrgencyLevel(order.created_at, order.status)
  const urgencyColor   = getUrgencyColor(urgency)
  const elapsed        = getElapsedTime(order.created_at)
  const nextStatus     = NEXT_STATUS[order.status]
  const buttonDisabled = order.status === 'ready' || isUpdating
  const s = STATUS[order.status]

  return (
    <div className="bg-white rounded-[18px] overflow-hidden border border-[#E5E5E5] shadow-sm">
      <div className="h-1.5" style={{ backgroundColor: urgencyColor }} />

      <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#F4F4F5] flex items-center justify-center text-sm font-extrabold text-[#0A0A0A]">
            {order.table.table_number}
          </div>
          <div>
            <div className="text-sm font-bold text-[#0A0A0A]">Table {order.table.table_number}</div>
            <div className="text-[11px] text-gray-400">#{order.id.slice(-6).toUpperCase()}</div>
          </div>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
      </div>

      <div className="px-3.5 py-3">
        {order.items.map(item => (
          <div key={item.id} className="text-xs text-[#0A0A0A] font-medium leading-relaxed">
            {item.item_name} <span className="text-gray-400">×{item.quantity}</span>
            {item.item_notes && <span className="text-gray-400 italic ml-1">— {item.item_notes}</span>}
          </div>
        ))}
        {order.special_notes && (
          <div className="mt-2 text-[11px] text-red-800 italic bg-red-100 border-l-[3px] border-red-500 px-2.5 py-1.5 rounded">
            ⚠ {order.special_notes}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-[#E5E5E5]">
        <span className="text-xs font-extrabold font-mono" style={{ color: urgencyColor }}>{elapsed}</span>
        <button
          onClick={() => nextStatus && onAdvance(order.id, nextStatus)}
          disabled={buttonDisabled}
          className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors
            ${buttonDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#FDC700] text-[#0A0A0A] hover:brightness-95'}`}
        >
          {BUTTON_LABEL[order.status]}
        </button>
      </div>
    </div>
  )
}