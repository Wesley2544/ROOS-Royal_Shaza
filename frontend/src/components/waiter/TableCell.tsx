import { TableData } from '@/hooks/useTables'
import { STATUS } from '@/lib/statusStyles'

interface Props { table: TableData; onClick: () => void }

export default function TableCell({ table, onClick }: Props) {
  const activeOrder = table.orders.find(o => o.status !== 'served')
  const isReady      = activeOrder?.status === 'ready'
  const key          = isReady ? 'ready' : table.status
  const s            = STATUS[key] || STATUS.free

  return (
    <button
      onClick={onClick}
      className={`rounded-[18px] px-2 py-3 text-center transition-opacity hover:opacity-80 ${s.bg}`}
    >
      <div className={`text-base font-extrabold ${s.text}`}>{table.table_number}</div>
      <div className={`text-[10px] font-bold mt-0.5 ${s.text}`}>{isReady ? 'Ready ●' : s.label}</div>
    </button>
  )
}