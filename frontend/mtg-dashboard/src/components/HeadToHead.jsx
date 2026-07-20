import { computeHeadToHead } from '../utils/headToHead'
import { useTranslation } from '../i18n/context'

function HeadToHead ({ matches, players, subjectOwnerId }) {
  const { t } = useTranslation()
  const records = computeHeadToHead(matches, subjectOwnerId, players)

  if (records.length === 0) {
    return null
  }

  return (
    <div className="bg-surface border border-hairline rounded-lg p-5">
      <h3 className="text-sm font-medium text-parchment mb-1">{t('headtohead.title')}</h3>
      <p className="text-xs text-parchment-faint mb-4">
        {t('headtohead.description')}
      </p>
      <div className="flex flex-col gap-2">
        {records.map((r) => (
          <div key={r.ownerId} className="flex items-center gap-3">
            <span className="text-sm text-parchment flex-1 min-w-0 truncate">{r.name}</span>
            <span className="text-xs font-mono text-parchment-faint w-20 text-right">
              {r.gamesTogether} {r.gamesTogether === 1 ? t('headtohead.game') : t('headtohead.games')}
            </span>
            <div className="w-28 h-1.5 bg-ink rounded-full overflow-hidden flex-shrink-0">
              <div
                className="h-full bg-brass"
                style={{ width: `${Math.round((r.subjectWinRate ?? 0) * 100)}%` }}
              />
            </div>
            <span className={`text-xs font-mono w-24 text-right ${r.subjectWinRate >= 0.5 ? 'text-win' : 'text-loss'}`}>
              {Math.round(r.subjectWinRate * 100)}% ({r.subjectWins}-{r.gamesTogether - r.subjectWins})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HeadToHead
