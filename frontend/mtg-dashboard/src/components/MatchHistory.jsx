import { useDeckMatchHistory } from '../hooks/useDecks'
import { useTranslation } from '../i18n/context'

function MatchHistory({ deckId }) {
  const { t } = useTranslation()
  const { data: matchPlayers = [], isLoading, error } = useDeckMatchHistory(deckId)

  if (isLoading) return <p className="text-xs text-parchment-faint mt-2">{t('common.loadingHistory')}</p>
  if (error)   return <p className="text-xs text-loss mt-2">{error.message}</p>
  if (matchPlayers.length === 0) return <p className="text-xs text-parchment-faint mt-2">{t('common.noMatchesYet')}</p>

  const wins = matchPlayers.filter((mp) => mp.won === 1).length
  const total = matchPlayers.length
  const winRate = Math.round((wins / total) * 100)

  return (
    <div className="mt-3 border-t border-hairline pt-3">

      <div className="flex gap-4 mb-3">
        <div>
          <p className="text-xs text-parchment-faint">{t('stat.matches')}</p>
          <p className="text-sm font-mono font-medium text-parchment">{total}</p>
        </div>
        <div>
          <p className="text-xs text-parchment-faint">{t('stat.wins')}</p>
          <p className="text-sm font-mono font-medium text-parchment">{wins}</p>
        </div>
        <div>
          <p className="text-xs text-parchment-faint">{t('stat.winRate')}</p>
          <p className={`text-sm font-mono font-medium ${winRate >= 50 ? 'text-win' : 'text-loss'}`}>
            {winRate}%
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {matchPlayers.map((mp) => (
          <div
            key={mp.id}
            className="flex items-center gap-3 text-xs"
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${mp.won === 1 ? 'bg-win' : 'bg-loss/70'}`} />
            <span className="text-parchment-faint min-w-20 font-mono">
              {mp.date ? mp.date.slice(0, 10) : '—'}
            </span>
            <span className="text-parchment-dim font-mono">
              #{mp.placement}
            </span>
            {mp.comment && (
              <span className="text-parchment-faint truncate italic">{mp.comment}</span>
            )}
          </div>
        ))}
      </div>

    </div>
  )
}

export default MatchHistory
