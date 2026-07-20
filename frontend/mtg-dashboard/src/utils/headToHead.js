/**
 * For a given player, computes their record against every other player
 * they've shared a table with: games played together, and how many of
 * those each of them won. This is a multiplayer "rivalry" stat, not 1v1
 * combat — "gamesTogether" means both were in the same match, not that
 * they fought each other exclusively.
 */
export function computeHeadToHead (matches, subjectOwnerId, players) {
  const recordByOpponent = {}

  for (const m of matches) {
    const subjectRow = m.players.find((p) => p.owner_id === subjectOwnerId)
    if (!subjectRow) continue

    // Dedupe by opponent, not by row — a player could in principle have
    // more than one deck in the same match (the schema doesn't forbid it),
    // and that should still only count as one "game together" against them.
    const opponentIds = new Set(m.players.map((p) => p.owner_id).filter((id) => id !== subjectOwnerId))

    for (const opponentId of opponentIds) {
      if (!recordByOpponent[opponentId]) {
        recordByOpponent[opponentId] = { gamesTogether: 0, subjectWins: 0, opponentWins: 0 }
      }
      const rec = recordByOpponent[opponentId]
      rec.gamesTogether += 1
      if (subjectRow.won === 1) rec.subjectWins += 1
      if (m.players.some((p) => p.owner_id === opponentId && p.won === 1)) rec.opponentWins += 1
    }
  }

  return Object.entries(recordByOpponent)
    .map(([ownerId, rec]) => {
      const player = players.find((pl) => pl.userid === Number(ownerId))
      return {
        ownerId: Number(ownerId),
        name: player ? `${player.firstname} ${player.lastname}` : `Player ${ownerId}`,
        ...rec,
        subjectWinRate: rec.gamesTogether > 0 ? rec.subjectWins / rec.gamesTogether : null,
      }
    })
    .sort((a, b) => b.gamesTogether - a.gamesTogether)
}
