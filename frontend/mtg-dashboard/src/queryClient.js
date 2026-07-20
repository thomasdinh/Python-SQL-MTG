import { QueryClient } from '@tanstack/react-query'

// One shared cache for the whole app. This is the piece that actually fixes
// "switching pages shows a loading screen every time": once a page's data
// has been fetched, revisiting that page reads from this cache instantly
// and only refetches in the background if the data is stale.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered "fresh" for 60s — no refetch on remount within
      // that window, so hopping between pages feels instant.
      staleTime: 60 * 1000,
      // Keep unused data around for 5 minutes in case the user comes back.
      gcTime: 5 * 60 * 1000,
      // Don't hammer a possibly cold-starting backend with retries.
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
