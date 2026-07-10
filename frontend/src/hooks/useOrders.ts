import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'

export interface OrderItem {
  id:         string
  item_name:  string
  quantity:   number
  unit_price: number
  subtotal:   number
  item_notes: string | null
}

export interface Order {
  id:            string
  status:        'new' | 'preparing' | 'ready' | 'served'
  total_amount:  number
  special_notes: string | null
  created_at:    string
  updated_at:    string
  served_by:     string | null
  items:         OrderItem[]
  table:         { table_number: number }
}

export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => (await apiClient.get('/orders')).data,
    staleTime: 0,
    refetchInterval: 120000,
  })
}
export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) =>
      (await apiClient.patch(`/orders/${orderId}/status`, { status })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}
export function useDeleteOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await apiClient.delete(`/orders/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['order-history'] })
      qc.invalidateQueries({ queryKey: ['report-summary'] })
      qc.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}
