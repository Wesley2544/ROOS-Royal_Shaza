'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/apiClient'
import { saveAuth, getHomeByRole } from '@/lib/auth'

const ROLES = [
  { value: 'manager', label: 'Manager' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'waiter',  label: 'Waiter'  },
]

export default function RegisterPage() {
  const router = useRouter()
  const [name,            setName]            = useState('')
  const [username,        setUsername]        = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role,            setRole]            = useState('waiter')
  const [inviteCode,      setInviteCode]      = useState('')
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await apiClient.post('/auth/register', { name, username, password, role, inviteCode })
      const { token, user } = res.data
      saveAuth(token, user)
      router.replace(getHomeByRole(user.role))
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="text-2xl font-extrabold text-[#0A0A0A]">Royal Shaza Suites</div>
        <div className="text-sm text-gray-500 mt-1">Create a staff account</div>
      </div>

      <div className="w-full max-w-sm bg-[#FFFFFF] border border-[#E5E5E5] rounded-[18px] shadow-sm p-8">
        <h1 className="text-lg font-bold text-[#0A0A0A] mb-6">Sign up</h1>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-200 border border-red-300 rounded-xl text-sm text-red-800 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder="e.g. Grace Njeri"
              className="w-full px-3 py-2.5 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)} required
              placeholder="letters, numbers, underscore only"
              className="w-full px-3 py-2.5 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">I am signing up as</label>
            <select
              value={role} onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
            >
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {role === 'manager' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manager invite code</label>
              <input
                type="password" value={inviteCode} onChange={e => setInviteCode(e.target.value)} required
                placeholder="Provided by the hotel owner"
                className="w-full px-3 py-2.5 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="At least 8 characters"
              className="w-full px-3 py-2.5 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
            <input
              type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
              className="w-full px-3 py-2.5 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 bg-[#FDC700] text-[#0A0A0A] text-sm font-bold rounded-xl hover:brightness-95 disabled:opacity-60 transition mt-2"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Already have an account?{' '}
          <button onClick={() => router.push('/login')} className="text-[#0A0A0A] font-bold underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}