/**
 * Narrows the full /matches/detail list down to matches a given deck or
 * player took part in, applying every filter except match exclusion (that
 * one's applied later, once the candidate set is known — see
 * computeWinRateProgression below).
 */
export function filterSubjectMatches (matches, {
  subjectType,      // 'deck' | 'player'
  subjectId,
  from, to,
  groupId,
  opponentPlayerId,
  opponentDeckId,
}) {
  const isSubjectRow = (p) => (subjectType === 'deck' ? p.deck_id === subjectId : p.owner_id === subjectId)
  const isOtherRow = (p) => (subjectType === 'deck' ? p.deck_id !== subjectId : p.owner_id !== subjectId)

  let result = matches.filter((m) => m.players.some(isSubjectRow))

  if (from) result = result.filter((m) => m.date && m.date >= from)
  if (to) result = result.filter((m) => m.date && m.date <= to)
  if (groupId != null) result = result.filter((m) => m.group_id === groupId)
  if (opponentPlayerId) {
    result = result.filter((m) => m.players.some((p) => isOtherRow(p) && p.owner_id === opponentPlayerId))
  }
  if (opponentDeckId) {
    result = result.filter((m) => m.players.some((p) => isOtherRow(p) && p.deck_id === opponentDeckId))
  }

  return result
}

/**
 * Turns a (pre-filtered) list of matches into a chronological win-rate
 * progression: one point per match, in play order, either the running
 * cumulative win rate or a rolling window over the last N games.
 */
export function computeWinRateProgression (candidateMatches, {
  subjectType,
  subjectId,
  excludeMatchIds = [],
  mode = 'cumulative', // 'cumulative' | 'rolling'
  windowSize = 5,
}) {
  const isSubjectRow = (p) => (subjectType === 'deck' ? p.deck_id === subjectId : p.owner_id === subjectId)

  const included = candidateMatches.filter((m) => !excludeMatchIds.includes(m.match_id))

  const sorted = [...included].sort((a, b) => {
    const byDate = (a.date || '').localeCompare(b.date || '')
    return byDate !== 0 ? byDate : a.match_id - b.match_id
  })

  let wins = 0
  const results = []

  return sorted.map((m, i) => {
    const row = m.players.find(isSubjectRow)
    const won = row?.won === 1 ? 1 : 0
    results.push(won)
    wins += won
    const game = i + 1

    const rate =
      mode === 'rolling'
        ? results.slice(-windowSize).reduce((s, w) => s + w, 0) / results.slice(-windowSize).length
        : wins / game

    return {
      match_id: m.match_id,
      date: m.date,
      game,
      won,
      winRate: Math.round(rate * 100),
    }
  })
}
