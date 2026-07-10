'use client'
import { useState, useEffect } from 'react'
import { Category } from '@/hooks/useMenu'
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useMenuAdmin'

interface Props { categories: Category[]; onClose: () => void }

export default function CategoryManagerModal({ categories, onClose }: Props) {
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [names, setNames] = useState<Record<string, string>>({})
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    const initial: Record<string, string> = {}
    categories.forEach(c => { initial[c.id] = c.name })
    setNames(initial)
  }, [categories])

  async function handleSave(id: string) {
    setError('')
    const name = names[id]?.trim()
    if (!name) { setError('Category name cannot be empty.'); return }
    try { await updateCategory.mutateAsync({ id, name }) }
    catch (err: any) { setError(err.response?.data?.error || 'Could not update category.') }
  }
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const name = newName.trim()
    if (!name) { setError('Enter a name for the new category.'); return }
    try { await createCategory.mutateAsync(name); setNewName('') }
    catch (err: any) { setError(err.response?.data?.error || 'Could not create category.') }
  }
  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleteError('')
    try { await deleteCategory.mutateAsync(deleteTarget.id); setDeleteTarget(null) }
    catch (err: any) { setDeleteError(err.response?.data?.error || 'Could not delete this category.') }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[18px] shadow-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#0A0A0A]">Manage categories</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
        {error && <div className="mb-3 px-3 py-2 bg-red-100 border border-red-200 rounded-xl text-xs text-red-800 font-medium">{error}</div>}

        <div className="space-y-2 mb-4">
          {categories.map(cat => {
            const isEmpty = (cat._count?.items ?? 0) === 0
            return (
              <div key={cat.id} className="flex items-center gap-2">
                <input type="text" value={names[cat.id] ?? cat.name} onChange={e => setNames({ ...names, [cat.id]: e.target.value })}
                  className="flex-1 px-3 py-2 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]" />
                <button onClick={() => handleSave(cat.id)} disabled={updateCategory.isPending || names[cat.id] === cat.name}
                  className="px-3 py-2 bg-[#FDC700] text-[#0A0A0A] text-xs font-bold rounded-xl hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
                  Save
                </button>
                <button onClick={() => { setDeleteTarget({ id: cat.id, name: cat.name }); setDeleteError('') }} disabled={!isEmpty}
                  title={isEmpty ? 'Delete this empty category' : 'Only empty categories can be deleted'}
                  className="px-3 py-2 border border-red-300 bg-white text-red-700 text-xs font-bold rounded-xl hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap">
                  Delete
                </button>
              </div>
            )
          })}
        </div>

        <form onSubmit={handleAdd} className="flex items-center gap-2 pt-3 border-t border-[#E5E5E5]">
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="New category name…"
            className="flex-1 px-3 py-2 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]" />
          <button type="submit" disabled={createCategory.isPending} className="px-3 py-2 bg-[#FDC700] text-[#0A0A0A] text-xs font-bold rounded-xl hover:brightness-95 disabled:opacity-60 whitespace-nowrap">
            {createCategory.isPending ? 'Adding…' : '+ Add'}
          </button>
        </form>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[18px] shadow-xl w-full max-w-sm p-6">
            <h3 className="text-sm font-bold text-[#0A0A0A] mb-2">Delete "{deleteTarget.name}"?</h3>
            <p className="text-xs text-gray-500 mb-4">This category is empty and can be safely removed.</p>
            {deleteError && <div className="mb-3 px-3 py-2 bg-red-100 border border-red-200 rounded-xl text-xs text-red-800 font-medium">{deleteError}</div>}
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 border border-[#E5E5E5] text-gray-600 rounded-xl text-xs font-bold hover:bg-[#F5F5F5]">Cancel</button>
              <button onClick={handleConfirmDelete} disabled={deleteCategory.isPending} className="flex-1 py-2 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 disabled:opacity-60">
                {deleteCategory.isPending ? 'Deleting…' : 'Delete category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}