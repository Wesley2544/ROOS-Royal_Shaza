'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCategories, useMenuItems } from '@/hooks/useMenu'
import { useCart } from '@/hooks/useCart'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import apiClient from '@/lib/apiClient'
import CategoryTabs from '@/components/menu/CategoryTabs'
import ItemCard     from '@/components/menu/ItemCard'
import CartBar      from '@/components/menu/CartBar'
import SessionExpired from '@/components/menu/SessionExpired'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage   from '@/components/ui/ErrorMessage'
import { isTableSessionValid } from '@/lib/sessionCheck'

export default function MenuPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const tableNumber  = searchParams.get('table') || '1'

  const { data: categories, isLoading: catsLoading, error: catsError } = useCategories()
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const { data: items, isLoading: itemsLoading } = useMenuItems(activeCategoryId || undefined)

  const cart = useCart()
  const [sessionExpired, setSessionExpired] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    if (categories && categories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(categories[0].id)
    }
  }, [categories, activeCategoryId])

  useEffect(() => {
    const socket = connectSocket(`table-${tableNumber}`)
    socket.on('menu_updated', () => { window.location.reload() })
    return () => {
      socket.off('menu_updated')
      disconnectSocket()
    }
  }, [tableNumber])

  useEffect(() => {
    sessionStorage.setItem('table_number', tableNumber)
  }, [tableNumber])

  // Establish an ordering session — but only mint a NEW one when no valid
  // session already exists for this exact table. A plain refresh reuses
  // whatever is already stored, so it can never silently extend the clock.
  useEffect(() => {
    async function establishSession() {
      const storedForTable = sessionStorage.getItem('session_table_number')
      const storedToken    = sessionStorage.getItem('table_session_token')
      const storedExpiry   = sessionStorage.getItem('table_session_expires_at')
      const storedTableId  = sessionStorage.getItem('table_id')

      const hasStoredSession =
        storedForTable === tableNumber && storedToken && storedExpiry && storedTableId

      if (hasStoredSession) {
        const stillValid = new Date(storedExpiry).getTime() > Date.now()
        setSessionExpired(!stillValid)
        setSessionChecked(true)
        return // never contact the backend here — reuse or block, don't renew
      }

      // No session on record for this table in this tab — a genuine first
      // load, equivalent to just having scanned the QR code.
      try {
        const res = await apiClient.get(`/tables/by-number/${tableNumber}`)
        sessionStorage.setItem('table_id', res.data.id)
        sessionStorage.setItem('session_table_number', tableNumber)
        sessionStorage.setItem('table_session_token', res.data.session_token)
        sessionStorage.setItem('table_session_expires_at', res.data.session_expires_at)
        setSessionExpired(false)
      } catch (err) {
        console.error('Could not fetch table session:', err)
      } finally {
        setSessionChecked(true)
      }
    }
    establishSession()
  }, [tableNumber])

  // Catch expiry happening while the customer is sitting on the page,
  // without needing a refresh to notice.
  useEffect(() => {
    const interval = setInterval(() => {
      const expiresAt = sessionStorage.getItem('table_session_expires_at')
      if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
        setSessionExpired(true)
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  function handleViewCart() {
    if (!isTableSessionValid(tableNumber)) {
    setSessionExpired(true)
    return
  }
  sessionStorage.setItem('cart', JSON.stringify({
    items:        cart.items,
    specialNotes: cart.specialNotes,
    tableNumber,
  }))
  router.push('/menu/cart')

  }

  if (catsLoading) return <LoadingSpinner message="Loading menu…" />
  if (!sessionChecked || catsLoading) return <LoadingSpinner message="Loading menu…" />
  if (sessionExpired) return <SessionExpired tableNumber={tableNumber} />
  if (catsError)   return <ErrorMessage message="Could not load the menu. Please try again." onRetry={() => window.location.reload()} />

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      <div className="sticky top-0 z-20 bg-white border-b border-[#E5E5E5] px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-base font-extrabold text-[#0A0A0A]">Royal Shaza Suites</div>
          <div className="text-xs text-gray-500">Table {tableNumber} · Restaurant</div>
        </div>
        <span className="bg-green-200 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
          Open
        </span>
      </div>

      {categories && (
        <CategoryTabs
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelect={setActiveCategoryId}
        />
      )}

      <div className="bg-white mt-2 rounded-[18px] mx-2 shadow-sm border border-[#E5E5E5] overflow-hidden">
        {itemsLoading ? (
          <LoadingSpinner message="Loading items…" />
        ) : items && items.length > 0 ? (
          items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              quantity={cart.getQuantity(item.id)}
              onAdd={() => cart.addItem(item)}
              onRemove={() => cart.removeItem(item.id)}
            />
          ))
        ) : (
          <div className="py-12 text-center text-gray-400 text-sm">
            No items in this category
          </div>
        )}
      </div>

      {cart.totalItems > 0 && (
        <div className="mx-2 mt-3 bg-white rounded-[18px] border border-[#E5E5E5] p-4 shadow-sm">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            Special requests
          </label>
          <textarea
            rows={2}
            value={cart.specialNotes}
            onChange={e => cart.setSpecialNotes(e.target.value)}
            placeholder="Any dietary requirements or special requests…"
            className="w-full text-sm text-[#0A0A0A] border border-[#E5E5E5] rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
          />
        </div>
      )}

      <CartBar
        totalItems={cart.totalItems}
        totalAmount={cart.totalAmount}
        onClick={handleViewCart}
      />
    </div>
  )
}
