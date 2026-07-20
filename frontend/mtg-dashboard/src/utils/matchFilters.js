export const MATCH_SORTS = {
  date_desc: { label: 'Newest first' },
  date_asc: { label: 'Oldest first' },
  id_desc: { label: 'Match ID (high to low)' },
  id_asc: { label: 'Match ID (low to high)' },
}

/**
 * Applies the filters/sort selected in <MatchFilters> to a list of matches
 * from useMatchesDetailed (each match has a `players` array with
 * deck_id / deck_name / owner_id / placement / won).
 */
export function applyMatchFilters (matches, { from, to, minPlayers, deckId, ownerId, sort }) {
  let result = matches

  if (from) {
    result = result.filter((m) => m.date && m.date >= from)
  }
  if (to) {
    result = result.filter((m) => m.date && m.date <= to)
  }
  if (minPlayers) {
    result = result.filter((m) => m.players.length >= minPlayers)
  }
  if (deckId) {
    result = result.filter((m) => m.players.some((p) => p.deck_id === deckId))
  }
  if (ownerId) {
    result = result.filter((m) => m.players.some((p) => p.owner_id === ownerId))
  }

  result = [...result]
  switch (sort) {
    case 'date_asc':
      result.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      break
    case 'id_desc':
      result.sort((a, b) => b.match_id - a.match_id)
      break
    case 'id_asc':
      result.sort((a, b) => a.match_id - b.match_id)
      break
    case 'date_desc':
    default:
      result.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }

  return result
}
