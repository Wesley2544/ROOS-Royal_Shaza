'use client'
interface Props {
  tableNumber: string
  tableId: string | null
  expired?: boolean
}

export default function SessionGate({ tableNumber, tableId, expired }: Props) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center px-6 text-center gap-4">
      <div className="text-4xl">{expired ? '⏱' : '🍽'}</div>
      <div className="text-base font-bold text-[#0A0A0A]">
        {expired ? 'Your ordering session has ended' : 'Ready to order?'}
      </div>
      <p className="text-sm text-gray-500 max-w-xs">
        {expired
          ? 'Please scan the QR code again to start a fresh ordering session.'
          : 'Please scan the QR code at your table to begin ordering.'}
      </p>
      {tableNumber && <p className="text-xs text-gray-400">Table {tableNumber}</p>}
      {!tableId && <p className="text-xs text-red-600">Table information is unavailable.</p>}
    </div>
  )
}
