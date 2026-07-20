'use client'
import { useEffect, useRef } from 'react'
import { Category } from '@/hooks/useMenu'

interface Props {
  categories: Category[]
  activeCategoryId: string | null
  onSelect: (id: string) => void
}

export default function CategoryTabs({ categories, activeCategoryId, onSelect }: Props) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    if (activeCategoryId && tabRefs.current[activeCategoryId]) {
      tabRefs.current[activeCategoryId]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [activeCategoryId])

  return (
    <div className="flex overflow-x-auto scrollbar-hide border-b border-[#E5E5E5] bg-white sticky top-[57px] z-10">
      {categories.map(cat => (
        <button
          key={cat.id}
          ref={el => { tabRefs.current[cat.id] = el }}
          onClick={() => onSelect(cat.id)}
          className={`flex-shrink-0 px-4 py-3 text-sm font-bold border-b-[2.5px] transition-colors
            ${activeCategoryId === cat.id ? 'border-[#FDC700] text-[#0A0A0A]' : 'border-transparent text-gray-400 font-medium'}`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}