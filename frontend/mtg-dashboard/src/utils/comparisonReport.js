import { computeDeckStatsInRange, assignTiers } from './deckTiers'
import { computePlayerStatsInRange } from './playerStats'
import { computeStreaks } from './streaks'

function filterByPeriod (matches, period, groupId) {
  let result = matches
  if (period.from) result = result.filter((m) => m.date && m.date >= period.from)
  if (period.to) result = result.filter((m) => m.date && m.date <= period.to)
  if (groupId != null) result = result.filter((m) => m.group_id === groupId)
  return result
}

function chronologicalDeckResults (deckId, matches) {
  return matches
    .filter((m) => m.players.some((p) => p.deck_id === deckId))
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .map((m) => ({ won: m.players.find((p) => p.deck_id === deckId).won, placement: m.players.find((p) => p.deck_id === deckId).placement }))
}

function chronologicalPlayerResults (ownerId, matches) {
  return matches
    .filter((m) => m.players.some((p) => p.owner_id === ownerId))
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .map((m) => ({ won: m.players.find((p) => p.owner_id === ownerId).won, placement: m.players.find((p) => p.owner_id === ownerId).placement }))
}

function avgPlacement (rows) {
  if (rows.length === 0) return null
  return rows.reduce((sum, r) => sum + r.placement, 0) / rows.length
}

function streakLabel (streaks) {
  if (streaks.current === 0) return '—'
  return `${streaks.currentType === 'win' ? 'W' : 'L'}${streaks.current}`
}

/**
 * How many shared games two specific decks were both in, and who won more
 * of them — the deck equivalent of the player head-to-head feature.
 */
export function computeDeckHeadToHead (deckAId, deckBId, matches) {
  let gamesTogether = 0
  let aWins = 0
  let bWins = 0
  for (const m of matches) {
    const a = m.players.find((p) => p.deck_id === deckAId)
    const b = m.players.find((p) => p.deck_id === deckBId)
    if (!a || !b) continue
    gamesTogether += 1
    if (a.won === 1) aWins += 1
    if (b.won === 1) bWins += 1
  }
  return { gamesTogether, aWins, bWins }
}

/**
 * Which of a player's decks they played the most within the period.
 */
export function favoriteDeckForPlayer (ownerId, matches, decks) {
  const counts = {}
  for (const m of matches) {
    const row = m.players.find((p) => p.owner_id === ownerId)
    if (!row) continue
    counts[row.deck_id] = (counts[row.deck_id] || 0) + 1
  }
  const topId = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]
  if (!topId) return null
  const deck = decks.find((d) => d.deckid === Number(topId))
  return deck ? { deck, games: counts[topId] } : null
}

/**
 * A short, plain-language sentence naming the single biggest difference
 * between the two entities — deliberately picks ONE thing rather than
 * trying to summarize everything, since a report that says "here's the
 * one thing that actually stands out" is more useful than a hedge.
 */
function generateInsight (name1, name2, winRate1, winRate2, games1, games2) {
  if (winRate1 == null && winRate2 == null) {
    return `Neither ${name1} nor ${name2} has enough games in this range to compare.`
  }
  if (winRate1 == null) return `${name2} has ${games2} games in this range (${Math.round(winRate2 * 100)}% win rate); ${name1} has no games recorded.`
  if (winRate2 == null) return `${name1} has ${games1} games in this range (${Math.round(winRate1 * 100)}% win rate); ${name2} has no games recorded.`

  const diff = Math.round((winRate1 - winRate2) * 100)
  if (Math.abs(diff) < 3) {
    return `${name1} and ${name2} are running near-identical win rates in this range (${Math.round(winRate1 * 100)}% vs ${Math.round(winRate2 * 100)}%).`
  }
  const leader = diff > 0 ? name1 : name2
  const trailer = diff > 0 ? name2 : name1
  const leaderRate = Math.round((diff > 0 ? winRate1 : winRate2) * 100)
  const trailerRate = Math.round((diff > 0 ? winRate2 : winRate1) * 100)
  return `${leader} is winning more often than ${trailer} in this range — ${leaderRate}% vs ${trailerRate}%.`
}

