import { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:8000'

function MatchHistory({ deckId }) {
  const [matchPlayers, setMatchPlayers] = useState([])
  const [matches, setMatches] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!deckId) return

    setLoading(true)
    setError(null)
    setMatchPlayers([])
    setMatches({})

    // step 1 — fetch match_player records for this deck
    fetch(`${API_BASE}/matches_by_deck/${deckId}`)
      .then((res) => {
        if (res.status === 404) return []
        if (!res.ok) throw new Error('Failed to load match history')
        return res.json()
      })
      .then((mpData) => {
        setMatchPlayers(mpData)

        if (mpData.length === 0) {
          setLoading(false)
          return
        }

        // step 2 — fetch match details for every unique match_id
        const uniqueMatchIds = [...new Set(mpData.map((mp) => mp.match_id))]

        return Promise.all(
          uniqueMatchIds.map((id) =>
            fetch(`${API_BASE}/matches/${id}`)
              .then((res) => res.ok ? res.json() : null)
              .catch(() => null)
          )
        ).then((matchData) => {
          // turn the array into an object keyed by match_id for easy lookup
          const matchMap = {}
          matchData.forEach((match) => {
            if (match) matchMap[match.match_id] = match
          })
          setMatches(matchMap)
          setLoading(false)
        })
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [deckId])

  if (loading) return <p className="text-xs text-gray-400 mt-2">Loading history...</p>
  if (error)   return <p className="text-xs text-red-400 mt-2">{error}</p>
  if (matchPlayers.length === 0) return <p className="text-xs text-gray-400 mt-2">No matches yet.</p>

  const wins = matchPlayers.filter((mp) => mp.won === 1).length
  const total = matchPlayers.length
  const winRate = Math.round((wins / total) * 100)

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">

      <div className="flex gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-400">Matches</p>
          <p className="text-sm font-medium text-gray-900">{total}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Wins</p>
          <p className="text-sm font-medium text-gray-900">{wins}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Win rate</p>
          <p className={`text-sm font-medium ${winRate >= 50 ? 'text-green-600' : 'text-red-500'}`}>
            {winRate}%
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {matchPlayers.map((mp) => {
          const match = matches[mp.match_id]
          return (
            <div
              key={mp.id}
              className="flex items-center gap-3 text-xs"
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${mp.won === 1 ? 'bg-green-500' : 'bg-red-400'}`} />
              <span className="text-gray-400 min-w-20">
                {match?.date ? match.date.slice(0, 10) : '—'}
              </span>
              <span className="text-gray-600">
                Place {mp.placement}
              </span>
              {match?.comment && (
                <span className="text-gray-400 truncate">{match.comment}</span>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}

export default MatchHistory