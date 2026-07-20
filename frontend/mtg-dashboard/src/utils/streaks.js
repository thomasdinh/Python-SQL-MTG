/**
 * Computes streak stats from an array of 0/1 results in chronological
 * order (oldest first). Returns the current streak (ending at the most
 * recent game) and the longest win/loss runs anywhere in the history.
 */
export function computeStreaks (chronologicalResults) {
  if (chronologicalResults.length === 0) {
    return { current: 0, currentType: null, longestWin: 0, longestLoss: 0 }
  }

  let longestWin = 0
  let longestLoss = 0
  let runType = null
  let runLength = 0

  for (const r of chronologicalResults) {
    if (r === runType) {
      runLength += 1
    } else {
      runType = r
      runLength = 1
    }
    if (runType === 1) longestWin = Math.max(longestWin, runLength)
    else longestLoss = Math.max(longestLoss, runLength)
  }

  const last = chronologicalResults[chronologicalResults.length - 1]
  let current = 1
  for (let i = chronologicalResults.length - 2; i >= 0; i--) {
    if (chronologicalResults[i] === last) current += 1
    else break
  }

  return { current, currentType: last === 1 ? 'win' : 'loss', longestWin, longestLoss }
}
