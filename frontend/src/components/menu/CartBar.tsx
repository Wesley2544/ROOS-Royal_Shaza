import { formatPrice } from '@/utils/format'
// Define the props for the CartBar component
interface Props {
  totalItems:  number
  totalAmount: number
  onClick:     () => void
}
// This component displays a cart bar at the bottom of the screen when there are items in the cart.
export default function CartBar({ totalItems, totalAmount, onClick }: Props) {
  if (totalItems === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-20">
      <button
        onClick={onClick}
        className="w-full py-3 bg-[#1A3C5E] text-white rounded-xl font-semibold text-sm flex items-center justify-between px-4 hover:bg-[#15324f] transition-colors"
      >
        <span className="bg-white text-[#1A3C5E] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          {totalItems}
        </span>
        <span>View cart</span>
        <span>{formatPrice(totalAmount)}</span>
      </button>
    </div>
  )
}