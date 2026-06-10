import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'

export interface Category {
  id:         string
  name:       string
  sort_order: number
  _count:     { items: number }
}

export interface MenuItem {
  id:           string
  category_id:  string
  name:         string
  description:  string | null
  price:        number
  dietary_tags: string[]
  image_url:    string | null
  is_available: boolean
  category:     { id: string; name: string }
}
// TODO: Add pagination support for menu items if needed in the future
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn:  async () => {
      const res = await apiClient.get('/menu/categories')
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })
}
// TODO: Add pagination support for menu items if needed in the future
export function useMenuItems(categoryId?: string) {
  return useQuery<MenuItem[]>({
    queryKey: ['menu-items', categoryId],
    queryFn:  async () => {
      const url = categoryId
        ? `/menu/items?category_id=${categoryId}`
        : '/menu/items'
      const res = await apiClient.get(url)
      return res.data
    },
    staleTime: 1000 * 60 * 5,
  })
}