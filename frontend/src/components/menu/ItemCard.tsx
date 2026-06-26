import { MenuItem } from '@/hooks/useMenu'
import { formatPrice } from '@/utils/format'
import DietaryTag from './DietaryTag'

interface Props {
  item:     MenuItem
  quantity: number
  onAdd:    () => void
  onRemove: () => void
}

export default function ItemCard({ item, quantity, onAdd, onRemove }: Props) {
  return (
    <div className="flex items-center justify-between py-4 px-4 border-b border-[#E5E5E5] last:border-0 bg-white">
      <div className="flex-1 pr-4">
        <div className="text-sm font-bold text-[#0A0A0A] mb-1">{item.name}</div>
        {item.description && (
          <div className="text-xs text-gray-500 mb-2 leading-relaxed">{item.description}</div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {item.dietary_tags.map(tag => <DietaryTag key={tag} tag={tag} />)}
          <span className="text-sm font-extrabold text-[#0A0A0A]">{formatPrice(item.price)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {quantity > 0 && (
          <button
            onClick={onRemove}
            className="w-7 h-7 rounded-full border border-[#E5E5E5] flex items-center justify-center text-[#0A0A0A] hover:border-[#FDC700] text-lg leading-none"
          >−</button>
        )}
        {quantity > 0 && (
          <span className="text-sm font-extrabold text-[#0A0A0A] min-w-[16px] text-center">{quantity}</span>
        )}
        <button
          onClick={onAdd}
          className={`w-7 h-7 rounded-full border flex items-center justify-center text-lg leading-none transition-colors
            ${quantity > 0
              ? 'border-[#FDC700] bg-[#FDC700] text-[#0A0A0A]'
              : 'border-[#E5E5E5] text-[#0A0A0A] hover:border-[#FDC700]'
            }`}
        >+</button>
      </div>
    </div>
  )
}