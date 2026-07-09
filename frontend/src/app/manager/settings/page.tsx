'use client'
import { useState } from 'react'
import apiClient from '@/lib/apiClient'
import PasswordInput from '@/components/ui/PasswordInput'

function getApiErrorMessage(err: unknown, fallback: string) {
  const apiError = err as { response?: { data?: { error?: string } } }
  return apiError.response?.data?.error || fallback
import { useStaffTrash, useRestoreStaff, usePermanentlyDeleteStaff } from '@/hooks/useStaff'
import RefreshButton from '@/components/ui/RefreshButton'

const ROLE_STYLE: Record<string, string> = {
  manager: 'bg-purple-100 text-purple-700',
  waiter: 'bg-blue-100 text-blue-700',
  kitchen: 'bg-orange-100 text-orange-700',
}

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (newPassword !== confirmPassword) { setPwError('New passwords do not match.'); return }
    if (newPassword.length < 8) { setPwError('New password must be at least 8 characters.'); return }
    setPwLoading(true)
    try {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword })
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not update password.'))
    } finally {
      setPwLoading(false)
    }
  }

  const { data: trash, isLoading: trashLoading, refetch } = useStaffTrash()
  const restoreStaff = useRestoreStaff()
  const permDelete = usePermanentlyDeleteStaff()

  const [restoreTarget, setRestoreTarget] = useState<{ id: string; name: string } | null>(null)
  const [permDeleteTarget, setPermDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [permDeleteError, setPermDeleteError] = useState('')

  async function handleRestore() {
    if (!restoreTarget) return
    await restoreStaff.mutateAsync(restoreTarget.id)
    setRestoreTarget(null)
  }

  async function handlePermanentDelete() {
    if (!permDeleteTarget) return
    setPermDeleteError('')
    try {
      await permDelete.mutateAsync(permDeleteTarget.id)
      setPermDeleteTarget(null)
    } catch (err: any) {
      setPermDeleteError(err.response?.data?.error || 'Could not permanently delete this account.')
    }
  }

  return (
    <div className="p-5 max-w-2xl space-y-5">
      <span className="text-base font-extrabold text-[#0A0A0A] block">Account settings</span>

      <div className="bg-white border border-[#E5E5E5] rounded-[18px] p-6">
        <h2 className="text-sm font-bold text-[#0A0A0A] mb-4">Change password</h2>

        {pwSuccess && (
          <div className="mb-3 px-3 py-2 bg-green-100 border border-green-200 rounded-xl text-xs text-green-800 font-medium">
            Password updated successfully.
          </div>
        )}
        {pwError && (
          <div className="mb-3 px-3 py-2 bg-red-100 border border-red-200 rounded-xl text-xs text-red-800 font-medium">
            {pwError}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Current password</label>
            <PasswordInput value={currentPassword} onChange={setCurrentPassword} required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">New password</label>
            <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="At least 8 characters" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Confirm new password</label>
            <PasswordInput value={confirmPassword} onChange={setConfirmPassword} required />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#FDC700] text-[#0A0A0A] rounded-xl text-sm font-bold hover:brightness-95 disabled:opacity-60 mt-2"
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded-[18px] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#0A0A0A]">Deleted staff accounts</h2>
          <RefreshButton onClick={() => refetch()} />
        </div>

        {trashLoading ? (
          <div className="text-xs text-gray-400 py-6 text-center">Loading…</div>
        ) : !trash || trash.length === 0 ? (
          <div className="text-xs text-gray-400 py-6 text-center">Trash is empty</div>
        ) : (
          <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_90px_110px_170px] bg-[#F5F5F5] px-3 py-2">
              {['Name', 'Username', 'Role', 'Deleted', 'Actions'].map(t => (
                <span key={t} className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{t}</span>
              ))}
            </div>
            {trash.map((member, idx) => (
              <div key={member.id} className={`grid grid-cols-[1fr_1fr_90px_110px_170px] px-3 py-2.5 items-center text-xs border-t border-[#E5E5E5] ${idx % 2 === 1 ? 'bg-[#F5F5F5]' : ''}`}>
                <span className="font-bold text-[#0A0A0A]">{member.name}</span>
                <span className="text-gray-500">{member.username}</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${ROLE_STYLE[member.role]}`}>
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </span>
                <span className="text-gray-400">{new Date(member.deleted_at).toLocaleDateString([], { dateStyle: 'medium' })}</span>
                <div className="flex gap-1.5">
                  <button onClick={() => setRestoreTarget({ id: member.id, name: member.name })}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-green-200 bg-green-50 text-green-700 hover:bg-green-100">
                    Restore
                  </button>
                  <button onClick={() => { setPermDeleteTarget({ id: member.id, name: member.name }); setPermDeleteError('') }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-red-300 bg-white text-red-700 hover:bg-red-50">
                    Delete forever
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {restoreTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[18px] shadow-xl w-full max-w-sm p-6">
            <h3 className="text-sm font-bold text-[#0A0A0A] mb-2">Restore {restoreTarget.name}?</h3>
            <p className="text-xs text-gray-500 mb-4">
              This account will reappear in Staff Accounts as deactivated. Reactivate it from there when ready.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setRestoreTarget(null)} className="flex-1 py-2 border border-[#E5E5E5] text-gray-600 rounded-xl text-xs font-bold hover:bg-[#F5F5F5]">
                Cancel
              </button>
              <button onClick={handleRestore} disabled={restoreStaff.isPending}
                className="flex-1 py-2 bg-green-700 text-white rounded-xl text-xs font-bold hover:bg-green-800 disabled:opacity-60">
                {restoreStaff.isPending ? 'Restoring…' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {permDeleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[18px] shadow-xl w-full max-w-sm p-6">
            <h3 className="text-sm font-bold text-[#0A0A0A] mb-2">Permanently delete {permDeleteTarget.name}?</h3>
            <p className="text-xs text-gray-500 mb-4">
              This cannot be undone. Blocked automatically if this account has served real orders, to protect your order history.
            </p>
            {permDeleteError && (
              <div className="mb-3 px-3 py-2 bg-red-100 border border-red-200 rounded-xl text-xs text-red-800 font-medium">{permDeleteError}</div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setPermDeleteTarget(null)} className="flex-1 py-2 border border-[#E5E5E5] text-gray-600 rounded-xl text-xs font-bold hover:bg-[#F5F5F5]">
                Cancel
              </button>
              <button onClick={handlePermanentDelete} disabled={permDelete.isPending}
                className="flex-1 py-2 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 disabled:opacity-60">
                {permDelete.isPending ? 'Deleting…' : 'Delete forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
