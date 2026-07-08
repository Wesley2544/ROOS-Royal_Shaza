'use client'
import { useState } from 'react'
import apiClient from '@/lib/apiClient'
import PasswordInput from '@/components/ui/PasswordInput'

function getApiErrorMessage(err: unknown, fallback: string) {
  const apiError = err as { response?: { data?: { error?: string } } }
  return apiError.response?.data?.error || fallback
}

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword })
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not update password.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 max-w-md">
      <span className="text-base font-extrabold text-[#0A0A0A] mb-4 block">Account settings</span>

      <div className="bg-white border border-[#E5E5E5] rounded-[18px] p-6">
        <h2 className="text-sm font-bold text-[#0A0A0A] mb-4">Change password</h2>

        {success && (
          <div className="mb-3 px-3 py-2 bg-green-100 border border-green-200 rounded-xl text-xs text-green-800 font-medium">
            Password updated successfully.
          </div>
        )}
        {error && (
          <div className="mb-3 px-3 py-2 bg-red-100 border border-red-200 rounded-xl text-xs text-red-800 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
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
    </div>
  )
}
