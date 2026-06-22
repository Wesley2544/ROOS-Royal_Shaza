'use client'
import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth(['kitchen', 'manager'])

  if (loading || !user) return <LoadingSpinner message="Checking access…" />

  return <>{children}</>
}