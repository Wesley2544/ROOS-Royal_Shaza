import { Order } from '@/hooks/useOrders'
import { getElapsedMinutes } from '@/utils/format'

interface Props {
  order:    Order
  onClick:  () => void
}

const BADGE_STYLE: Record<string, string> = {
  new:       'bg-red-100 text-red-700',
  preparing: 'bg-amber-100 text-amber-700',
  ready:     'bg-green-100 text-green-700',
}

const BADGE_LABEL: Record<string, string> = {
  new:       'New',
  preparing: 'Preparing',
  ready:     'Ready ●',
}

const CIRCLE_STYLE: Record<string, string> = {
  new:       'bg-red-50 text-red-700',
  preparing: 'bg-amber-50 text-amber-700',
  ready:     'bg-green-50 text-green-700',
}

export default function OrderListItem({ order, onClick }: Props) {
  const itemSummary = order.items
    .map(i => `${i.item_name} ×${i.quantity}`)
    .join(', ')

  const mins = getElapsedMinutes(order.created_at)

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors text-left"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0 ${CIRCLE_STYLE[order.status]}`}>
          {order.table.table_number}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-gray-900">
            Table {order.table.table_number} · #{order.id.slice(-6).toUpperCase()}
          </div>
          <div className="text-xs text-gray-400 truncate mt-0.5">
            {itemSummary}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${BADGE_STYLE[order.status]}`}>
          {BADGE_LABEL[order.status]}
        </span>
        <span className="text-[10px] text-gray-400">{mins}m ago</span>
      </div>
    </button>
  )
}