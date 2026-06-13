import { Suspense } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function OrderStatusLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading order status…" />}>
      {children}
    </Suspense>
  )
}