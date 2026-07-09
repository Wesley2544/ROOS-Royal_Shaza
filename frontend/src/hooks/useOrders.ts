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
    queryFn:  async () => {
      const res = await apiClient.get('/orders')
      return res.data
    },
    staleTime:      0,
    refetchInterval: 120000, // 120s fallback poll in case Socket misses an event
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await apiClient.patch(`/orders/${orderId}/status`, { status })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useDeleteOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiClient.delete(`/orders/${orderId}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-history'] })
    },
  })
}
