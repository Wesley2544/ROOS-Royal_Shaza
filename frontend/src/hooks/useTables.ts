import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'

export interface TableData {
  id:           string
  table_number: number
  status:       'free' | 'ordering' | 'waiting' | 'served'
  capacity:     number
  orders:       { id: string; status: string }[]
}

export function useTables() {
  return useQuery<TableData[]>({
    queryKey: ['tables'],
    queryFn:  async () => {
      const res = await apiClient.get('/tables')
      return res.data
    },
    staleTime:       0,
    refetchInterval: 60000,
  })
}