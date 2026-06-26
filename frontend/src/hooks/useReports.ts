import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'

export interface ReportSummary {
  active_orders: number; tables_occupied: number; avg_wait_minutes: number
  revenue_today: number; total_orders: number; avg_order_value: number
  completion_rate: number; orders_served: number
  top_items: { name: string; count: number }[]
  revenue_by_category: { category: string; amount: number }[]
  orders_by_hour: { hour: number; count: number }[]
  staff_performance: { name: string; orders: number; avg_minutes: number; revenue: number }[]
}

export function useReportSummary(range: 'today' | 'week' | 'month' = 'today') {
  return useQuery<ReportSummary>({
    queryKey: ['report-summary', range],
    queryFn:  async () => (await apiClient.get(`/reports/summary?range=${range}`)).data,
    refetchInterval: 30000,
  })
}