import { useQuery, useQueryClient } from '@tanstack/react-query'
import API_BASE from '../config'

async function fetchJson(url) {
  const res = await fetch(url)
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`Request to ${url} failed (${res.status})`)
  return res.json()
}

/**
 * Decks + their match/win counts, fetched with ONE request via the backend's
 * /decks/with-stats join. Pass ownerId to scope to a single player's decks
 * (used by the player detail page); omit it for the full Decks page.
 */
export function useDecksWithStats(ownerId) {
  const url = ownerId
    ? `${API_BASE}/decks/with-stats?ownerid=${ownerId}`
    : `${API_BASE}/decks/with-stats`

  return useQuery({
    queryKey: ownerId ? ['decks', 'with-stats', ownerId] : ['decks', 'with-stats'],
    queryFn: () => fetchJson(url),
  })
}

/** Plain list of decks (id/name only) — used for dropdowns like AddMatchForm. */
export function useDecks() {
  return useQuery({
    queryKey: ['decks'],
    queryFn: () => fetchJson(`${API_BASE}/decks/`),
  })
}

export function useDeck(id) {
  return useQuery({
    queryKey: ['deck', id],
    queryFn: () => fetchJson(`${API_BASE}/decks/${id}`),
    enabled: !!id,
  })
}

/** A single deck's match history, joined server-side with match date/comment. */
export function useDeckMatchHistory(deckId) {
  return useQuery({
    queryKey: ['deck-match-history', deckId],
    queryFn: () => fetchJson(`${API_BASE}/matches_by_deck/${deckId}/detail`),
    enabled: !!deckId,
  })
}

/**
 * Call after any deck or match-player mutation (add/edit/delete deck,
 * log/delete a match) so deck lists and stats stay in sync.
 */
export function useInvalidateDecks() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['decks'] })
    queryClient.invalidateQueries({ queryKey: ['deck-match-history'] })
  }
}
