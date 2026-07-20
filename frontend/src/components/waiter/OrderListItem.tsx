import { Order, useUpdateOrderStatus } from '@/hooks/useOrders'
import { getElapsedMinutes } from '@/utils/format'
import { STATUS } from '@/lib/statusStyles'

interface Props { order: Order; onClick: () => void }

export default function OrderListItem({ order, onClick }: Props) {
  const itemSummary = order.items.map(i => `${i.item_name} ×${i.quantity}`).join(', ')
  const mins = getElapsedMinutes(order.created_at)
  const s = STATUS[order.status]
  const updateStatus = useUpdateOrderStatus()
  const isNew = order.status === 'new'

  function handleAction(e: React.MouseEvent) {
    e.stopPropagation()
    updateStatus.mutate({ orderId: order.id, status: isNew ? 'preparing' : 'served' })
  }

  return (
    <div
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[#E5E5E5] last:border-0 hover:bg-[#F5F5F5] transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0 ${s.bg} ${s.text}`}>
          {order.table.table_number}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-[#0A0A0A]">Table {order.table.table_number} · #{order.id.slice(-6).toUpperCase()}</div>
          <div className="text-xs text-gray-400 truncate mt-0.5">{itemSummary}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <span className="text-[10px] text-gray-400">{mins}m ago</span>
        <button
          onClick={handleAction}
          disabled={updateStatus.isPending}
          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap disabled:opacity-60 ${
            isNew ? 'bg-[#FDC700] text-[#0A0A0A] hover:brightness-95' : 'bg-green-700 text-white hover:bg-green-800'
          }`}
        >
          {isNew ? 'Order received' : 'Mark as served'}
        </button>
      </div>
    </div>
  )
}