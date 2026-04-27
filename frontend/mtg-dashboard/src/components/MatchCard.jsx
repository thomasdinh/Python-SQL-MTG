import { useState } from 'react'
import { Trash2, Trophy, Swords } from 'lucide-react'
const API_BASE = 'http://localhost:8000'

function MatchCard ({ match, onMatchDeleted }) {
  const [deleting, setDeleting] = useState(false)

  function handleDelete () {
    if (!confirm(`Delete match from ${match.date}?`)) return
    setDeleting(true)
    fetch(`${API_BASE}/matches/${match.match_id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete match')
        onMatchDeleted(match.match_id)
      })
      .catch(err => {
        alert(err.message)
        setDeleting(false)
      })
  }

  const winners = match.players.filter(p => p.won === 1)
  const isDraw = winners.length > 1

  return (
    <div className='bg-white border border-gray-200 rounded-xl p-5'>
      <div className='flex items-center justify-between mb-4'>
        <p className='text-sm font-medium text-gray-900'>
          Match #{match.match_id ? match.match_id : '—'}
        </p>
        <p className='text-sm font-medium text-gray-900'>
          {match.date ? match.date.slice(0, 10) : '—'}
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className='text-gray-300 hover:text-red-500 disabled:opacity-50 transition-colors'
        >
          <Trash2 size={15} />
        </button>
      </div>

      {isDraw ? (
        <div className='flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-3'>
          <Swords size={13} className='text-blue-500 flex-shrink-0' />
          <span className='text-sm font-medium text-blue-800'>
            Draw between {winners.length} players
          </span>
        </div>
      ) : winners.length === 1 ? (
        <div className='flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2 mb-3'>
          <Trophy size={13} className='text-green-600 flex-shrink-0' />
          <span className='text-sm font-medium text-green-800 truncate'>
            {winners[0].deck_name}
          </span>
        </div>
      ) : null}

      <div className='flex flex-col gap-1.5'>
        {match.players.map(player => (
          <div
            key={player.id}
            className='flex items-center gap-3 text-xs min-w-0'
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                player.won === 1 ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
            <span className='text-gray-400 w-6 flex-shrink-0'>
              #{player.placement}
            </span>
            <span
              className={`flex-1 truncate ${
                player.won === 1 ? 'text-gray-900 font-medium' : 'text-gray-500'
              }`}
            >
              {player.deck_name}
            </span>
          </div>
        ))}
      </div>

      {match.comment && (
        <p className='text-xs text-gray-400 mt-3'>{match.comment}</p>
      )}
    </div>
  )
}

export default MatchCard
