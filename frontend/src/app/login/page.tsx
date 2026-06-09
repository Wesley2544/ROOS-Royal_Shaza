'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/apiClient'
import { saveAuth, getHomeByRole } from '@/lib/auth'
//Login page component with form to authenticate users and redirect based on role
export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
               // Handle form submission for login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.post('/auth/login', { email, password })
      const { token, user } = res.data
      saveAuth(token, user)
      router.replace(getHomeByRole(user.role))
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }
               // Render login form with error messages and loading state
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
// Background circles for visual interest
      {/* Logo / Hotel name */}
      <div className="mb-8 text-center">
        <div className="text-2xl font-bold text-[#1A3C5E]">Royal Shaza Suites</div>
        <div className="text-sm text-gray-500 mt-1">Staff portal</div>
      </div>
                // Login card
      {/* Login card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-lg font-semibold text-gray-900 mb-6">Sign in to your account</h1>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
              // Login form
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@royalshaza.ke"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
             // Password input field
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
              // Submit button with loading state
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#15324f] disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
         // Role hint
      {/* Role hint */}
      <p className="mt-6 text-xs text-gray-400 text-center">
        Kitchen · Waiter · Manager accounts only
      </p>
    </div>
  )
}