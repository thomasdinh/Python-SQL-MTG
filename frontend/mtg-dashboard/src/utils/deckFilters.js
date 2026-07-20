export const DECK_SORTS = {
  name: { label: 'Name (A–Z)' },
  winrate: { label: 'Win rate (high to low)' },
  matches: { label: 'Most matches played' },
  recent: { label: 'Most recently played' },
}

/**
 * Applies the deck filters/sort selected in <DeckFilters> to a list of
 * decks from useDecksWithStats. Pure function so it's easy to unit-reason
 * about and reuse.
 */
export function applyDeckFilters (decks, { ownerId, colors, sort }) {
  let result = decks

  if (ownerId) {
    result = result.filter((d) => d.ownerid === ownerId)
  }

  if (colors.length > 0) {
    result = result.filter((d) => {
      const deckColors = (d.color || '').toUpperCase()
      return colors.some((c) => deckColors.includes(c))
    })
  }

  result = [...result]
  switch (sort) {
    case 'winrate':
      result.sort((a, b) => {
        const rateA = a.matches > 0 ? a.wins / a.matches : -1
        const rateB = b.matches > 0 ? b.wins / b.matches : -1
        return rateB - rateA
      })
      break
    case 'matches':
      result.sort((a, b) => (b.matches || 0) - (a.matches || 0))
      break
    case 'recent':
      result.sort((a, b) => {
        if (!a.last_played) return 1
        if (!b.last_played) return -1
        return b.last_played.localeCompare(a.last_played)
      })
      break
    case 'name':
    default:
      result.sort((a, b) => a.deckname.localeCompare(b.deckname))
  }

  return result
}
