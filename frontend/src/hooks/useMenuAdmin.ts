import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => (await apiClient.post('/menu/items', data)).data,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  })
}

export function useUpdateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      (await apiClient.put(`/menu/items/${id}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  })
}

export function useToggleAvailability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) =>
      (await apiClient.patch(`/menu/items/${id}/availability`, { is_available })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  })
}

export function useDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await apiClient.delete(`/menu/items/${id}`)).data,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  })
}