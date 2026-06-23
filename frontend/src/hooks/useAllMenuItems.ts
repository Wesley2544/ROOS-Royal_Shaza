import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'
import { MenuItem } from './useMenu'

export function useAllMenuItems() {
  return useQuery<MenuItem[]>({
    queryKey: ['menu-items-all'],
    queryFn:  async () => (await apiClient.get('/menu/items/all')).data,
  })
}