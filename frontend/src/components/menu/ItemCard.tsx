import { MenuItem } from '@/hooks/useMenu'
import { formatPrice } from '@/utils/format'
import DietaryTag from './DietaryTag'
// This component represents a single menu item in the order summary, showing its name, description, price, dietary tags, and quantity controls.
interface Props {
  item:       MenuItem
  quantity:   number
  onAdd:      () => void
  onRemove:   () => void
}
// The ItemCard component displays the details of a menu item along with controls to adjust the quantity in the order summary.
export default function ItemCard({ item, quantity, onAdd, onRemove }: Props) {
  return (
    <div className="flex items-center justify-between py-4 px-4 border-b border-gray-100 last:border-0 bg-white">
      <div className="flex-1 pr-4">
        <div className="text-sm font-semibold text-gray-900 mb-1">
          {item.name}
        </div>
        {item.description && (
          <div className="text-xs text-gray-500 mb-2 leading-relaxed">
            {item.description}
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {item.dietary_tags.map(tag => (
            <DietaryTag key={tag} tag={tag} />
          ))}
          <span className="text-sm font-bold text-[#1A3C5E]">
            {formatPrice(item.price)}
          </span>
        </div>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {quantity > 0 && (
          <button
            onClick={onRemove}
            className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors text-lg leading-none"
          >
            −
          </button>
        )}
        {quantity > 0 && (
          <span className="text-sm font-bold text-[#1A3C5E] min-w-[16px] text-center">
            {quantity}
          </span>
        )}
        <button
          onClick={onAdd}
          className={`w-7 h-7 rounded-full border flex items-center justify-center text-lg leading-none transition-colors
            ${quantity > 0
              ? 'border-[#1A3C5E] bg-[#1A3C5E] text-white hover:bg-[#15324f]'
              : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600'
            }`}
        >
          +
        </button>
      </div>
    </div>
  )
}