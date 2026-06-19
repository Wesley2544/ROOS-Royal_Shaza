import { TableData } from '@/hooks/useTables'

interface Props {
  table:   TableData
  onClick: () => void
}

const STYLE: Record<string, { bg: string; border: string; text: string }> = {
  free:     { bg: 'bg-gray-50',  border: 'border-gray-200',  text: 'text-gray-400' },
  ordering: { bg: 'bg-blue-50',  border: 'border-blue-200',  text: 'text-blue-700' },
  waiting:  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  served:   { bg: 'bg-gray-100', border: 'border-gray-200',  text: 'text-gray-500' },
}

const LABEL: Record<string, string> = {
  free: 'Free', ordering: 'Active', waiting: 'Waiting', served: 'Served',
}

export default function TableCell({ table, onClick }: Props) {
  const activeOrder = table.orders.find(o => o.status !== 'served')
  const isReady      = activeOrder?.status === 'ready'
  const style        = isReady
    ? { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' }
    : STYLE[table.status]

  return (
    <button
      onClick={onClick}
      className={`rounded-xl border-2 px-2 py-3 text-center transition-colors ${style.bg} ${style.border} hover:opacity-80`}
    >
      <div className={`text-base font-extrabold ${style.text}`}>{table.table_number}</div>
      <div className={`text-[10px] font-semibold mt-0.5 ${style.text}`}>
        {isReady ? 'Ready ●' : LABEL[table.status]}
      </div>
    </button>
  )
}