export default function DietaryTag({ tag }: { tag: string }) {
  const labels: Record<string,string> = { vegetarian:'Veg', veg:'Veg', gluten_free:'GF', gf:'GF', spicy:'Spicy' }
  const label = labels[tag.toLowerCase()] || tag
  return (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-[#F4F4F5] text-gray-600">
      {label}
    </span>
  )
}