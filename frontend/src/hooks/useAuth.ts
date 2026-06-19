'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, clearAuth, getHomeByRole } from '@/lib/auth'

interface User {
  userId: string
  role:   'kitchen' | 'waiter' | 'manager'
}

export function useAuth(requiredRole?: string | string[]) {
  const router  = useRouter()
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Stringify the role so the dependency never changes reference on re-render
  const requiredRoleKey = Array.isArray(requiredRole)
    ? requiredRole.join(',')
    : requiredRole || ''

  useEffect(() => {
    const currentUser = getUser()

    if (!currentUser) {
      router.replace('/login')
      return
    }

    if (requiredRoleKey) {
      const allowed = requiredRoleKey.split(',')
      if (!allowed.includes(currentUser.role)) {
        router.replace(getHomeByRole(currentUser.role))
        return
      }
    }

    setUser(currentUser)
    setLoading(false)
  }, [router, requiredRoleKey]) // ← string, not array — stable reference

  function logout() {
    clearAuth()
    router.replace('/login')
  }

  return { user, loading, logout }
}