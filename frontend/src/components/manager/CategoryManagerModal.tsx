'use client'
import { useState } from 'react'
import type { Category } from '@/hooks/useMenu'
import { useCreateCategory, useUpdateCategory } from '@/hooks/useMenuAdmin'

interface Props {
  categories: Category[]
  onClose: () => void
}

export default function CategoryManagerModal({ categories, onClose }: Props) {
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()

  const [draftNames, setDraftNames] = useState<Record<string, string>>({})
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')

  function getApiErrorMessage(err: unknown, fallback: string) {
    const apiError = err as { response?: { data?: { error?: string } } }
    return apiError.response?.data?.error || fallback
  }

  function getCategoryName(category: Category) {
    return draftNames[category.id] ?? category.name
  }

  async function handleSave(id: string) {
    setError('')
    const category = categories.find(item => item.id === id)
    const name = (draftNames[id] ?? category?.name ?? '').trim()
    if (!name) {
      setError('Category name cannot be empty.')
      return
    }

    try {
      await updateCategory.mutateAsync({ id, name })
      setDraftNames(current => ({ ...current, [id]: name }))
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not update category.'))
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const name = newName.trim()
    if (!name) {
      setError('Enter a name for the new category.')
      return
    }

    try {
      await createCategory.mutateAsync(name)
      setNewName('')
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not create category.'))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[18px] shadow-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#0A0A0A]">Manage categories</h2>
          <button
            onClick={onClose}
            aria-label="Close category manager"
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            x
          </button>
        </div>

        {error && (
          <div className="mb-3 px-3 py-2 bg-red-100 border border-red-200 rounded-xl text-xs text-red-800 font-medium">
            {error}
          </div>
        )}

        <div className="space-y-2 mb-4">
          {categories.map(category => (
            <div key={category.id} className="flex items-center gap-2">
              <input
                type="text"
                value={getCategoryName(category)}
                onChange={e => setDraftNames({ ...draftNames, [category.id]: e.target.value })}
                className="flex-1 px-3 py-2 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
              />
              <button
                onClick={() => handleSave(category.id)}
                disabled={updateCategory.isPending || getCategoryName(category).trim() === category.name}
                className="px-3 py-2 bg-[#FDC700] text-[#0A0A0A] text-xs font-bold rounded-xl hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Save
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAdd} className="flex items-center gap-2 pt-3 border-t border-[#E5E5E5]">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="New category name..."
            className="flex-1 px-3 py-2 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
          />
          <button
            type="submit"
            disabled={createCategory.isPending}
            className="px-3 py-2 bg-[#FDC700] text-[#0A0A0A] text-xs font-bold rounded-xl hover:brightness-95 disabled:opacity-60 whitespace-nowrap"
          >
            {createCategory.isPending ? 'Adding...' : '+ Add'}
          </button>
        </form>
      </div>
    </div>
  )
}
