'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/apiClient'
import { formatPrice } from '@/utils/format'
import SessionExpired from '@/components/menu/SessionExpired'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface CartItem {
  menuItem: { id: string; name: string; price: number }
  quantity: number
  itemNotes: string
}
interface CartData { items: CartItem[]; specialNotes: string; tableNumber: string }

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartData | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [specialNotes, setSpecialNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const expiresAt = sessionStorage.getItem('table_session_expires_at')
    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
      setSessionExpired(true)
      return
    }
    try {
      const raw = sessionStorage.getItem('cart')
      if (!raw) { setNotFound(true); return }
      const data: CartData = JSON.parse(raw)
      if (!data.items || data.items.length === 0) { setNotFound(true); return }
      setCart(data)
      setSpecialNotes(data.specialNotes || '')
    } catch {
      setNotFound(true)
    }
  }, [])

  async function handlePlaceOrder() {
    if (!cart || cart.items.length === 0) return
    const tableId = sessionStorage.getItem('table_id')
    const sessionToken = sessionStorage.getItem('table_session_token')
    if (!tableId || !sessionToken) {
      setError('Table not found. Please scan the QR code again.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.post('/orders', {
        table_id: tableId,
        session_token: sessionToken,
        special_notes: specialNotes || undefined,
        items: cart.items.map(i => ({
          menu_item_id: i.menuItem.id,
          quantity: i.quantity,
          item_notes: i.itemNotes || undefined,
        })),
      })

      // Extend the session — lets the table order dessert or another
      // round later without being cut off mid-meal
      if (res.data.session_token) {
        sessionStorage.setItem('table_session_token', res.data.session_token)
        sessionStorage.setItem('table_session_expires_at', res.data.session_expires_at)
      }

      sessionStorage.setItem('current_order', JSON.stringify({
        orderId: res.data.id, tableNumber: cart.tableNumber,
        items: cart.items, totalAmount: res.data.total_amount,
      }))
      sessionStorage.removeItem('cart')
      router.push(`/order-status?orderId=${res.data.id}&table=${cart.tableNumber}`)
    } catch (err: any) {
      if (err.response?.data?.code === 'SESSION_EXPIRED') {
        setSessionExpired(true)
      } else {
        setError(err.response?.data?.error || 'Failed to place order. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (sessionExpired) return <SessionExpired tableNumber={cart?.tableNumber} />

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="text-4xl">🛒</div>
        <div className="text-base font-bold text-[#0A0A0A]">Your cart is empty</div>
        <p className="text-sm text-gray-500">Add items from the menu before checking out.</p>
        <button
          onClick={() => router.push('/menu?table=1')}
          className="px-5 py-2.5 bg-[#FDC700] text-[#0A0A0A] rounded-xl font-bold text-sm hover:brightness-95"
        >
          Browse menu
        </button>
      </div>
    )
  }

  if (!cart) return <LoadingSpinner message="Loading cart…" />

  const totalAmount = cart.items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0)

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="sticky top-0 z-20 bg-white border-b border-[#E5E5E5] px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm font-bold text-[#0A0A0A]">← Menu</button>
        <span className="text-base font-extrabold text-[#0A0A0A]">Your order</span>
        <div className="w-12" />
      </div>

      <div className="px-4 py-4 space-y-3">
        <div className="bg-white rounded-[18px] border border-[#E5E5E5] shadow-sm overflow-hidden">
          {cart.items.map((item, idx) => (
            <div key={item.menuItem.id} className={`flex items-center justify-between px-4 py-3 border-b border-[#E5E5E5] last:border-0 ${idx % 2 === 1 ? 'bg-[#F5F5F5]' : ''}`}>
              <div className="flex-1">
                <span className="text-sm font-semibold text-[#0A0A0A]">{item.menuItem.name}</span>
                <span className="text-sm text-gray-400 ml-1">×{item.quantity}</span>
                {item.itemNotes && <div className="text-xs text-gray-400 italic mt-0.5">{item.itemNotes}</div>}
              </div>
              <span className="text-sm font-bold text-[#0A0A0A]">{formatPrice(item.menuItem.price * item.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center px-4 py-3 border-t-2 border-[#0A0A0A]">
            <span className="text-base font-bold text-[#0A0A0A]">Total</span>
            <span className="text-base font-bold text-[#0A0A0A]">{formatPrice(totalAmount)}</span>
          </div>
        </div>

        <div className="bg-white rounded-[18px] border border-[#E5E5E5] shadow-sm p-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Special requests / dietary notes</label>
          <textarea
            rows={3} value={specialNotes} onChange={e => setSpecialNotes(e.target.value)}
            placeholder="No onions, extra sauce, allergies…"
            className="w-full text-sm text-[#0A0A0A] border border-[#E5E5E5] rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#FDC700] bg-white"
          />
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-200 border border-red-300 rounded-xl text-sm text-red-800 font-medium">{error}</div>
        )}

        <button
          onClick={handlePlaceOrder} disabled={loading || cart.items.length === 0}
          className="w-full py-4 bg-[#FDC700] text-[#0A0A0A] rounded-[18px] font-bold text-sm hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Placing order…' : `Place order · ${formatPrice(totalAmount)}`}
        </button>

        <p className="text-center text-xs text-gray-400">Table {cart.tableNumber} · Royal Shaza Suites</p>
      </div>
    </div>
  )
}