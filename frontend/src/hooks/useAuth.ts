'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, clearAuth, getHomeByRole } from '@/lib/auth'

interface User {
  userId: string
  role:   'kitchen' | 'waiter' | 'manager'
}
// Hook to manage authentication and role-based access control
export function useAuth(requiredRole?: string | string[]) {
  const router  = useRouter()
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
// On mount, check if user is authenticated and has the required role (if any)
  useEffect(() => {
    const currentUser = getUser()

    if (!currentUser) {
      router.replace('/login')
      return
    }

    // Check role if required role(s) are specified 
    if (requiredRole) {
      const allowed = Array.isArray(requiredRole)
        ? requiredRole
        : [requiredRole]
      if (!allowed.includes(currentUser.role)) {
        router.replace(getHomeByRole(currentUser.role))
        return
      }
    }
// User is authenticated and has the required role (if any), set user state
    setUser(currentUser)
    setLoading(false)
  }, [router, requiredRole])

  function logout() {
    clearAuth()
    router.replace('/login')
  }

  return { user, loading, logout }
}