/**
 * The full structured report for two decks over one time range: a summary
 * insight, then a side-by-side metrics table. Metrics that this app
 * genuinely doesn't track (like turn count — there's no such column
 * anywhere in the schema) are included as explicit "Not tracked" rows
 * rather than silently dropped or guessed at.
 */
export function generateDeckReport (deckA, deckB, allDecks, matches, period, groupId, tierOptions = {}, t = (k, d) => d) {
  const { metric = 'winrate', minGames = 3, thresholds } = tierOptions
  const periodMatches = filterByPeriod(matches, period, groupId)

  const allStats = computeDeckStatsInRange(allDecks, periodMatches, {})
  const statsA = allStats.find((d) => d.deckid === deckA.deckid)
  const statsB = allStats.find((d) => d.deckid === deckB.deckid)

  const { byTier } = assignTiers(allStats, { metric, minGames, thresholds })
  const tierOf = (deckId) => {
    for (const tier of Object.keys(byTier)) if (byTier[tier].some((d) => d.deckid === deckId)) return tier
    return null
  }

  const rowsA = chronologicalDeckResults(deckA.deckid, periodMatches)
  const rowsB = chronologicalDeckResults(deckB.deckid, periodMatches)
  const streaksA = computeStreaks(rowsA.map((r) => r.won))
  const streaksB = computeStreaks(rowsB.map((r) => r.won))
  const h2h = computeDeckHeadToHead(deckA.deckid, deckB.deckid, periodMatches)

  const insight = generateInsight(deckA.deckname, deckB.deckname, statsA.winRate, statsB.winRate, statsA.matches, statsB.matches)

  return {
    title: `Comparison: ${deckA.deckname} vs. ${deckB.deckname}`,
    periodLabel: period.label || `${period.from || 'all time'} \u2013 ${period.to || 'now'}`,
    insight,
    metrics: [
      {
        label: t('matches.reportWinRate', 'Win Rate'),
        value1: statsA.winRate != null ? `${Math.round(statsA.winRate * 100)}%` : '\u2014',
        value2: statsB.winRate != null ? `${Math.round(statsB.winRate * 100)}%` : '\u2014',
        better: compareBetter(statsA.winRate, statsB.winRate),
      },
      {
        label: t('matches.reportMatchesPlayed', 'Matches Played'),
        value1: statsA.matches,
        value2: statsB.matches,
        better: null,
      },
      {
        label: t('matches.reportCurrentStreak', 'Current Streak'),
        value1: streakLabel(streaksA),
        value2: streakLabel(streaksB),
        better: compareBetter(streakSign(streaksA), streakSign(streaksB)),
      },
      {
        label: t('matches.reportLongestStreak', 'Longest Win Streak'),
        value1: streaksA.longestWin,
        value2: streaksB.longestWin,
        better: compareBetter(streaksA.longestWin, streaksB.longestWin),
      },
      {
        label: t('matches.reportHeadToHead', 'Head-to-Head'),
        value1: h2h.gamesTogether > 0 ? `${h2h.aWins}-${h2h.bWins}` : 'No shared games',
        value2: h2h.gamesTogether > 0 ? `${h2h.bWins}-${h2h.aWins}` : 'No shared games',
        better: h2h.gamesTogether > 0 ? compareBetter(h2h.aWins, h2h.bWins) : null,
      },
      {
        label: t('matches.reportAvgPlacement', 'Avg. Placement'),
        value1: fmtAvg(avgPlacement(rowsA)),
        value2: fmtAvg(avgPlacement(rowsB)),
        better: compareBetter(negOrNull(avgPlacement(rowsA)), negOrNull(avgPlacement(rowsB))), // lower placement is better
      },
      {
        label: t('matches.reportTier', 'Tier'),
        value1: tierOf(deckA.deckid) || 'Unranked',
        value2: tierOf(deckB.deckid) || 'Unranked',
        better: null,
      },
      {
        label: t('matches.reportTurns', 'Avg. Turns to Win'),
        value1: 'Not tracked',
        value2: 'Not tracked',
        better: null,
        note: t('matches.reportNotTrackedNote', 'This app doesn\u2019t record turn counts, so this can\u2019t be computed from real data.'),
      },
    ],
  }
}

