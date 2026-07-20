import { useState } from 'react'
import { Trash2, Trophy, Swords } from 'lucide-react'
import  API_BASE  from '../config'
import { useTranslation } from '../i18n/context'

function MatchCard ({ match, onMatchDeleted }) {
  const { t } = useTranslation()
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
    <div className='bg-surface border border-hairline rounded-lg p-5'>
      <div className='flex items-center justify-between mb-4'>
        <p className='text-xs font-mono text-parchment-faint'>
          #{match.match_id ? match.match_id : '—'}
        </p>
        <p className='text-xs font-mono text-parchment-dim'>
          {match.date ? match.date.slice(0, 10) : '—'}
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className='text-parchment-faint hover:text-loss disabled:opacity-50 transition-colors'
        >
          <Trash2 size={15} />
        </button>
      </div>

      {isDraw ? (
        <div className='flex items-center gap-2 bg-draw/10 border border-draw/30 rounded-md px-3 py-2 mb-3'>
          <Swords size={13} className='text-draw flex-shrink-0' />
          <span className='text-sm font-medium text-parchment'>
            {t('matches.drawBetween', { n: winners.length })}
          </span>
        </div>
      ) : winners.length === 1 ? (
        <div className='flex items-center gap-2 bg-win/10 border border-win/30 rounded-md px-3 py-2 mb-3'>
          <Trophy size={13} className='text-win flex-shrink-0' />
          <span className='text-sm font-medium text-parchment truncate'>
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
                player.won === 1 ? 'bg-win' : 'bg-hairline-2'
              }`}
            />
            <span className='text-parchment-faint w-6 flex-shrink-0 font-mono'>
              #{player.placement}
            </span>
            <span
              className={`flex-1 truncate ${
                player.won === 1 ? 'text-parchment font-medium' : 'text-parchment-dim'
              }`}
            >
              {player.deck_name}
            </span>
          </div>
        ))}
      </div>

      {match.comment && (
        <p className='text-xs text-parchment-faint mt-3 italic'>{match.comment}</p>
      )}
    </div>
  )
}

export default MatchCard
