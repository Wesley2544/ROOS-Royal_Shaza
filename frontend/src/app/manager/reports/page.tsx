'use client'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useReportSummary } from '@/hooks/useReports'
import { formatPrice } from '@/utils/format'
import RefreshButton from '@/components/ui/RefreshButton'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This week' },
  { key: 'month', label: 'This month' },
] as const

export default function ReportsPage() {
  const qc = useQueryClient()
  const [range, setRange] = useState<'today' | 'week' | 'month'>('today')
  const { data, isLoading, error } = useReportSummary(range)

  if (isLoading) return <LoadingSpinner message="Loading reports…" />
  if (error)      return <ErrorMessage message="Could not load reports." onRetry={() => window.location.reload()} />

  function handleExportCSV() {
    if (!data) return
    const rows = [
      ['Metric', 'Value'],
      ['Revenue', String(data.revenue_today)],
      ['Total orders', String(data.total_orders)],
      ['Average wait (minutes)', String(data.avg_wait_minutes)],
      ['Orders served', String(data.orders_served)],
      [],
      ['Top items', 'Count'],
      ...data.top_items.map(i => [i.name, String(i.count)]),
      [],
      ['Revenue by category', 'Amount'],
      ...data.revenue_by_category.map(c => [c.category, String(c.amount)]),
      [],
      ['Staff', 'Orders', 'Avg minutes', 'Revenue'],
      ...data.staff_performance.map(s => [s.name, String(s.orders), String(s.avg_minutes), String(s.revenue)]),
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `royal-shaza-report-${range}-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1.5">
          {RANGES.map(r => (
            <button
              key={r.key} onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors
                ${range === r.key ? 'bg-[#FDC700] text-[#0A0A0A] border-[#FDC700]' : 'border-[#E5E5E5] text-gray-600 hover:bg-[#F5F5F5]'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={() => qc.invalidateQueries({ queryKey: ['report-summary'] })} />
          <button onClick={handleExportCSV} className="px-4 py-2 border border-[#E5E5E5] bg-white text-[#0A0A0A] text-xs font-bold rounded-xl hover:bg-[#F5F5F5]">
            ↓ Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-[#E5E5E5] rounded-[18px] p-4 text-center">
          <div className="text-xl font-extrabold text-[#16A34A]">{formatPrice(data?.revenue_today ?? 0)}</div>
          <div className="text-[11px] text-gray-400 mt-1">Total revenue</div>
        </div>
        <div className="bg-white border border-[#E5E5E5] rounded-[18px] p-4 text-center">
          <div className="text-xl font-extrabold text-[#0A0A0A]">{data?.total_orders ?? 0}</div>
          <div className="text-[11px] text-gray-400 mt-1">Total orders</div>
        </div>
        <div className="bg-white border border-[#E5E5E5] rounded-[18px] p-4 text-center">
          <div className="text-xl font-extrabold text-[#D97706]">{data?.avg_wait_minutes ?? 0} min</div>
          <div className="text-[11px] text-gray-400 mt-1">Avg wait time</div>
        </div>
        <div className="bg-white border border-[#E5E5E5] rounded-[18px] p-4 text-center">
          <div className="text-xl font-extrabold text-[#0A0A0A]">{data?.orders_served ?? 0}</div>
          <div className="text-[11px] text-gray-400 mt-1">Orders served</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-[#E5E5E5] rounded-[18px] p-4">
          <div className="text-sm font-bold text-[#0A0A0A] mb-3">Staff performance</div>
          {(!data?.staff_performance || data.staff_performance.length === 0) ? (
            <div className="text-xs text-gray-400 py-6 text-center">No served orders in this range yet</div>
          ) : (
            <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_50px_70px_90px] bg-[#0A0A0A] px-3 py-2">
                {['Waiter','Orders','Avg time','Revenue'].map(t => (
                  <span key={t} className="text-[10px] font-bold text-white">{t}</span>
                ))}
              </div>
              {data.staff_performance.map((s, idx) => (
                <div key={s.name} className={`grid grid-cols-[1fr_50px_70px_90px] px-3 py-2 items-center text-xs border-t border-[#E5E5E5] ${idx % 2 === 1 ? 'bg-[#F5F5F5]' : ''}`}>
                  <span className="font-semibold text-[#0A0A0A] truncate">{s.name}</span>
                  <span className="text-gray-500">{s.orders}</span>
                  <span className="text-gray-500">{s.avg_minutes} min</span>
                  <span className="font-bold text-[#0A0A0A]">{formatPrice(s.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-[18px] p-4">
          <div className="text-sm font-bold text-[#0A0A0A] mb-3">Top dishes</div>
          {(!data?.top_items || data.top_items.length === 0) ? (
            <div className="text-xs text-gray-400 py-6 text-center">No data in this range yet</div>
          ) : (
            <div className="space-y-2.5">
              {data.top_items.map(item => (
                <div key={item.name} className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-600 w-28 flex-shrink-0 truncate">{item.name}</span>
                  <div className="flex-1 h-2 bg-[#F4F4F5] rounded-full overflow-hidden">
                    <div className="h-full bg-[#FDC700] rounded-full" style={{ width: `${(item.count / Math.max(...data.top_items.map(i=>i.count),1)) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-5 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-[18px] p-4">
          <div className="text-sm font-bold text-[#0A0A0A] mb-3">Revenue by category</div>
          {(!data?.revenue_by_category || data.revenue_by_category.length === 0) ? (
            <div className="text-xs text-gray-400 py-6 text-center">No served orders in this range yet</div>
          ) : (
            <div className="space-y-2.5">
              {data.revenue_by_category.map(cat => (
                <div key={cat.category} className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-600 w-20 flex-shrink-0">{cat.category}</span>
                  <div className="flex-1 h-2 bg-[#F4F4F5] rounded-full overflow-hidden">
                    <div className="h-full bg-green-700 rounded-full" style={{ width: `${(cat.amount / Math.max(...data.revenue_by_category.map(c=>c.amount),1)) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-16 text-right">{formatPrice(cat.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}