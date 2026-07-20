import { useQuery, useQueryClient } from '@tanstack/react-query'
import API_BASE from '../config'

async function fetchJson(url, options) {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`Request to ${url} failed (${res.status})`)
  return res.json()
}

export function usePlayers() {
  return useQuery({
    queryKey: ['players'],
    queryFn: () => fetchJson(`${API_BASE}/users/`),
  })
}

export function usePlayer(id) {
  return useQuery({
    queryKey: ['player', id],
    queryFn: () => fetchJson(`${API_BASE}/users/${id}`),
    enabled: !!id,
  })
}

/**
 * Call this after any mutation that adds/edits/removes a player
 * (create/update/delete) so every page showing player data refreshes.
 */
export function useInvalidatePlayers() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['players'] })
}
