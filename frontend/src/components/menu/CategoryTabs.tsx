import { Category } from '@/hooks/useMenu'

interface Props {
  categories:      Category[]
  activeCategoryId: string | null
  onSelect:        (id: string) => void
}

export default function CategoryTabs({ categories, activeCategoryId, onSelect }: Props) {
  return (
    <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 bg-white sticky top-[57px] z-10">
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors
            ${activeCategoryId === cat.id
              ? 'border-[#1A3C5E] text-[#1A3C5E]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}