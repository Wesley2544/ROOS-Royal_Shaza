import { useState, useEffect } from 'react'
import { Category, MenuItem } from '@/hooks/useMenu'
// Props interface for the ItemModal component
interface Props {
  categories:  Category[]
  editingItem: MenuItem | null
  onClose:     () => void
  onSave:      (data: any) => Promise<void>
  saving:      boolean
}
// ItemModal component for adding/editing menu items
export default function ItemModal({ categories, editingItem, onClose, onSave, saving }: Props) {
  const [name,        setName]        = useState('')
  const [categoryId,  setCategoryId]  = useState('')
  const [description, setDescription] = useState('')
  const [price,       setPrice]       = useState('')
  const [tags,        setTags]        = useState('')
  const [error,       setError]       = useState('')

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name)
      setCategoryId(editingItem.category_id)
      setDescription(editingItem.description || '')
      setPrice(String(editingItem.price))
      setTags(editingItem.dietary_tags.join(', '))
    } else {
      setName(''); setCategoryId(categories[0]?.id || '')
      setDescription(''); setPrice(''); setTags('')
    }
    setError('')
  }, [editingItem, categories])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const priceNum = parseInt(price)
    if (!name.trim() || !categoryId || !priceNum || priceNum <= 0) {
      setError('Please fill in name, category, and a valid price.')
      return
    }
    try {
      await onSave({
        category_id:  categoryId,
        name:         name.trim(),
        description:  description.trim() || undefined,
        price:        priceNum,
        dietary_tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not save item.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-bold text-[#1A3C5E] mb-4">
          {editingItem ? 'Edit menu item' : 'Add menu item'}
        </h2>

        {error && (
          <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Item name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
            <select
              value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
            <textarea
              rows={2} value={description} onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Price (KES)</label>
              <input
                type="number" value={price} onChange={e => setPrice(e.target.value)}
                placeholder="e.g. 1800"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Dietary tags</label>
              <input
                type="text" value={tags} onChange={e => setTags(e.target.value)}
                placeholder="vegetarian, spicy"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-[#1A3C5E] text-white rounded-lg text-sm font-semibold hover:bg-[#15324f] disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingItem ? 'Save changes' : 'Add item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}