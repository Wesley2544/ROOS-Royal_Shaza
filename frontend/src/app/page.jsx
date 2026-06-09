'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser } from '@/lib/auth'
// This page checks user role and redirects to the appropriate dashboard or menu
export default function HomePage() {
  const router = useRouter()
// On mount, check user role and redirect accordingly
  useEffect(() => {
    const user = getUser()
    if (!user) {
      router.replace('/menu?table=1')
      return
    }
    const paths = {
      kitchen: '/kitchen',
      waiter:  '/waiter',
      manager: '/manager',
    }
    router.replace(paths[user.role] || '/menu?table=1')
  }, [router])
// Show a loading spinner while checking user role
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"/>
    </div>
  )
}