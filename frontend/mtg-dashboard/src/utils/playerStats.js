export const PLAYER_SORTS = {
  name: { label: 'Name (A–Z)' },
  winrate: { label: 'Win rate (high to low)' },
  matches: { label: 'Most matches played' },
}

/**
 * Computes { matches, wins, winRate, decksOwned } per player from the full
 * /matches/detail + /decks/ lists — entirely client-side, no per-player
 * requests needed.
 */
export function computePlayerStats (players, matches, decks) {
  const statsByOwner = {}
  for (const m of matches) {
    for (const p of m.players) {
      if (!statsByOwner[p.owner_id]) statsByOwner[p.owner_id] = { matches: 0, wins: 0 }
      statsByOwner[p.owner_id].matches += 1
      statsByOwner[p.owner_id].wins += p.won === 1 ? 1 : 0
    }
  }

  const decksByOwner = {}
  for (const d of decks) {
    decksByOwner[d.ownerid] = (decksByOwner[d.ownerid] || 0) + 1
  }

  return players.map((pl) => {
    const s = statsByOwner[pl.userid] || { matches: 0, wins: 0 }
    return {
      ...pl,
      matches: s.matches,
      wins: s.wins,
      winRate: s.matches > 0 ? s.wins / s.matches : null,
      decksOwned: decksByOwner[pl.userid] || 0,
    }
  })
}

export function sortPlayers (playerStats, sort) {
  const result = [...playerStats]
  switch (sort) {
    case 'winrate':
      result.sort((a, b) => (b.winRate ?? -1) - (a.winRate ?? -1))
      break
    case 'matches':
      result.sort((a, b) => b.matches - a.matches)
      break
    case 'name':
    default:
      result.sort((a, b) => `${a.firstname} ${a.lastname}`.localeCompare(`${b.firstname} ${b.lastname}`))
  }
  return result
}
