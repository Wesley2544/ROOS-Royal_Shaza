import { useState, useEffect, useRef } from 'react'
import { Category, MenuItem } from '@/hooks/useMenu'

interface Props {
  categories: Category[]
  editingItem: MenuItem | null
  onClose: () => void
  onSave: (data: any) => Promise<{ id: string }>
  onUploadImage: (id: string, file: File) => Promise<any>
  saving: boolean
}

export default function ItemModal({ categories, editingItem, onClose, onSave, onUploadImage, saving }: Props) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name)
      setCategoryId(editingItem.category_id)
      setDescription(editingItem.description || '')
      setPrice(String(editingItem.price))
      setTags(editingItem.dietary_tags.join(', '))
      setImagePreview(editingItem.image_url || null)
    } else {
      setName(''); setCategoryId(categories[0]?.id || '')
      setDescription(''); setPrice(''); setTags('')
      setImagePreview(null)
    }
    setImageFile(null)
    setError('')
  }, [editingItem, categories])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be smaller than 5MB.'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const priceNum = parseInt(price)
    if (!name.trim() || !categoryId || !priceNum || priceNum <= 0) {
      setError('Please fill in name, category, and a valid price.')
      return
    }
    try {
      const saved = await onSave({
        category_id: categoryId,
        name: name.trim(),
        description: description.trim() || undefined,
        price: priceNum,
        dietary_tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      if (imageFile && saved?.id) {
        setUploading(true)
        await onUploadImage(saved.id, imageFile)
      }
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not save item.')
    } finally {
      setUploading(false)
    }
  }

  const isBusy = saving || uploading

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[18px] shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-bold text-[#0A0A0A] mb-4">
          {editingItem ? 'Edit menu item' : 'Add menu item'}
        </h2>

        {error && (
          <div className="mb-3 px-3 py-2 bg-red-100 border border-red-200 rounded-xl text-xs text-red-800 font-medium">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Photo</label>
            <div className="flex items-center gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-xl bg-[#F4F4F5] border border-[#E5E5E5] flex-shrink-0 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-2 border border-[#E5E5E5] rounded-xl text-xs font-bold text-[#0A0A0A] hover:bg-[#F5F5F5]">
                  {imagePreview ? 'Change photo' : 'Upload photo'}
                </button>
                <p className="text-[10px] text-gray-400 mt-1">JPG or PNG, up to 5MB</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Item name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Category</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]">
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
            <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#FDC700]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Price (KES)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 1800"
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Dietary tags</label>
              <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="vegetarian, spicy"
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-[#E5E5E5] text-gray-600 rounded-xl text-sm font-bold hover:bg-[#F5F5F5]">
              Cancel
            </button>
            <button type="submit" disabled={isBusy} className="flex-1 py-2.5 bg-[#FDC700] text-[#0A0A0A] rounded-xl text-sm font-bold hover:brightness-95 disabled:opacity-60">
              {uploading ? 'Uploading photo…' : saving ? 'Saving…' : editingItem ? 'Save changes' : 'Add item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}