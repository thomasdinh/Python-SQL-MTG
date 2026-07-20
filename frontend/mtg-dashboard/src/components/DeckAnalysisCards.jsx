import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Info, Layers } from 'lucide-react'
import { analyzeDeck, performanceScore, gamesInLastNDays } from '../utils/deckAnalysis'
import ColorIdentity from './ColorIdentity'
import RecentForm from './RecentForm'
import { useTranslation } from '../i18n/context'

const MEDALS = ['\u{1F947}', '\u{1F948}', '\u{1F949}']
const MIN_GAMES = 3
const RING_RADIUS = 40
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const CONFIDENCE_COLOR = { high: 'bg-win', medium: 'bg-brass', low: 'bg-loss' }

function deckMatchInfo (deckId, matches) {
  const deckMatches = matches.filter((m) => m.players.some((p) => p.deck_id === deckId))
  const sorted = deckMatches.slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  const chronologicalResults = sorted.map((m) => m.players.find((p) => p.deck_id === deckId).won)
  const dates = sorted.map((m) => m.date).filter(Boolean)
  return { chronologicalResults, dates, lastPlayed: dates.at(-1) ?? null }
}

const SORT_OPTIONS = {
  score: (a, b) => (b.score ?? -1) - (a.score ?? -1),
  winrate: (a, b) => b.winRate - a.winRate,
  games: (a, b) => b.games - a.games,
  trend: (a, b) => (b.trend?.deltaPct ?? -Infinity) - (a.trend?.deltaPct ?? -Infinity),
  confidence: (a, b) => a.marginPct - b.marginPct,
}

/**
 * A grid of per-deck analysis cards, replacing the old spreadsheet-style
 * table. Cards are how people naturally compare a handful of things they
 * own (Steam library, GitHub repos) — a table forces you to scan across
 * columns to build the same picture a card gives you at a glance.
 */
