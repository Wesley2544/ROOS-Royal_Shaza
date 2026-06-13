import { Suspense } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
// This layout wraps all cart-related pages, providing a consistent loading state while the cart data is being fetched.
export default function CartLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading cart…" />}>
      {children}
    </Suspense>
  )
}