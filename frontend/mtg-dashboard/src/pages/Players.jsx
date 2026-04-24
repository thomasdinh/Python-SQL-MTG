import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, User } from 'lucide-react'

const API_BASE = 'http://localhost:8000'

function Players() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${API_BASE}/users/`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load players')
        return res.json()
      })
      .then((data) => {
        setPlayers(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="p-8 text-sm text-gray-400">Loading players...</p>
  if (error)   return <p className="p-8 text-sm text-red-400">{error}</p>

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-medium text-gray-900 mb-6">Players</h1>
      <div className="flex flex-col gap-2">
        {players.map((player) => (
          <button
            key={player.userid}
            onClick={() => navigate(`/players/${player.userid}`)}
            className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4 hover:border-purple-300 hover:shadow-sm transition-all text-left"
          >
            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-purple-600" />
            </div>
            <span className="flex-1 font-medium text-gray-900">
              {player.firstname} {player.lastname}
            </span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        ))}
      </div>
    </div>
  )
}

export default Players