function DeckAnalysisCards ({ decks, matches }) {
  const { t } = useTranslation()
  const [sort, setSort] = useState('score')

  const { ranked, needsMoreData } = useMemo(() => {
    const analyzed = decks.map((deck) => {
      const { chronologicalResults, dates, lastPlayed } = deckMatchInfo(deck.deckid, matches)
      const base = analyzeDeck(deck, chronologicalResults)
      return {
        ...base,
        chronologicalResults,
        lastPlayed,
        last30: gamesInLastNDays(dates, 30),
        score: performanceScore(base.games, base.wins, base.trend),
      }
    })

    const ranked = analyzed.filter((d) => d.games >= MIN_GAMES)
    const needsMoreData = analyzed
      .filter((d) => d.games < MIN_GAMES)
      .sort((a, b) => b.games - a.games)

    // Medal assignment always reflects Performance Score, independent of
    // whichever sort is currently on screen — otherwise sorting by "most
    // played" would misleadingly put a medal on a deck that isn't
    // actually the strongest, just the most-used.
    const byScore = [...ranked].sort(SORT_OPTIONS.score)
    const medalByDeckId = {}
    byScore.slice(0, 3).forEach((d, i) => { medalByDeckId[d.deckid] = MEDALS[i] })

    const sorted = [...ranked].sort(SORT_OPTIONS[sort])
    return {
      ranked: sorted.map((d) => ({ ...d, medal: medalByDeckId[d.deckid] })),
      needsMoreData,
    }
  }, [decks, matches, sort])

  if (ranked.length === 0 && needsMoreData.length === 0) {
    return <p className="text-sm text-parchment-faint">No match data yet.</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-sm font-medium text-parchment">{t('analysis.title')}</h3>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-parchment-dim">{t('analysis.sortBy')}</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-ink border border-hairline rounded-md px-3 py-1.5 text-xs text-parchment outline-none focus:border-brass"
          >
            <option value="score">{t('analysis.sortScore')}</option>
            <option value="winrate">{t('analysis.sortWinRate')}</option>
            <option value="games">{t('analysis.sortGames')}</option>
            <option value="trend">{t('analysis.sortTrend')}</option>
            <option value="confidence">{t('analysis.sortConfidence')}</option>
          </select>
        </div>
      </div>

      {ranked.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ranked.map((d) => <DeckCard key={d.deckid} deck={d} t={t} />)}
        </div>
      )}

      {needsMoreData.length > 0 && (
        <div className="mt-4 pt-3 border-t border-hairline border-dashed flex flex-wrap gap-2">
          {needsMoreData.map((d) => (
            <span
              key={d.deckid}
              className="text-xs bg-ink-2 border border-hairline text-parchment-faint px-2.5 py-1.5 rounded-md font-mono"
            >
              {d.deckname} — {t('analysis.needMoreShort', { n: MIN_GAMES - d.games })}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function DeckCard ({ deck: d, t }) {
  const [imgError, setImgError] = useState(false)
  const showImage = d.image_url && !imgError
  const winPct = Math.round(d.winRate * 100)
  const ringOffset = RING_CIRCUMFERENCE * (1 - d.winRate)
  const ringColor = d.winRate >= 0.5 ? 'var(--color-win)' : 'var(--color-loss)'

  return (
    <div className="bg-ink-2 border border-hairline rounded-lg p-4 transition-all duration-150 hover:border-brass-dim hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
      {/* header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-lg bg-surface-raised border border-hairline overflow-hidden flex items-center justify-center flex-shrink-0">
          {showImage ? (
            <img src={d.image_url} alt={d.deckname} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <Layers size={18} className="text-parchment-faint" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {d.medal && <span className="text-sm flex-shrink-0">{d.medal}</span>}
            <p className="text-parchment font-medium truncate">{d.deckname}</p>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <ColorIdentity color={d.color} size={12} />
            {d.lastPlayed && (
              <span className="text-xs text-parchment-faint">
                {t('analysis.lastPlayed', { date: d.lastPlayed })}
              </span>
            )}
          </div>
          {d.last30 > 0 && (
            <p className="text-xs text-parchment-faint font-mono mt-0.5">
              {t('analysis.gamesLast30', { n: d.last30 })}
            </p>
          )}
        </div>
      </div>

      {/* win rate ring + performance score, side by side as the two headline numbers */}
      <div className="flex items-center gap-5 mb-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={RING_RADIUS} fill="none" stroke="var(--color-ink)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r={RING_RADIUS} fill="none"
              stroke={ringColor} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-mono font-semibold ${d.winRate >= 0.5 ? 'text-win' : 'text-loss'}`}>
              {winPct}%
            </span>
            <span className="text-[10px] text-parchment-faint uppercase tracking-wide">{t('analysis.winRate')}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs text-parchment-dim">{t('analysis.performanceScore')}</span>
            <Info size={11} className="text-parchment-faint flex-shrink-0" title={`${t('analysis.performanceScoreHint')} ${t('analysis.derivedFrom')}: ${t('analysis.winRate')}, ${t('analysis.confidence')}, ${t('analysis.games')}, ${t('analysis.trend')}.`} />
          </div>
          <p className="text-2xl font-mono font-semibold text-parchment leading-none mb-1.5">{d.score ?? '—'}</p>
          <div className="w-full h-2 bg-ink rounded-full overflow-hidden">
            <div
              className="h-full bg-brass transition-all duration-300"
              style={{ width: `${d.score ?? 0}%` }}
            />
          </div>
          <p className="text-xs font-mono text-parchment-faint mt-1.5">{d.games} {t('analysis.games').toLowerCase()}</p>
        </div>
      </div>

      {/* confidence */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-parchment-dim">{t('analysis.confidence')}</span>
          <Info size={11} className="text-parchment-faint" title={t('analysis.confidenceHint')} />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`w-1.5 h-3 rounded-sm ${i < Math.max(1, 5 - Math.floor(d.marginPct / 10)) ? CONFIDENCE_COLOR[d.confidence] : 'bg-ink'}`}
              />
            ))}
          </div>
          <span className="text-xs text-parchment-dim">{t(`analysis.${d.confidence}`)}</span>
          <span className="text-xs font-mono text-parchment-faint">±{d.marginPct.toFixed(1)}</span>
        </div>
      </div>

      {/* trend */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-parchment-dim">{t('analysis.trend')}</span>
        <TrendBadge trend={d.trend} t={t} />
      </div>

      {/* recent form */}
      <div className="pt-3 border-t border-hairline">
        <p className="text-xs text-parchment-dim mb-1.5">{t('analysis.recentForm')}</p>
        <RecentForm chronologicalResults={d.chronologicalResults} />
      </div>
    </div>
  )
}

function TrendBadge ({ trend, t }) {
  if (!trend) {
    return <span className="text-xs text-parchment-faint px-2 py-0.5 rounded-full bg-ink-2 border border-hairline">{t('analysis.new')}</span>
  }
  const sign = trend.deltaPct > 0 ? '+' : ''
  if (trend.direction === 'up') {
    return (
      <span className="flex items-center gap-1 text-xs font-mono font-medium text-win bg-win/10 border border-win/30 rounded-full px-2 py-0.5">
        <TrendingUp size={12} />
        {sign}{trend.deltaPct.toFixed(1)}%
      </span>
    )
  }
  if (trend.direction === 'down') {
    return (
      <span className="flex items-center gap-1 text-xs font-mono font-medium text-loss bg-loss/10 border border-loss/30 rounded-full px-2 py-0.5">
        <TrendingDown size={12} />
        {trend.deltaPct.toFixed(1)}%
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs font-mono text-parchment-faint bg-ink-2 border border-hairline rounded-full px-2 py-0.5">
      <Minus size={12} />
      {t('analysis.stable')}
    </span>
  )
}

export default DeckAnalysisCards