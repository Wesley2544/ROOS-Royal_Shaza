import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'

export interface StaffMember {
  id: string; name: string; username: string
  role: 'kitchen' | 'waiter' | 'manager'; is_active: boolean; created_at: string
}
export interface DeletedStaffMember {
  id: string; name: string; username: string
  role: 'kitchen' | 'waiter' | 'manager'; deleted_at: string
}

export function useStaffList() {
  return useQuery<StaffMember[]>({
    queryKey: ['staff'],
    queryFn: async () => (await apiClient.get('/users')).data,
  })
}
export function useStaffTrash() {
  return useQuery<DeletedStaffMember[]>({
    queryKey: ['staff-trash'],
    queryFn: async () => (await apiClient.get('/users/trash')).data,
  })
}
export function useToggleStaffActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) =>
      (await apiClient.patch(`/users/${id}/status`, { is_active })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  })
}
export function useCreateStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; username: string; password: string; role: string }) =>
      (await apiClient.post('/auth/register', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  })
}
export function useDeleteStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await apiClient.delete(`/users/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      qc.invalidateQueries({ queryKey: ['staff-trash'] })
    },
  })
}
export function useRestoreStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await apiClient.patch(`/users/${id}/restore`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      qc.invalidateQueries({ queryKey: ['staff-trash'] })
    },
  })
}
export function usePermanentlyDeleteStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await apiClient.delete(`/users/${id}/permanent`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-trash'] }),
  })
}