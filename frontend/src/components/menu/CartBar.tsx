import { formatPrice } from '@/utils/format'

interface Props {
  totalItems:  number
  totalAmount: number
  onClick:     () => void
}

export default function CartBar({ totalItems, totalAmount, onClick }: Props) {
  if (totalItems === 0) return null
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#E5E5E5] z-20">
      <button
        onClick={onClick}
        className="w-full py-3 bg-[#FDC700] text-[#0A0A0A] rounded-[18px] font-bold text-sm flex items-center justify-between px-4 hover:brightness-95 transition"
      >
        <span className="bg-white text-[#0A0A0A] rounded-full w-6 h-6 flex items-center justify-center text-xs font-extrabold">
          {totalItems}
        </span>
        <span>View cart</span>
        <span>{formatPrice(totalAmount)}</span>
      </button>
    </div>
  )
}