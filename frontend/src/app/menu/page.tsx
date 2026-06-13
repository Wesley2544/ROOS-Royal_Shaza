'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCategories, useMenuItems } from '@/hooks/useMenu'
import { useCart } from '@/hooks/useCart'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import CategoryTabs from '@/components/menu/CategoryTabs'
import ItemCard     from '@/components/menu/ItemCard'
import CartBar      from '@/components/menu/CartBar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage   from '@/components/ui/ErrorMessage'
import apiClient from '@/lib/apiClient'

export default function MenuPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const tableNumber  = searchParams.get('table') || '1'

  const { data: categories, isLoading: catsLoading, error: catsError } = useCategories()
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const { data: items, isLoading: itemsLoading } = useMenuItems(activeCategoryId || undefined)

  const cart = useCart()

  // Set first category as active once loaded
  useEffect(() => {
    if (categories && categories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(categories[0].id)
    }
  }, [categories, activeCategoryId])

  // Connect to socket room for this table
  useEffect(() => {
    const socket = connectSocket(`table-${tableNumber}`)

    socket.on('menu_updated', () => {
      // Refetch menu when manager updates availability
      window.location.reload()
    })

    return () => {
      socket.off('menu_updated')
      disconnectSocket()
    }
  }, [tableNumber])
  useEffect(() => {
    async function fetchTableId(){
      try{
        const res = await apiClient.get(`/tables/by-number/${tableNumber}`)
        sessionStorage.setItem('table_id', res.data.id)
      } catch (err) {
        console.error('Could not fetch table ID:', err)
      }
    }
    fetchTableId()
  }, [tableNumber])
  

  // Store table number for order placement
  useEffect(() => {
    sessionStorage.setItem('table_number', tableNumber)
  }, [tableNumber])

  function handleViewCart() {
    // Save cart to sessionStorage for cart page
    sessionStorage.setItem('cart', JSON.stringify({
      items:        cart.items,
      specialNotes: cart.specialNotes,
      tableNumber,
    }))
    router.push('/menu/cart')
  }

  if (catsLoading) return <LoadingSpinner message="Loading menu…" />
  if (catsError)   return <ErrorMessage message="Could not load the menu. Please try again." />

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#F5F9FE] border-b border-[#E0EAF5] px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-base font-bold text-[#1A3C5E]">Royal Shaza Suites</div>
          <div className="text-xs text-gray-500">Table {tableNumber} · Restaurant</div>
        </div>
        <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
          Open
        </span>
      </div>

      {/* Category tabs */}
      {categories && (
        <CategoryTabs
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelect={setActiveCategoryId}
        />
      )}

      {/* Menu items */}
      <div className="bg-white mt-2 rounded-xl mx-2 shadow-sm overflow-hidden">
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

      {/* Special notes */}
      {cart.totalItems > 0 && (
        <div className="mx-2 mt-3 bg-white rounded-xl p-4 shadow-sm">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
            Special requests
          </label>
          <textarea
            rows={2}
            value={cart.specialNotes}
            onChange={e => cart.setSpecialNotes(e.target.value)}
            placeholder="Any dietary requirements or special requests…"
            className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Sticky cart bar */}
      <CartBar
        totalItems={cart.totalItems}
        totalAmount={cart.totalAmount}
        onClick={handleViewCart}
      />
    </div>
  )
}