import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Layers, User, ArrowRight } from 'lucide-react'
import PeriodPicker from '../components/PeriodPicker'
import ColorIdentity from '../components/ColorIdentity'
import RecentForm from '../components/RecentForm'
import { useDecks } from '../hooks/useDecks'
import { usePlayers } from '../hooks/useUsers'
import { useMatchesDetailed } from '../hooks/useMatches'
import TierDeckCard from '../components/TierDeckCard'
import ComparisonReport from '../components/ComparisonReport'
import { computeDeckStatsInRange, TIER_COLORS, TIER_LEVELS } from '../utils/deckTiers'
import { computePlayerStatsInRange } from '../utils/playerStats'
import { compareDeckPeriods, comparePlayerPeriods, compareTierListPeriods } from '../utils/comparison'
import { generateDeckReport, generatePlayerReport } from '../utils/comparisonReport'
import { daysAgo } from '../utils/dateRanges'
import { useTranslation } from '../i18n/context'

const QUICK_COMPARES = [
  { key: 'last30', days: 30 },
  { key: 'last90', days: 90 },
  { key: 'last180', days: 180 },
  { key: 'last365', days: 365 },
]

function Compare () {
  const { t } = useTranslation()
  const { data: decks = [] } = useDecks()
  const { data: players = [] } = usePlayers()
  const { data: matches = [] } = useMatchesDetailed()

  const [subjectType, setSubjectType] = useState('decks') // 'decks' | 'players' | 'tierlist'

  const tabs = [
    { key: 'decks', label: t('matches.compareDecks') },
    { key: 'players', label: t('matches.comparePlayers') },
    { key: 'tierlist', label: t('matches.compareTierList') },
  ]

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl tracking-wide text-parchment mb-6">{t('matches.compareTitle')}</h1>

      <div className="flex border border-hairline rounded-md overflow-hidden w-fit mb-6">
        {tabs.map((tab, i) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSubjectType(tab.key)}
            className={`px-4 py-2 text-sm transition-colors ${subjectType === tab.key ? 'bg-brass text-ink' : 'text-parchment-dim hover:bg-surface-raised'} ${i !== 0 ? 'border-l border-hairline' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subjectType === 'decks' && <EntityComparison type="deck" items={decks} matches={matches} decks={decks} players={players} />}
      {subjectType === 'players' && <EntityComparison type="player" items={players} matches={matches} decks={decks} players={players} />}
      {subjectType === 'tierlist' && <TierListComparison decks={decks} matches={matches} />}
    </div>
  )
}

function EntityComparison ({ type, items, matches, decks, players }) {
  const { t } = useTranslation()
  const idKey = type === 'deck' ? 'deckid' : 'userid'
  const nameOf = (item) => (type === 'deck' ? item.deckname : `${item.firstname} ${item.lastname}`)

  const [mode, setMode] = useState('time') // 'time' | 'entities'
  const [selectedIds, setSelectedIds] = useState([])
  const [showReport, setShowReport] = useState(false)
  const [periodA, setPeriodA] = useState({ from: daysAgo(180), to: daysAgo(91) })
  const [periodB, setPeriodB] = useState({ from: daysAgo(90), to: daysAgo(0) })
  const [singlePeriod, setSinglePeriod] = useState({ from: '', to: '' })

  function toggleSelect (id) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 4) return prev
      return [...prev, id]
    })
  }

  function applyQuickCompare (days) {
    setPeriodB({ from: daysAgo(days), to: daysAgo(0) })
    setPeriodA({ from: daysAgo(days * 2), to: daysAgo(days + 1) })
  }

  const timeResults = useMemo(() => {
    if (mode !== 'time') return []
    return selectedIds
      .map((id) => items.find((i) => i[idKey] === id))
      .filter(Boolean)
      .map((item) =>
        type === 'deck'
          ? compareDeckPeriods(item, decks, matches, periodA, periodB)
          : comparePlayerPeriods(item, players, matches, decks, periodA, periodB)
      )
  }, [mode, selectedIds, items, idKey, type, matches, decks, players, periodA, periodB])

  const entityResults = useMemo(() => {
    if (mode !== 'entities') return []
    const selectedItems = items.filter((i) => selectedIds.includes(i[idKey]))
    if (selectedItems.length === 0) return []
    return type === 'deck'
      ? computeDeckStatsInRange(selectedItems, matches, { from: singlePeriod.from, to: singlePeriod.to })
      : computePlayerStatsInRange(selectedItems, matches, decks, { from: singlePeriod.from, to: singlePeriod.to })
  }, [mode, selectedIds, items, idKey, type, matches, decks, singlePeriod])

  const report = useMemo(() => {
    if (mode !== 'entities' || selectedIds.length !== 2) return null
    const [item1, item2] = selectedIds.map((id) => items.find((i) => i[idKey] === id))
    if (!item1 || !item2) return null
    const period = { ...singlePeriod }
    return type === 'deck'
      ? generateDeckReport(item1, item2, decks, matches, period, null, {}, t)
      : generatePlayerReport(item1, item2, players, decks, matches, period, null, t)
  }, [mode, selectedIds, items, idKey, type, decks, players, matches, singlePeriod, t])

  const inputClass = 'bg-ink border border-hairline rounded-md px-3 py-2 text-sm text-parchment outline-none focus:border-brass'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex border border-hairline rounded-md overflow-hidden w-fit">
        <button
          type="button"
          onClick={() => setMode('time')}
          className={`px-4 py-2 text-sm transition-colors ${mode === 'time' ? 'bg-brass text-ink' : 'text-parchment-dim hover:bg-surface-raised'}`}
        >
          {t('matches.compareVsPast')}
        </button>
        <button
          type="button"
          onClick={() => setMode('entities')}
          className={`px-4 py-2 text-sm transition-colors border-l border-hairline ${mode === 'entities' ? 'bg-brass text-ink' : 'text-parchment-dim hover:bg-surface-raised'}`}
        >
          {t('matches.compareVsEach')}
        </button>
      </div>

      <div className="bg-surface border border-hairline rounded-lg p-4">
        <p className="text-xs text-parchment-dim mb-2">{t('matches.compareSelectEntities')}</p>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const id = item[idKey]
            const selected = selectedIds.includes(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleSelect(id)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
                  selected ? 'border-brass text-brass bg-brass/10' : 'border-hairline text-parchment-dim hover:bg-surface-raised'
                }`}
              >
                {type === 'deck' ? <Layers size={11} /> : <User size={11} />}
                {nameOf(item)}
              </button>
            )
          })}
        </div>
      </div>

      {mode === 'time' ? (
        <>
          <div className="bg-surface border border-hairline rounded-lg p-4 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {QUICK_COMPARES.map((q) => (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => applyQuickCompare(q.days)}
                  className="text-xs px-3 py-1.5 rounded-md border border-hairline text-parchment-dim hover:bg-surface-raised hover:border-brass-dim transition-colors"
                >
                  {t(`matches.compareQuick${q.days}`)}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <PeriodPicker label={t('matches.comparePeriodA')} from={periodA.from} to={periodA.to} onChange={setPeriodA} />
              <PeriodPicker label={t('matches.comparePeriodB')} from={periodB.from} to={periodB.to} onChange={setPeriodB} />
            </div>
          </div>

          {timeResults.length === 0 ? (
            <p className="text-sm text-parchment-faint">{t('matches.compareSelectOne')}</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {timeResults.map((r) => (
                <TimeComparisonCard key={(r.deck || r.player)[idKey]} result={r} type={type} nameOf={nameOf} t={t} />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="bg-surface border border-hairline rounded-lg p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-parchment-dim">{t('common.from')}</label>
                  <input type="date" value={singlePeriod.from} onChange={(e) => setSinglePeriod({ ...singlePeriod, from: e.target.value })} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-parchment-dim">{t('common.to')}</label>
                  <input type="date" value={singlePeriod.to} onChange={(e) => setSinglePeriod({ ...singlePeriod, to: e.target.value })} className={inputClass} />
                </div>
              </div>
              {selectedIds.length === 2 && (
                <button
                  type="button"
                  onClick={() => setShowReport(!showReport)}
                  className={`text-xs px-3 py-2 rounded-md border transition-colors ${
                    showReport ? 'border-brass text-brass bg-brass/10' : 'border-hairline text-parchment-dim hover:bg-surface-raised'
                  }`}
                >
                  {showReport ? t('matches.reportBack') : t('matches.reportView')}
                </button>
              )}
            </div>
          </div>

          {showReport && report ? (
            <ComparisonReport report={report} name1={nameOf(items.find((i) => i[idKey] === selectedIds[0]))} name2={nameOf(items.find((i) => i[idKey] === selectedIds[1]))} />
          ) : entityResults.length === 0 ? (
            <p className="text-sm text-parchment-faint">{t('matches.compareSelectEntities')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entityResults.map((r) => (
                <EntityStatCard key={r[idKey]} item={r} type={type} nameOf={nameOf} t={t} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * The expanded per-entity comparison card: win rate, usage (relative to
 * the busiest entity in that same period), within-period trend, a
 * recent-form dot row per period (the closest thing to a 'progression
 * shape' without needing a full chart), and — for decks only — where it
 * sat on the tier list in each period.
 */
function TimeComparisonCard ({ result, type, nameOf, t }) {
  const item = type === 'deck' ? result.deck : result.player
  return (
    <div className="bg-ink-2 border border-hairline rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        {type === 'deck' ? <Layers size={14} className="text-parchment-faint" /> : <User size={14} className="text-parchment-faint" />}
        <p className="text-parchment font-medium truncate">{nameOf(item)}</p>
        {type === 'deck' && <ColorIdentity color={item.color} size={12} />}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <PeriodColumn label={result.a.label || result.a.from} stats={result.a} t={t} />
        <PeriodColumn label={result.b.label || result.b.from} stats={result.b} t={t} />
      </div>

      <div className="grid grid-cols-2 gap-4 pb-3 border-b border-hairline">
        <div className="min-w-0">
          <RecentForm chronologicalResults={result.a.chronological} size="sm" />
        </div>
        <div className="min-w-0">
          <RecentForm chronologicalResults={result.b.chronological} size="sm" />
        </div>
      </div>

      <div className="pt-3 flex flex-col gap-2">
        <MetricDeltaRow label={t('matches.compareWinRate')} delta={result.winRateDelta} suffix="%" scale={100} />
        <MetricDeltaRow label={t('matches.compareGames')} delta={result.gamesDelta} />
        <MetricDeltaRow
          label={t('matches.compareUsage')}
          delta={deltaOf(result.a.usageShare, result.b.usageShare)}
          suffix="%"
          scale={100}
        />
        {type === 'deck' && (result.tierA || result.tierB) && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-parchment-dim">{t('matches.compareTier')}</span>
            <div className="flex items-center gap-2">
              <TierPill tier={result.tierA} t={t} />
              <ArrowRight size={12} className="text-parchment-faint" />
              <TierPill tier={result.tierB} t={t} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PeriodColumn ({ label, stats, t }) {
  return (
    <div className="text-center">
      <p className="text-xs text-parchment-faint mb-1 truncate">{label}</p>
      <p className={`text-xl font-mono font-medium ${stats.winRate == null ? 'text-parchment-faint' : stats.winRate >= 0.5 ? 'text-win' : 'text-loss'}`}>
        {stats.winRate != null ? `${Math.round(stats.winRate * 100)}%` : '—'}
      </p>
      <p className="text-xs font-mono text-parchment-faint">{stats.matches} {t('matches.compareGames')}</p>
      <TrendChip trend={stats.trend} t={t} />
    </div>
  )
}

function TrendChip ({ trend, t }) {
  if (!trend) return null
  const Icon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus
  const color = trend.direction === 'up' ? 'text-win' : trend.direction === 'down' ? 'text-loss' : 'text-parchment-faint'
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-mono mt-0.5 ${color}`} title={t('analysis.trendHint')}>
      <Icon size={9} />
      {trend.direction === 'stable' ? t('analysis.stable') : `${trend.deltaPct > 0 ? '+' : ''}${trend.deltaPct.toFixed(0)}%`}
    </span>
  )
}

function MetricDeltaRow ({ label, delta, suffix = '', scale = 1 }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-parchment-dim">{label}</span>
      <DeltaBadge delta={delta} suffix={suffix} scale={scale} />
    </div>
  )
}

function EntityStatCard ({ item, type, nameOf, t }) {
  return (
    <div className="bg-ink-2 border border-hairline rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {type === 'deck' ? <Layers size={14} className="text-parchment-faint" /> : <User size={14} className="text-parchment-faint" />}
        <p className="text-parchment font-medium truncate">{nameOf(item)}</p>
        {type === 'deck' && <ColorIdentity color={item.color} size={12} />}
      </div>
      <p className={`text-2xl font-mono font-medium ${item.winRate == null ? 'text-parchment-faint' : item.winRate >= 0.5 ? 'text-win' : 'text-loss'}`}>
        {item.winRate != null ? `${Math.round(item.winRate * 100)}%` : '—'}
      </p>
      <p className="text-xs font-mono text-parchment-faint">{item.matches} {t('matches.compareGames')}</p>
    </div>
  )
}

function DeltaBadge ({ delta, suffix = '', scale = 1 }) {
  if (delta == null) return <span className="text-xs text-parchment-faint">—</span>
  const scaled = delta * scale
  const sign = scaled > 0 ? '+' : ''
  if (Math.abs(scaled) < 0.5) {
    return (
      <span className="flex items-center gap-1 text-xs font-mono text-parchment-faint">
        <Minus size={12} /> {sign}{scaled.toFixed(1)}{suffix}
      </span>
    )
  }
  if (scaled > 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-mono font-medium text-win">
        <TrendingUp size={12} /> {sign}{scaled.toFixed(1)}{suffix}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs font-mono font-medium text-loss">
      <TrendingDown size={12} /> {scaled.toFixed(1)}{suffix}
    </span>
  )
}

function deltaOf (a, b) {
  if (a == null || b == null) return null
  return b - a
}

/**
 * A single tier list — organized by the deck's CURRENT (period B)
 * placement, same row structure as the standalone Tier List page — with
 * each deck shown as a card (not the compact chip) carrying a small
 * green up-arrow or red down-arrow baked into its thumbnail showing
 * where it moved from. This reads as "here's the tier list, annotated
 * with what changed" rather than two separate tier lists side by side.
 */
function TierListComparison ({ decks, matches }) {
  const { t } = useTranslation()
  const [periodA, setPeriodA] = useState({ from: daysAgo(180), to: daysAgo(91) })
  const [periodB, setPeriodB] = useState({ from: daysAgo(90), to: daysAgo(0) })

  function applyQuickCompare (days) {
    setPeriodB({ from: daysAgo(days), to: daysAgo(0) })
    setPeriodA({ from: daysAgo(days * 2), to: daysAgo(days + 1) })
  }

  const results = useMemo(
    () => compareTierListPeriods(decks, matches, periodA, periodB, { minGames: 3 }),
    [decks, matches, periodA, periodB]
  )

  const { byTier, unranked } = useMemo(() => {
    const byTier = {}
    for (const tier of TIER_LEVELS) byTier[tier] = []
    const unranked = []
    for (const r of results) {
      if (r.tierB) byTier[r.tierB].push(r)
      else unranked.push(r)
    }
    return { byTier, unranked }
  }, [results])

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-surface border border-hairline rounded-lg p-4 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {QUICK_COMPARES.map((q) => (
            <button
              key={q.key}
              type="button"
              onClick={() => applyQuickCompare(q.days)}
              className="text-xs px-3 py-1.5 rounded-md border border-hairline text-parchment-dim hover:bg-surface-raised hover:border-brass-dim transition-colors"
            >
              {t(`matches.compareQuick${q.days}`)}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <PeriodPicker label={t('matches.comparePeriodA')} from={periodA.from} to={periodA.to} onChange={setPeriodA} />
          <PeriodPicker label={t('matches.comparePeriodB')} from={periodB.from} to={periodB.to} onChange={setPeriodB} />
        </div>
      </div>

      {results.length === 0 ? (
        <p className="text-sm text-parchment-faint">{t('matches.compareNoTierData')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {TIER_LEVELS.map((tier) => (
            <ComparisonTierRow key={tier} tier={tier} entries={byTier[tier]} t={t} />
          ))}

          {unranked.length > 0 && (
            <div className="flex border border-hairline border-dashed rounded-lg overflow-hidden mt-2">
              <div className="w-20 flex-shrink-0 flex items-center justify-center bg-ink-2">
                <span className="text-sm font-display tracking-wide text-parchment-faint">—</span>
              </div>
              <div className="flex-1 bg-surface p-3 flex flex-wrap gap-2 items-start">
                {unranked.map((r) => (
                  <TierDeckCard
                    key={r.deck.deckid}
                    deck={{ ...r.deck, winRate: r.winRateB }}
                    metric="winrate"
                    movement={r.movement}
                    muted
                  />
                ))}
                <span className="text-xs text-parchment-faint mt-1.5">{t('tierlist.unranked')}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ComparisonTierRow ({ tier, entries, t }) {
  const empty = entries.length === 0
  return (
    <div className="flex border border-hairline rounded-lg overflow-hidden">
      <div
        className="w-20 flex-shrink-0 flex items-center justify-center"
        style={{ background: TIER_COLORS[tier] }}
      >
        <span className="text-lg font-display tracking-wide text-ink">{tier}</span>
      </div>
      <div className={`flex-1 p-3 flex flex-wrap gap-2 items-start ${empty ? 'bg-ink-2' : 'bg-surface'}`}>
        {empty ? (
          <span className="text-xs text-parchment-faint">{t('tierlist.noDecks')}</span>
        ) : (
          entries.map((r) => (
            <TierDeckCard
              key={r.deck.deckid}
              deck={{ ...r.deck, winRate: r.winRateB }}
              metric="winrate"
              movement={r.movement}
            />
          ))
        )}
      </div>
    </div>
  )
}

function TierPill ({ tier, t }) {
  if (!tier) {
    return <span className="text-xs text-parchment-faint bg-ink px-2 py-1 rounded-md w-12 text-center">{t('matches.compareUnranked').slice(0, 3)}</span>
  }
  return (
    <span
      className="text-xs font-display px-2 py-1 rounded-md w-12 text-center text-ink"
      style={{ background: TIER_COLORS[tier] }}
    >
      {tier}
    </span>
  )
}

export default Compare