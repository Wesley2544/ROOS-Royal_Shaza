'use client'
interface Props { tableNumber?: string }

export default function SessionExpired({ tableNumber }: Props) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center px-6 text-center gap-4">
      <div className="text-4xl">⏱</div>
      <div className="text-base font-bold text-[#0A0A0A]">Your ordering session has expired</div>
      <p className="text-sm text-gray-500 max-w-xs">
        For freshness, ordering links stay active for a limited time. Please scan the QR code on your table again to continue.
      </p>
      {tableNumber && <p className="text-xs text-gray-400">Table {tableNumber}</p>}
    </div>
  )
}