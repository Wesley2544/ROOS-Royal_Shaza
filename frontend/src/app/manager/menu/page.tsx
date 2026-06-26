'use client'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCategories, MenuItem } from '@/hooks/useMenu'
import { useAllMenuItems } from '@/hooks/useAllMenuItems'
import { useCreateItem, useUpdateItem, useToggleAvailability, useDeleteItem } from '@/hooks/useMenuAdmin'
import { formatPrice } from '@/utils/format'
import ItemModal from '@/components/manager/ItemModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage   from '@/components/ui/ErrorMessage'
import RefreshButton from '@/components/ui/RefreshButton'

export default function MenuManagerPage() {
  const qc = useQueryClient()
  const { data: categories } = useCategories()
  const { data: items, isLoading, error } = useAllMenuItems()

  const createItem  = useCreateItem()
  const updateItem   = useUpdateItem()
  const toggleAvail  = useToggleAvailability()
  const deleteItem   = useDeleteItem()

  const [activeFilter, setActiveFilter] = useState('all')
  const [search,       setSearch]       = useState('')
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editingItem,  setEditingItem]  = useState<MenuItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  if (isLoading) return <LoadingSpinner message="Loading menu…" />
  if (error)      return <ErrorMessage message="Could not load menu items." onRetry={() => window.location.reload()} />

  const filtered = (items || []).filter(item => {
    const matchesCategory = activeFilter === 'all' || item.category_id === activeFilter
    const matchesSearch    = item.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  async function handleSave(data: any) {
    if (editingItem) {
      await updateItem.mutateAsync({ id: editingItem.id, data })
    } else {
      await createItem.mutateAsync(data)
    }
    setModalOpen(false)
    setEditingItem(null)
  }

  async function handleDelete(id: string) {
    await deleteItem.mutateAsync(id)
    setConfirmDelete(null)
  }

  return (
    <div className="p-5">

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors
              ${activeFilter === 'all' ? 'bg-[#FDC700] text-[#0A0A0A] border-[#FDC700]' : 'border-[#E5E5E5] text-gray-600 hover:bg-[#F5F5F5]'}`}
          >
            All items
          </button>
          {categories?.map(cat => (
            <button
              key={cat.id} onClick={() => setActiveFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors
                ${activeFilter === cat.id ? 'bg-[#FDC700] text-[#0A0A0A] border-[#FDC700]' : 'border-[#E5E5E5] text-gray-600 hover:bg-[#F5F5F5]'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-3">
  <RefreshButton onClick={() => qc.invalidateQueries({ queryKey: ['menu-items-all'] })} />
  <button
    onClick={() => { setEditingItem(null); setModalOpen(true) }}
    className="px-4 py-2 bg-[#FDC700] text-[#0A0A0A] text-xs font-bold rounded-xl hover:brightness-95 whitespace-nowrap"
  >
    + Add item
  </button>
</div>
      </div>

      <input
        type="text" placeholder="Search menu items…" value={search} onChange={e => setSearch(e.target.value)}
        className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white mb-4 focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
      />

      <div className="bg-white rounded-[18px] border border-[#E5E5E5] overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_90px_120px_70px_90px] bg-white border-b border-[#E5E5E5] px-3 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
          <span>Item name</span><span>Category</span><span>Price</span><span>Dietary tags</span><span>Available</span><span>Actions</span>
        </div>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No items match your filters</div>
        ) : (
          filtered.map((item, idx) => (
            <div
              key={item.id}
              className={`grid grid-cols-[1fr_100px_90px_120px_70px_90px] px-3 py-2.5 items-center text-xs border-t border-[#E5E5E5] ${idx % 2 === 1 ? 'bg-[#F5F5F5]' : ''}`}
            >
              <span className="font-bold text-[#0A0A0A] truncate pr-2">{item.name}</span>
              <span className="text-gray-400 truncate">{item.category.name}</span>
              <span className="font-bold text-[#0A0A0A]">{formatPrice(item.price)}</span>
              <span className="text-gray-400 truncate pr-2">{item.dietary_tags.join(', ') || '—'}</span>
              <button
                onClick={() => toggleAvail.mutate({ id: item.id, is_available: !item.is_available })}
                className={`w-8 h-[18px] rounded-full flex items-center px-0.5 transition-colors ${item.is_available ? 'bg-[#FDC700] justify-end' : 'bg-gray-300 justify-start'}`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white" />
              </button>
              <div className="flex gap-1.5">
                <button onClick={() => { setEditingItem(item); setModalOpen(true) }} className="px-2 py-1 border border-[#E5E5E5] rounded text-[10px] hover:bg-[#F5F5F5]">
                  Edit
                </button>
                <button onClick={() => setConfirmDelete(item.id)} className="px-2 py-1 border border-red-200 bg-red-100 text-red-800 rounded text-[10px] hover:bg-red-200">
                  Del
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && categories && (
        <ItemModal
          categories={categories} editingItem={editingItem}
          onClose={() => { setModalOpen(false); setEditingItem(null) }}
          onSave={handleSave} saving={createItem.isPending || updateItem.isPending}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[18px] shadow-xl w-full max-w-sm p-6">
            <h3 className="text-sm font-bold text-[#0A0A0A] mb-2">Remove this item?</h3>
            <p className="text-xs text-gray-500 mb-4">This will hide the item from the customer menu. Past orders referencing it are not affected.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 border border-[#E5E5E5] text-gray-600 rounded-xl text-xs font-bold hover:bg-[#F5F5F5]">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)} disabled={deleteItem.isPending}
                className="flex-1 py-2 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 disabled:opacity-60"
              >
                {deleteItem.isPending ? 'Removing…' : 'Remove item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}