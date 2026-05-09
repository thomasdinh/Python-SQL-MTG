import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import MatchCard from '../components/MatchCard'
import AddMatchForm from '../components/AddMatchForm'

const API_BASE = 'http://localhost:8000'

function Matches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)

  function loadMatches() {
    setLoading(true)
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
  }

  useEffect(() => {
    loadMatches()
  }, [])

  function handleMatchAdded() {
    setShowForm(false)
    loadMatches()
  }

  if (loading) return <p className="p-8 text-sm text-gray-400">Loading matches...</p>
  if (error)   return <p className="p-8 text-sm text-red-400">Error: {error}</p>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-medium text-gray-900">
          Matches
          <span className="text-gray-400 font-normal text-lg ml-2">
            {matches.length}
          </span>
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancel' : 'Log match'}
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        {showForm && (
          <AddMatchForm onMatchAdded={handleMatchAdded} />
        )}

        {matches.length === 0 && !showForm ? (
          <p className="text-sm text-gray-400">No matches yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
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
        )}
      </div>
    </div>
  )
}

export default Matches