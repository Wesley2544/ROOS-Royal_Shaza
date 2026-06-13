'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/apiClient'
import { formatPrice } from '@/utils/format'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface CartItem {
  menuItem: {
    id:    string
    name:  string
    price: number
  }
  quantity:  number
  itemNotes: string
}

interface CartData {
  items:        CartItem[]
  specialNotes: string
  tableNumber:  string
}

export default function CartPage() {
  const router = useRouter()

  const [cart,         setCart]         = useState<CartData | null>(null)
  const [specialNotes, setSpecialNotes] = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  // Load cart from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('cart')
      if (!raw) { router.replace('/menu?table=1'); return }
      const data: CartData = JSON.parse(raw)
      setCart(data)
      setSpecialNotes(data.specialNotes || '')
    } catch {
      router.replace('/menu?table=1')
    }
  }, [router])

  async function handlePlaceOrder() {
    if (!cart || cart.items.length === 0) return

    const tableId = sessionStorage.getItem('table_id')
    if (!tableId) {
      setError('Table not found. Please scan the QR code again.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await apiClient.post('/orders', {
        table_id:      tableId,
        special_notes: specialNotes || undefined,
        items: cart.items.map(i => ({
          menu_item_id: i.menuItem.id,
          quantity:     i.quantity,
          item_notes:   i.itemNotes || undefined,
        })),
      })

      // Save order info for the tracker page
      sessionStorage.setItem('current_order', JSON.stringify({
        orderId:     res.data.id,
        tableNumber: cart.tableNumber,
        items:       cart.items,
        totalAmount: res.data.total_amount,
      }))

      // Clear the cart
      sessionStorage.removeItem('cart')

      // Go to confirmation
      router.push(`/order-status?orderId=${res.data.id}&table=${cart.tableNumber}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!cart) return <LoadingSpinner message="Loading cart…" />

  const totalAmount = cart.items.reduce(
    (sum, i) => sum + i.menuItem.price * i.quantity, 0
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#F5F9FE] border-b border-[#E0EAF5] px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-sm font-semibold text-[#185FA5]"
        >
          ← Menu
        </button>
        <span className="text-base font-bold text-[#1A3C5E]">Your order</span>
        <div className="w-12" />
      </div>

      <div className="px-4 py-4 space-y-3">

        {/* Order items */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {cart.items.map((item, idx) => (
            <div
              key={item.menuItem.id}
              className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 ${idx % 2 === 1 ? 'bg-gray-50' : ''}`}
            >
              <div className="flex-1">
                <span className="text-sm font-semibold text-gray-900">
                  {item.menuItem.name}
                </span>
                <span className="text-sm text-gray-400 ml-1">
                  ×{item.quantity}
                </span>
                {item.itemNotes && (
                  <div className="text-xs text-gray-400 italic mt-0.5">
                    {item.itemNotes}
                  </div>
                )}
              </div>
              <span className="text-sm font-bold text-[#1A3C5E]">
                {formatPrice(item.menuItem.price * item.quantity)}
              </span>
            </div>
          ))}

          {/* Total */}
          <div className="flex justify-between items-center px-4 py-3 border-t-2 border-[#1A3C5E]">
            <span className="text-base font-bold text-[#1A3C5E]">Total</span>
            <span className="text-base font-bold text-[#1A3C5E]">
              {formatPrice(totalAmount)}
            </span>
          </div>
        </div>

        {/* Special notes */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
            Special requests / dietary notes
          </label>
          <textarea
            rows={3}
            value={specialNotes}
            onChange={e => setSpecialNotes(e.target.value)}
            placeholder="No onions, extra sauce, allergies…"
            className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Place order button */}
        <button
          onClick={handlePlaceOrder}
          disabled={loading || cart.items.length === 0}
          className="w-full py-4 bg-[#1A3C5E] text-white rounded-xl font-bold text-sm hover:bg-[#15324f] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Placing order…' : `Place order · ${formatPrice(totalAmount)}`}
        </button>

        <p className="text-center text-xs text-gray-400">
          Table {cart.tableNumber} · Royal Shaza Suites
        </p>

      </div>
    </div>
  )
}