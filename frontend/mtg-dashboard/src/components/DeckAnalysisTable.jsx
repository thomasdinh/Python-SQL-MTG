import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { analyzeDeck } from '../utils/deckAnalysis'
import { useTranslation } from '../i18n/context'

const MEDALS = ['\u{1F947}', '\u{1F948}', '\u{1F949}'] // gold, silver, bronze
const MIN_GAMES = 3

const CONFIDENCE_COLOR = {
  high: 'bg-win',
  medium: 'bg-brass',
  low: 'bg-loss',
}

/**
 * Turns each deck's matches into a chronological (oldest-first) array of
 * 0/1 results — what utils/deckAnalysis.js needs to compute a real
 * confidence interval and trend, not just an aggregate win rate.
 */
function chronologicalResultsFor (deckId, matches) {
  return matches
    .filter((m) => m.players.some((p) => p.deck_id === deckId))
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .map((m) => m.players.find((p) => p.deck_id === deckId).won)
}

function lastPlayedDate (deckId, matches) {
  const dates = matches
    .filter((m) => m.players.some((p) => p.deck_id === deckId))
    .map((m) => m.date)
    .filter(Boolean)
  return dates.length > 0 ? dates.sort().at(-1) : null
}

function DeckAnalysisTable ({ decks, matches }) {
  const { t } = useTranslation()

  const { ranked, needsMoreData } = useMemo(() => {
    const analyzed = decks.map((deck) => {
      const results = chronologicalResultsFor(deck.deckid, matches)
      return {
        ...analyzeDeck(deck, results),
        lastPlayed: lastPlayedDate(deck.deckid, matches),
      }
    })

    const ranked = analyzed
      .filter((d) => d.games >= MIN_GAMES)
      .sort((a, b) => b.winRate - a.winRate)
    const needsMoreData = analyzed
      .filter((d) => d.games < MIN_GAMES)
      .sort((a, b) => b.games - a.games)

    return { ranked, needsMoreData }
  }, [decks, matches])

  if (ranked.length === 0 && needsMoreData.length === 0) {
    return <p className="text-sm text-parchment-faint">No match data yet.</p>
  }

  return (
    <div className="bg-surface border border-hairline rounded-lg p-5">
      <h3 className="text-sm font-medium text-parchment mb-4">{t('analysis.title')}</h3>

      {ranked.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-hairline text-xs text-parchment-faint uppercase tracking-wide">
                <th className="text-left font-medium pb-2 pr-3">{t('analysis.deck')}</th>
                <th className="text-right font-medium pb-2 px-3">{t('analysis.winRate')}</th>
                <th className="text-right font-medium pb-2 px-3">{t('analysis.games')}</th>
                <th className="text-left font-medium pb-2 px-3" title={t('analysis.confidenceHint')}>
                  {t('analysis.confidence')}
                </th>
                <th className="text-left font-medium pb-2 pl-3" title={t('analysis.trendHint')}>
                  {t('analysis.trend')}
                </th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((d, i) => (
                <tr key={d.deckid} className="border-b border-hairline last:border-0">
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {MEDALS[i] && <span className="flex-shrink-0">{MEDALS[i]}</span>}
                      <div className="min-w-0">
                        <p className="text-parchment font-medium truncate">{d.deckname}</p>
                        {d.lastPlayed && (
                          <p className="text-xs text-parchment-faint">
                            {t('analysis.lastPlayed').replace('{date}', d.lastPlayed)}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`font-mono font-medium ${d.winRate >= 0.5 ? 'text-win' : 'text-loss'}`}>
                        {Math.round(d.winRate * 100)}%
                      </span>
                      <div className="w-24 h-1.5 bg-ink rounded-full overflow-hidden">
                        <div
                          className={d.winRate >= 0.5 ? 'h-full bg-win' : 'h-full bg-loss'}
                          style={{ width: `${Math.round(d.winRate * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-parchment-dim">{d.games}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${CONFIDENCE_COLOR[d.confidence]}`} />
                      <span className="text-xs text-parchment-dim">
                        {t(`analysis.${d.confidence}`)}
                        <span className="text-parchment-faint font-mono"> ±{d.marginPct.toFixed(1)}</span>
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pl-3">
                    <TrendCell trend={d.trend} t={t} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {needsMoreData.length > 0 && (
        <div className="mt-4 pt-3 border-t border-hairline border-dashed flex flex-wrap items-center gap-2">
          <span className="text-xs text-parchment-faint mr-1">
            {t('analysis.needsMoreData').replace('{n}', MIN_GAMES)}:
          </span>
          {needsMoreData.map((d) => (
            <span key={d.deckid} className="text-xs bg-ink-2 text-parchment-faint px-2.5 py-1 rounded-md font-mono">
              {d.deckname} ({d.games}/{MIN_GAMES})
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function TrendCell ({ trend, t }) {
  if (!trend) {
    return <span className="text-xs text-parchment-faint">{t('analysis.new')}</span>
  }

  const sign = trend.deltaPct > 0 ? '+' : ''
  if (trend.direction === 'up') {
    return (
      <span className="flex items-center gap-1 text-xs text-win font-mono">
        <TrendingUp size={12} />
        {sign}{trend.deltaPct.toFixed(1)}%
      </span>
    )
  }
  if (trend.direction === 'down') {
    return (
      <span className="flex items-center gap-1 text-xs text-loss font-mono">
        <TrendingDown size={12} />
        {trend.deltaPct.toFixed(1)}%
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-parchment-faint">
      <Minus size={12} />
      {t('analysis.stable')}
    </span>
  )
}

export default DeckAnalysisTable