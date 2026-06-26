import { useState, useEffect } from 'react'
import { Category, MenuItem } from '@/hooks/useMenu'

interface Props {
  categories: Category[]
  editingItem: MenuItem | null
  onClose: () => void
  onSave: (data: any) => Promise<void>
  saving: boolean
}

export default function ItemModal({ categories, editingItem, onClose, onSave, saving }: Props) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')

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
        category_id: categoryId,
        name: name.trim(),
        description: description.trim() || undefined,
        price: priceNum,
        dietary_tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not save item.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[18px] shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-bold text-[#0A0A0A] mb-4">
          {editingItem ? 'Edit menu item' : 'Add menu item'}
        </h2>

        {error && (
          <div className="mb-3 px-3 py-2 bg-red-100 border border-red-200 rounded-xl text-xs text-red-800 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Item name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Category</label>
            <select
              value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
            >
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
            <textarea
              rows={2} value={description} onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Price (KES)</label>
              <input
                type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 1800"
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Dietary tags</label>
              <input
                type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="vegetarian, spicy"
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-[#E5E5E5] text-gray-600 rounded-xl text-sm font-bold hover:bg-[#F5F5F5]">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#FDC700] text-[#0A0A0A] rounded-xl text-sm font-bold hover:brightness-95 disabled:opacity-60">
              {saving ? 'Saving…' : editingItem ? 'Save changes' : 'Add item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}