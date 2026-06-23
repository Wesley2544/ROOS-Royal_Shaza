import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'

export interface ReportSummary {
  active_orders:    number
  tables_occupied:  number
  avg_wait_minutes: number
  revenue_today:    number
  top_items:        { name: string; count: number }[]
  revenue_by_category: { category: string; amount: number }[]
}

export function useReportSummary() {
  return useQuery<ReportSummary>({
    queryKey: ['report-summary'],
    queryFn:  async () => {
      const res = await apiClient.get('/reports/summary')
      return res.data
    },
    refetchInterval: 30000,
  })
}