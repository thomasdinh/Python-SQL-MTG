import { useState, useEffect } from 'react'
import MatchCard from '../components/MatchCard'

const API_BASE = 'http://localhost:8000'

function Matches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/matches/`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load matches')
        return res.json()
      })
      .then((data) => {
        return Promise.all(
          data.map((m) =>
            fetch(`${API_BASE}/matches/${m.match_id}/detail`)
              .then((res) => {
                if (!res.ok) throw new Error(`Failed to load detail for match ${m.match_id}`)
                return res.json()
              })
          )
        )
      })
      .then((detailed) => {
        setMatches(detailed)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="p-8 text-sm text-gray-400">Loading matches...</p>
  if (error)   return <p className="p-8 text-sm text-red-400">Error: {error}</p>
  if (matches.length === 0) return <p className="p-8 text-sm text-gray-400">No matches found.</p>

  return (
  <div className="p-8">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-medium text-gray-900">Matches</h1>
      <h1 className="text-sm text-gray-500">{matches.length} Matches logged</h1>
    </div>
  
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem'}}>
      {matches.map((match) => (
        <MatchCard
          key={match.match_id}
          match={match}
          onMatchDeleted={(deletedId) =>
            setMatches(matches.filter((m) => m.match_id !== deletedId))
          }
        />
      ))}
    </div>
  </div>
)
}

export default Matches