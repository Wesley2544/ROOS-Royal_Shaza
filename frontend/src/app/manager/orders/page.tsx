'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'
import { formatPrice } from '@/utils/format'
import { STATUS } from '@/lib/statusStyles'
import { useDeleteOrder } from '@/hooks/useOrders'
import RefreshButton from '@/components/ui/RefreshButton'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'

const PAGE_SIZE = 15

interface HistoryOrder {
  id: string
  status: 'new' | 'preparing' | 'ready' | 'served'
  total_amount: number
  created_at: string
  items: { item_name: string; quantity: number }[]
  table: { table_number: number }
}

function useOrderHistory(from: string, to: string, offset: number) {
  return useQuery<{ orders: HistoryOrder[]; total: number }>({
    queryKey: ['order-history', from, to, offset],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String(offset))
      const res = await apiClient.get(`/orders/history?${params.toString()}`)
      return res.data
    },
  })
}

export default function OrderHistoryPage() {
  const qc = useQueryClient()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)

  const { data, isLoading, error } = useOrderHistory(from, to, offset)
  const deleteOrder = useDeleteOrder()
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const filtered = (data?.orders || []).filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    const matchesSearch = search === '' ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      String(o.table.table_number).includes(search)
    return matchesStatus && matchesSearch
  })

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleteError('')
    try {
      await deleteOrder.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || 'Could not delete this order.')
    }
  }

  function handleExportCSV() {
    const rows = [
      ['Order ID', 'Table', 'Items', 'Total (KES)', 'Status', 'Date'],
      ...filtered.map(o => [
        o.id, String(o.table.table_number),
        o.items.map(i => `${i.item_name} x${i.quantity}`).join('; '),
        String(o.total_amount), o.status, new Date(o.created_at).toLocaleString(),
      ])
    ]
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `royal-shaza-orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <LoadingSpinner message="Loading order history…" />
  if (error) return <ErrorMessage message="Could not load order history." onRetry={() => window.location.reload()} />

  const total = data?.total || 0
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-base font-extrabold text-[#0A0A0A]">Order history</span>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={() => qc.invalidateQueries({ queryKey: ['order-history'] })} />
          <button onClick={handleExportCSV} className="px-4 py-2 border border-[#E5E5E5] bg-white text-[#0A0A0A] text-xs font-bold rounded-xl hover:bg-[#F5F5F5]">
            ↓ Export CSV
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <input type="date" value={from} onChange={e => { setFrom(e.target.value); setOffset(0) }}
          className="px-3 py-2 border border-[#E5E5E5] rounded-xl text-xs text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]" />
        <span className="text-xs text-gray-400">to</span>
        <input type="date" value={to} onChange={e => { setTo(e.target.value); setOffset(0) }}
          className="px-3 py-2 border border-[#E5E5E5] rounded-xl text-xs text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-[#E5E5E5] rounded-xl text-xs text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]">
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="served">Served</option>
        </select>
        <input
          type="text" placeholder="Search by order ID or table…" value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-2 border border-[#E5E5E5] rounded-xl text-xs text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#FDC700]"
        />
      </div>

      <div className="bg-white rounded-[18px] border border-[#E5E5E5] overflow-hidden">
        <div className="grid grid-cols-[90px_60px_1fr_100px_100px_140px_80px] bg-white border-b border-[#E5E5E5] px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
          <span>Order</span><span>Table</span><span>Items</span><span>Total</span><span>Status</span><span>Date</span><span>Actions</span>
        </div>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No orders match your filters</div>
        ) : (
          filtered.map((o, idx) => {
            const s = STATUS[o.status as keyof typeof STATUS]
            return (
              <div key={o.id} className={`grid grid-cols-[90px_60px_1fr_100px_100px_140px_80px] px-4 py-3 items-center text-xs border-t border-[#E5E5E5] ${idx % 2 === 1 ? 'bg-[#F5F5F5]' : ''}`}>
                <span className="font-bold text-[#0A0A0A]">#{o.id.slice(-6).toUpperCase()}</span>
                <span className="text-gray-500">T{o.table.table_number}</span>
                <span className="text-gray-600 truncate pr-2">{o.items.map(i => `${i.item_name} ×${i.quantity}`).join(', ')}</span>
                <span className="font-bold text-[#0A0A0A]">{formatPrice(o.total_amount)}</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${s.bg} ${s.text}`}>{s.label}</span>
                <span className="text-gray-400">{new Date(o.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                <button
                  onClick={() => setDeleteTarget({ id: o.id, label: `#${o.id.slice(-6).toUpperCase()} · Table ${o.table.table_number}` })}
                  className="px-2 py-1 border border-red-300 bg-white text-red-700 rounded-lg text-[10px] font-bold hover:bg-red-50 w-fit"
                >
                  Delete
                </button>
              </div>
            )
          })
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400">{total} total orders · page {currentPage} of {totalPages}</span>
        <div className="flex gap-2">
          <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            className="px-3 py-1.5 border border-[#E5E5E5] rounded-xl text-xs font-bold text-[#0A0A0A] disabled:opacity-40 hover:bg-[#F5F5F5]">
            ← Previous
          </button>
          <button disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}
            className="px-3 py-1.5 border border-[#E5E5E5] rounded-xl text-xs font-bold text-[#0A0A0A] disabled:opacity-40 hover:bg-[#F5F5F5]">
            Next →
          </button>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[18px] shadow-xl w-full max-w-sm p-6">
            <h3 className="text-sm font-bold text-[#0A0A0A] mb-2">Delete order {deleteTarget.label}?</h3>
            <p className="text-xs text-gray-500 mb-4">
              This action is irreversible. The order will be permanently removed from order history and all reports.
            </p>
            {deleteError && (
              <div className="mb-3 px-3 py-2 bg-red-100 border border-red-200 rounded-xl text-xs text-red-800 font-medium">{deleteError}</div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 border border-[#E5E5E5] text-gray-600 rounded-xl text-xs font-bold hover:bg-[#F5F5F5]">
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete} disabled={deleteOrder.isPending}
                className="flex-1 py-2 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 disabled:opacity-60"
              >
                {deleteOrder.isPending ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}