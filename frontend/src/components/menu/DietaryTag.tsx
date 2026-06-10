const TAG_STYLES: Record<string, string> = {
  vegetarian:  'bg-green-100 text-green-700',
  veg:         'bg-green-100 text-green-700',
  gluten_free: 'bg-blue-100  text-blue-700',
  gf:          'bg-blue-100  text-blue-700',
  spicy:       'bg-red-100   text-red-700',
}

const TAG_LABELS: Record<string, string> = {
  vegetarian:  'Veg',
  veg:         'Veg',
  gluten_free: 'GF',
  gf:          'GF',
  spicy:       'Spicy',
}

export default function DietaryTag({ tag }: { tag: string }) {
  const key    = tag.toLowerCase()
  const style  = TAG_STYLES[key] || 'bg-gray-100 text-gray-600'
  const label  = TAG_LABELS[key] || tag
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${style}`}>
      {label}
    </span>
  )
}