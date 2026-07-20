import { useQuery, useQueryClient } from '@tanstack/react-query'
import API_BASE from '../config'

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request to ${url} failed (${res.status})`)
  return res.json()
}

/** Plain match list (no joined player/deck detail) — cheap, used for counts. */
export function useMatchesList() {
  return useQuery({
    queryKey: ['matches', 'list'],
    queryFn: () => fetchJson(`${API_BASE}/matches/`),
  })
}

/** All matches with players+deck names already joined in — a single request. */
export function useMatchesDetailed() {
  return useQuery({
    queryKey: ['matches', 'detail'],
    queryFn: () => fetchJson(`${API_BASE}/matches/detail`),
  })
}

/**
 * Every match-player row across all of a player's decks — the raw
 * placement/won data the WinRateChart and PlacementChart need. One request,
 * joined server-side, instead of looping per-deck on the client.
 */
export function useMatchesByPlayer(ownerId) {
  return useQuery({
    queryKey: ['matches', 'by-player', ownerId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/matches_by_player/${ownerId}`)
      if (res.status === 404) return []
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      return res.json()
    },
    enabled: !!ownerId,
  })
}

export function useInvalidateMatches() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['matches'] })
    queryClient.invalidateQueries({ queryKey: ['decks'] }) // win/match counts changed too
    queryClient.invalidateQueries({ queryKey: ['deck-match-history'] })
  }
}
