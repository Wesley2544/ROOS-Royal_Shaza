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
      const res = await apiClient.post('/auth/register', { name, username, password, role })
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="text-2xl font-bold text-[#1A3C5E]">Royal Shaza Suites</div>
        <div className="text-sm text-gray-500 mt-1">Create a staff account</div>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-lg font-semibold text-gray-900 mb-6">Sign up</h1>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder="e.g. Grace Njeri"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)} required
              placeholder="letters, numbers, underscore only"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">I am signing up as</label>
            <select
              value={role} onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="At least 8 characters"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
            <input
              type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#15324f] disabled:opacity-60 transition-colors mt-2"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Already have an account?{' '}
          <button onClick={() => router.push('/login')} className="text-[#185FA5] font-semibold">
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}