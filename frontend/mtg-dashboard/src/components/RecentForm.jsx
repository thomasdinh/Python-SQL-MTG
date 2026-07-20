import { recentForm } from '../utils/deckAnalysis'
import { useTranslation } from '../i18n/context'

/**
 * Shows the last N games (default 10) as a row of dots — green for a win,
 * red for a loss, oldest to newest — plus a "7W • 3L" summary. This is
 * what replaced the old per-deck placement chart: a placement breakdown
 * (1st/2nd/3rd/4th) mostly reflects Commander's multiplayer politics —
 * concessions, kingmaking, who the table decided to gang up on — rather
 * than the deck's own strength, and a bar chart of it doesn't actually
 * change what a player would do next. "Is this deck hot or cold right
 * now" does.
 */
function RecentForm ({ chronologicalResults, windowSize = 10, size = 'md' }) {
  const { t } = useTranslation()
  const { results, wins, losses } = recentForm(chronologicalResults, windowSize)

  if (results.length === 0) {
    return <p className="text-xs text-parchment-faint">{t('analysis.noGamesYet')}</p>
  }

  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {results.map((r, i) => (
          <span
            key={i}
            className={`${dotSize} rounded-full flex-shrink-0 ${r === 1 ? 'bg-win' : 'bg-loss'}`}
            title={r === 1 ? 'W' : 'L'}
          />
        ))}
      </div>
      <span className="text-xs font-mono text-parchment-faint whitespace-nowrap">
        {t('analysis.recentFormWL', { w: wins, l: losses })}
      </span>
    </div>
  )
}

export default RecentForm