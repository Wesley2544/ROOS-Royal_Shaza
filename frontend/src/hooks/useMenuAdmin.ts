import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'
import { MenuItem, Category } from './useMenu'

export interface MenuItemPayload {
  category_id?: string
  name?: string
  description?: string
  price?: number
  dietary_tags?: string[]
  image_url?: string
}

function invalidateMenu(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['menu-items'] })
  qc.invalidateQueries({ queryKey: ['menu-items-all'] })
  qc.invalidateQueries({ queryKey: ['categories'] })
}

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: MenuItemPayload) => (await apiClient.post('/menu/items', data)).data,
    onSuccess:  () => invalidateMenu(qc),
  })
}

export function useUpdateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MenuItemPayload }) =>
      (await apiClient.put(`/menu/items/${id}`, data)).data,
    onSuccess: () => invalidateMenu(qc),
  })
}

// Optimistic — flips the switch instantly, reverts only if the server rejects it
export function useToggleAvailability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) =>
      (await apiClient.patch(`/menu/items/${id}/availability`, { is_available })).data,

    onMutate: async ({ id, is_available }) => {
      await qc.cancelQueries({ queryKey: ['menu-items-all'] })
      const previous = qc.getQueryData<MenuItem[]>(['menu-items-all'])
      qc.setQueryData<MenuItem[]>(['menu-items-all'], old =>
        old?.map(item => item.id === id ? { ...item, is_available } : item)
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['menu-items-all'], context.previous)
    },
    onSettled: () => invalidateMenu(qc),
  })
}

export function useDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await apiClient.delete(`/menu/items/${id}`)).data,
    onSuccess:  () => invalidateMenu(qc),
  })
}

export function useUploadItemImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData()
      formData.append('image', file)
      const res = await apiClient.post(`/menu/items/${id}/image`, formData, {
        headers: { 'Content-Type': undefined },
      })
      return res.data
    },
    onSuccess: () => invalidateMenu(qc),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await apiClient.delete(`/menu/categories/${id}`)).data,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['categories'] })
      const previous = qc.getQueryData<Category[]>(['categories'])
      qc.setQueryData<Category[]>(['categories'], old =>
        old?.filter(cat => cat.id !== id)
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['categories'], context.previous)
    },
    onSettled: () => invalidateMenu(qc),
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => (await apiClient.post('/menu/categories', { name })).data,
    onSuccess: () => invalidateMenu(qc),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) =>
      (await apiClient.put(`/menu/categories/${id}`, { name })).data,
    onSuccess: () => invalidateMenu(qc),
  })
}