/**
 * Same shape, for two players — "Favorite Commander" replaces "Tier"
 * (players don't have a tier; their decks do).
 */
export function generatePlayerReport (playerA, playerB, allPlayers, decks, matches, period, groupId, t = (k, d) => d) {
  const periodMatches = filterByPeriod(matches, period, groupId)

  const allStats = computePlayerStatsInRange(allPlayers, periodMatches, decks, {})
  const statsA = allStats.find((p) => p.userid === playerA.userid)
  const statsB = allStats.find((p) => p.userid === playerB.userid)

  const rowsA = chronologicalPlayerResults(playerA.userid, periodMatches)
  const rowsB = chronologicalPlayerResults(playerB.userid, periodMatches)
  const streaksA = computeStreaks(rowsA.map((r) => r.won))
  const streaksB = computeStreaks(rowsB.map((r) => r.won))

  const favA = favoriteDeckForPlayer(playerA.userid, periodMatches, decks)
  const favB = favoriteDeckForPlayer(playerB.userid, periodMatches, decks)

  const nameA = `${playerA.firstname} ${playerA.lastname}`
  const nameB = `${playerB.firstname} ${playerB.lastname}`
  const insight = generateInsight(nameA, nameB, statsA.winRate, statsB.winRate, statsA.matches, statsB.matches)

  return {
    title: `Comparison: ${nameA} vs. ${nameB}`,
    periodLabel: period.label || `${period.from || 'all time'} \u2013 ${period.to || 'now'}`,
    insight,
    metrics: [
      {
        label: t('matches.reportWinRate', 'Win Rate'),
        value1: statsA.winRate != null ? `${Math.round(statsA.winRate * 100)}%` : '\u2014',
        value2: statsB.winRate != null ? `${Math.round(statsB.winRate * 100)}%` : '\u2014',
        better: compareBetter(statsA.winRate, statsB.winRate),
      },
      {
        label: t('matches.reportMatchesPlayed', 'Matches Played'),
        value1: statsA.matches,
        value2: statsB.matches,
        better: null,
      },
      {
        label: t('matches.reportFavCommander', 'Favorite Commander'),
        value1: favA ? `${favA.deck.deckname} (${favA.games}g)` : '\u2014',
        value2: favB ? `${favB.deck.deckname} (${favB.games}g)` : '\u2014',
        better: null,
      },
      {
        label: t('matches.reportLongestStreak', 'Longest Win Streak'),
        value1: streaksA.longestWin,
        value2: streaksB.longestWin,
        better: compareBetter(streaksA.longestWin, streaksB.longestWin),
      },
      {
        label: t('matches.reportCurrentStreak', 'Current Streak'),
        value1: streakLabel(streaksA),
        value2: streakLabel(streaksB),
        better: compareBetter(streakSign(streaksA), streakSign(streaksB)),
      },
      {
        label: t('matches.reportAvgPlacement', 'Avg. Placement'),
        value1: fmtAvg(avgPlacement(rowsA)),
        value2: fmtAvg(avgPlacement(rowsB)),
        better: compareBetter(negOrNull(avgPlacement(rowsA)), negOrNull(avgPlacement(rowsB))),
      },
    ],
  }
}

function compareBetter (a, b) {
  if (a == null || b == null) return null
  if (a === b) return null
  return a > b ? 1 : 2
}

function streakSign (streaks) {
  if (streaks.current === 0) return 0
  return streaks.currentType === 'win' ? streaks.current : -streaks.current
}

function negOrNull (v) {
  return v == null ? null : -v
}

function fmtAvg (v) {
  return v == null ? '\u2014' : v.toFixed(1)
}