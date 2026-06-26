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

export default function LoginPage() {
  const router = useRouter()
  const [role,     setRole]     = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.post('/auth/login', { username, password, role })
      const { token, user } = res.data
      saveAuth(token, user)
      router.replace(getHomeByRole(user.role))
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center px-4">

      <div className="mb-8 text-center">
        <div className="text-2xl font-extrabold text-[#0A0A0A]">Royal Shaza Suites</div>
        <div className="text-sm text-gray-500 mt-1">Staff portal</div>
      </div>

      <div className="w-full max-w-sm bg-[#FFFFFF] border border-[#E5E5E5] rounded-[18px] shadow-sm p-8">
        <h1 className="text-lg font-bold text-[#0A0A0A] mb-6">Sign in to your account</h1>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-200 border border-red-300 rounded-xl text-sm text-red-800 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">I am signing in as</label>
            <select
              value={role} onChange={e => setRole(e.target.value)} required
              className="w-full px-3 py-2.5 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
            >
              <option value="" disabled>Select your role…</option>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)} required
              placeholder="your username"
              className="w-full px-3 py-2.5 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              className="w-full px-3 py-2.5 border border-[#E5E5E5] rounded-xl text-sm text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 bg-[#FDC700] text-[#0A0A0A] text-sm font-bold rounded-xl hover:brightness-95 disabled:opacity-60 transition mt-2"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Need an account?{' '}
          <button onClick={() => router.push('/register')} className="text-[#0A0A0A] font-bold underline">
            Sign up
          </button>
        </p>
      </div>

      <p className="mt-6 text-xs text-gray-400 text-center">
        Kitchen · Waiter · Manager accounts only
      </p>
    </div>
  )
}