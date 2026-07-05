'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCategories, useMenuItems } from '@/hooks/useMenu'
import { useCart } from '@/hooks/useCart'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import apiClient from '@/lib/apiClient'
import CategoryTabs from '@/components/menu/CategoryTabs'
import ItemCard from '@/components/menu/ItemCard'
import CartBar from '@/components/menu/CartBar'
import SessionGate from '@/components/menu/SessionGate'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'

export default function MenuPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tableNumber = searchParams.get('table') || '1'

  const { data: categories, isLoading: catsLoading, error: catsError } = useCategories()
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const { data: items, isLoading: itemsLoading } = useMenuItems(activeCategoryId || undefined)

  const cart = useCart()
  const [tableId, setTableId] = useState<string | null>(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionWasExpired, setSessionWasExpired] = useState(false)
  const [checked, setChecked] = useState(false)

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

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await apiClient.get(`/tables/by-number/${tableNumber}`)
        setTableId(res.data.id)
        sessionStorage.setItem('table_id', res.data.id)

        if (res.data.session_active) {
          sessionStorage.setItem('session_table_number', tableNumber)
          sessionStorage.setItem('table_session_token', res.data.session_token)
          sessionStorage.setItem('table_session_expires_at', res.data.session_expires_at)
          setSessionActive(true)
        } else {
          setSessionWasExpired(true)
          setSessionActive(false)
        }
      } catch (err) {
        console.error('Could not check table session:', err)
      } finally {
        setChecked(true)
      }
    }
    checkSession()
  }, [tableNumber])

  useEffect(() => {
    const interval = setInterval(() => {
      const expiresAt = sessionStorage.getItem('table_session_expires_at')
      if (sessionActive && expiresAt && new Date(expiresAt).getTime() < Date.now()) {
        setSessionActive(false)
        setSessionWasExpired(true)
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [sessionActive])

  function handleSessionStarted(token: string, expiresAt: string) {
    sessionStorage.setItem('session_table_number', tableNumber)
    sessionStorage.setItem('table_session_token', token)
    sessionStorage.setItem('table_session_expires_at', expiresAt)
    setSessionActive(true)
  }

  function handleViewCart() {
    sessionStorage.setItem('cart', JSON.stringify({
      items: cart.items,
      specialNotes: cart.specialNotes,
      tableNumber,
    }))
    router.push('/menu/cart')
  }

  if (!checked || catsLoading) return <LoadingSpinner message="Loading menu…" />

  if (!sessionActive) {
    return (
      <SessionGate
        tableNumber={tableNumber}
        tableId={tableId}
        expired={sessionWasExpired}
      />
    )
  }

  if (catsError) return <ErrorMessage message="Could not load the menu. Please try again." onRetry={() => window.location.reload()} />

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