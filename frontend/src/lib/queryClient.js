import { QueryClient } from '@tanstack/react-query'
// Create a client with default options for queries (e.g. caching, retry behavior)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            1000 * 60 * 2, // 2 minutes
      retry:                1,
      refetchOnWindowFocus: false,
    },
  },
})

export default queryClient