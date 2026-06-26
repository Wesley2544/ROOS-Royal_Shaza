'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'
import { formatPrice } from '@/utils/format'
import { STATUS } from '@/lib/statusStyles'
import RefreshButton from '@/components/ui/RefreshButton'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'

const PAGE_SIZE = 15

interface HistoryOrder {
  id: string; status: string; total_amount: number; created_at: string
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

  const filtered = (data?.orders || []).filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    const matchesSearch = search === '' ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      String(o.table.table_number).includes(search)
    return matchesStatus && matchesSearch
  })

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
    a.download = `royal-shaza-orders-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <LoadingSpinner message="Loading order history…" />
  if (error)      return <ErrorMessage message="Could not load order history." onRetry={() => window.location.reload()} />

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
        <div className="grid grid-cols-[90px_60px_1fr_100px_100px_140px] bg-white border-b border-[#E5E5E5] px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
          <span>Order</span><span>Table</span><span>Items</span><span>Total</span><span>Status</span><span>Date</span>
        </div>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No orders match your filters</div>
        ) : (
          filtered.map((o, idx) => {
            const s = STATUS[o.status]
            return (
              <div key={o.id} className={`grid grid-cols-[90px_60px_1fr_100px_100px_140px] px-4 py-3 items-center text-xs border-t border-[#E5E5E5] ${idx % 2 === 1 ? 'bg-[#F5F5F5]' : ''}`}>
                <span className="font-bold text-[#0A0A0A]">#{o.id.slice(-6).toUpperCase()}</span>
                <span className="text-gray-500">T{o.table.table_number}</span>
                <span className="text-gray-600 truncate pr-2">{o.items.map(i => `${i.item_name} ×${i.quantity}`).join(', ')}</span>
                <span className="font-bold text-[#0A0A0A]">{formatPrice(o.total_amount)}</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${s.bg} ${s.text}`}>{s.label}</span>
                <span className="text-gray-400">{new Date(o.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
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
    </div>
  )
}