'use client'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useStaffList, useToggleStaffActive, useCreateStaff, useDeleteStaff } from '@/hooks/useStaff'
import RefreshButton from '@/components/ui/RefreshButton'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'

const ROLE_STYLE: Record<string, string> = {
  manager: 'bg-purple-100 text-purple-700',
  waiter: 'bg-blue-100 text-blue-700',
  kitchen: 'bg-orange-100 text-orange-700',
}

export default function StaffAccountsPage() {
  const qc = useQueryClient()
  const { data: staff, isLoading, error } = useStaffList()
  const toggleActive = useToggleStaffActive()
  const createStaff = useCreateStaff()
  const deleteStaff = useDeleteStaff()

  const [modalOpen, setModalOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string; nextActive: boolean } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'waiter' })
  const [formError, setFormError] = useState('')

  if (isLoading) return <LoadingSpinner message="Loading staff accounts…" />
  if (error) return <ErrorMessage message="Could not load staff accounts." onRetry={() => window.location.reload()} />

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim() || !form.username.trim() || form.password.length < 8) {
      setFormError('Please fill in all fields — password needs at least 8 characters.')
      return
    }
    try {
      await createStaff.mutateAsync(form)
      setModalOpen(false)
      setForm({ name: '', username: '', password: '', role: 'waiter' })
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Could not create account.')
    }
  }

  async function handleConfirmToggle() {
    if (!confirmTarget) return
    await toggleActive.mutateAsync({ id: confirmTarget.id, is_active: confirmTarget.nextActive })
    setConfirmTarget(null)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await deleteStaff.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-base font-extrabold text-[#0A0A0A]">Staff accounts</span>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={() => qc.invalidateQueries({ queryKey: ['staff'] })} />
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-[#FDC700] text-[#0A0A0A] text-xs font-bold rounded-xl hover:brightness-95"
          >
            + Add staff
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[18px] border border-[#E5E5E5] overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_100px_90px_180px] bg-white border-b border-[#E5E5E5] px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
          <span>Name</span><span>Username</span><span>Role</span><span>Status</span><span>Actions</span>
        </div>
        {staff?.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No staff accounts yet</div>
        ) : (
          staff?.map((member, idx) => (
            <div
              key={member.id}
              className={`grid grid-cols-[1fr_1fr_100px_90px_180px] px-4 py-3 items-center text-xs border-t border-[#E5E5E5] ${idx % 2 === 1 ? 'bg-[#F5F5F5]' : ''}`}
            >
              <span className="font-bold text-[#0A0A0A]">{member.name}</span>
              <span className="text-gray-500">{member.username}</span>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold w-fit ${ROLE_STYLE[member.role]}`}>
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </span>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold w-fit ${member.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {member.is_active ? 'Active' : 'Deactivated'}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setConfirmTarget({ id: member.id, name: member.name, nextActive: !member.is_active })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${member.is_active ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'}`}
                >
                  {member.is_active ? 'Deactivate' : 'Reactivate'}
                </button>
                {member.role !== 'manager' && (
                  <button
                    onClick={() => setDeleteTarget({ id: member.id, name: member.name })}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-red-300 bg-white text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[18px] shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-bold text-[#0A0A0A] mb-4">Add staff account</h2>
            {formError && (
              <div className="mb-3 px-3 py-2 bg-red-100 border border-red-200 rounded-xl text-xs text-red-800 font-medium">{formError}</div>
            )}
            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Full name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Username</label>
                <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]">
                  <option value="waiter">Waiter</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Password</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 8 characters"
                  className="w-full px-3 py-2 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-[#E5E5E5] text-gray-600 rounded-xl text-sm font-bold hover:bg-[#F5F5F5]">
                  Cancel
                </button>
                <button type="submit" disabled={createStaff.isPending} className="flex-1 py-2.5 bg-[#FDC700] text-[#0A0A0A] rounded-xl text-sm font-bold hover:brightness-95 disabled:opacity-60">
                  {createStaff.isPending ? 'Creating…' : 'Create account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[18px] shadow-xl w-full max-w-sm p-6">
            <h3 className="text-sm font-bold text-[#0A0A0A] mb-2">
              {confirmTarget.nextActive ? 'Reactivate' : 'Deactivate'} {confirmTarget.name}?
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {confirmTarget.nextActive
                ? 'They will be able to log in again immediately.'
                : 'They will be signed out and unable to log in until reactivated. Past orders they handled are not affected.'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmTarget(null)} className="flex-1 py-2 border border-[#E5E5E5] text-gray-600 rounded-xl text-xs font-bold hover:bg-[#F5F5F5]">
                Cancel
              </button>
              <button
                onClick={handleConfirmToggle} disabled={toggleActive.isPending}
                className={`flex-1 py-2 rounded-xl text-xs font-bold disabled:opacity-60 ${confirmTarget.nextActive ? 'bg-green-700 text-white hover:bg-green-800' : 'bg-red-700 text-white hover:bg-red-800'}`}
              >
                {toggleActive.isPending ? 'Updating…' : confirmTarget.nextActive ? 'Reactivate' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[18px] shadow-xl w-full max-w-sm p-6">
            <h3 className="text-sm font-bold text-[#0A0A0A] mb-2">Move {deleteTarget.name} to trash?</h3>
            <p className="text-xs text-gray-500 mb-4">
              They'll be signed out immediately and removed from this list. This is reversible — deleted accounts can be restored from Settings.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 border border-[#E5E5E5] text-gray-600 rounded-xl text-xs font-bold hover:bg-[#F5F5F5]">
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete} disabled={deleteStaff.isPending}
                className="flex-1 py-2 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 disabled:opacity-60"
              >
                {deleteStaff.isPending ? 'Moving…' : 'Move to trash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}