import { useMemo, useState } from 'react'
import ColorIdentity from '../components/ColorIdentity'
import { useDecks } from '../hooks/useDecks'
import { useMatchesDetailed } from '../hooks/useMatches'
import { computeDeckStatsInRange, assignTiers, TIER_LEVELS, TIER_COLORS } from '../utils/deckTiers'
import { useTranslation } from '../i18n/context'

function daysAgo (n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function TierList () {
  const { t } = useTranslation()
  const { data: decks = [], isLoading: decksLoading } = useDecks()
  const { data: matches = [], isLoading: matchesLoading } = useMatchesDetailed()

  const PRESETS = {
    all: { label: t('tierlist.allTime'), days: null },
    last30: { label: t('tierlist.last30'), days: 30 },
    last90: { label: t('tierlist.last90'), days: 90 },
    last180: { label: t('tierlist.last180'), days: 180 },
    last365: { label: t('tierlist.last365'), days: 365 },
    custom: { label: t('tierlist.custom'), days: undefined },
  }

  const [preset, setPreset] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [groupId, setGroupId] = useState(null) // null = overall
  const [metric, setMetric] = useState('winrate') // 'winrate' | 'usage'
  const [minGames, setMinGames] = useState(3)

  function applyPreset (key) {
    setPreset(key)
    const days = PRESETS[key].days
    if (days == null) {
      // "All time" and "Custom" both just clear the auto-computed bounds —
      // for custom the person types their own from/to below.
      if (key === 'all') { setFrom(''); setTo('') }
      return
    }
    setTo(daysAgo(0))
    setFrom(daysAgo(days))
  }

  const availableGroups = useMemo(
    () => [...new Set(matches.map((m) => m.group_id).filter((g) => g != null))].sort((a, b) => a - b),
    [matches]
  )

  const deckStats = useMemo(
    () => computeDeckStatsInRange(decks, matches, { from, to, groupId }),
    [decks, matches, from, to, groupId]
  )

  const { byTier, unranked } = useMemo(
    () => assignTiers(deckStats, { metric, minGames }),
    [deckStats, metric, minGames]
  )

  const loading = decksLoading || matchesLoading
  const inputClass = 'bg-ink border border-hairline rounded-md px-3 py-2 text-sm text-parchment outline-none focus:border-brass'

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl tracking-wide text-parchment mb-6">{t('tierlist.title')}</h1>

      <div className="bg-surface border border-hairline rounded-lg p-4 mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-parchment-dim">{t('tierlist.timespan')}</label>
            <select value={preset} onChange={(e) => applyPreset(e.target.value)} className={inputClass}>
              {Object.entries(PRESETS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-parchment-dim">{t('common.from')}</label>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPreset('custom') }}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-parchment-dim">{t('common.to')}</label>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPreset('custom') }}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-parchment-dim">{t('tierlist.playgroup')}</label>
            <select
              value={groupId ?? ''}
              onChange={(e) => setGroupId(e.target.value ? parseInt(e.target.value) : null)}
              className={inputClass}
            >
              <option value="">{t('tierlist.overall')}</option>
              {availableGroups.map((g) => (
                <option key={g} value={g}>Group {g}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-parchment-dim">{t('tierlist.minGames')}</label>
            <input
              type="number"
              min="1"
              value={minGames}
              onChange={(e) => setMinGames(Math.max(1, parseInt(e.target.value) || 1))}
              className={`${inputClass} w-28`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-parchment-dim">{t('tierlist.rankBy')}</label>
          <div className="flex border border-hairline rounded-md overflow-hidden w-fit">
            <button
              type="button"
              onClick={() => setMetric('winrate')}
              className={`px-4 py-2 text-sm transition-colors ${metric === 'winrate' ? 'bg-brass text-ink' : 'text-parchment-dim hover:bg-surface-raised'}`}
            >
              {t('tierlist.winRateMode')}
            </button>
            <button
              type="button"
              onClick={() => setMetric('usage')}
              className={`px-4 py-2 text-sm transition-colors border-l border-hairline ${metric === 'usage' ? 'bg-brass text-ink' : 'text-parchment-dim hover:bg-surface-raised'}`}
            >
              {t('tierlist.usageMode')}
            </button>
          </div>
          <p className="text-xs text-parchment-faint mt-1">
            {metric === 'winrate'
              ? 'Tiered by win rate. Decks below the games threshold are unranked, not F-tier, so a lucky 1-0 doesn\u2019t read as elite.'
              : 'Tiered by matches played, relative to the most-played deck in this range.'}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-parchment-faint">{t('common.loadingDecks')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {TIER_LEVELS.map((tier) => (
            <TierRow key={tier} tier={tier} decks={byTier[tier]} metric={metric} />
          ))}

          {unranked.length > 0 && (
            <div className="flex border border-hairline border-dashed rounded-lg overflow-hidden mt-4">
              <div className="w-20 flex-shrink-0 flex items-center justify-center bg-ink-2">
                <span className="text-sm font-display tracking-wide text-parchment-faint">—</span>
              </div>
              <div className="flex-1 bg-surface p-3 flex flex-wrap gap-2 items-center">
                <span className="text-xs text-parchment-faint mr-1">
                  {t('tierlist.unranked')} ({'<'} {minGames} game{minGames === 1 ? '' : 's'}):
                </span>
                {unranked.map((d) => (
                  <DeckChip key={d.deckid} deck={d} metric={metric} muted />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TierRow ({ tier, decks, metric }) {
  const { t } = useTranslation()
  const empty = decks.length === 0
  return (
    <div className="flex border border-hairline rounded-lg overflow-hidden">
      <div
        className="w-20 flex-shrink-0 flex items-center justify-center"
        style={{ background: TIER_COLORS[tier] }}
      >
        <span className="text-lg font-display tracking-wide text-ink">{tier}</span>
      </div>
      <div className={`flex-1 p-3 flex flex-wrap gap-2 items-center ${empty ? 'bg-ink-2' : 'bg-surface'}`}>
        {empty ? (
          <span className="text-xs text-parchment-faint">{t('tierlist.noDecks')}</span>
        ) : (
          decks.map((d) => <DeckChip key={d.deckid} deck={d} metric={metric} />)
        )}
      </div>
    </div>
  )
}

function DeckChip ({ deck, metric, muted = false }) {
  const statLabel = metric === 'winrate'
    ? (deck.winRate != null ? `${Math.round(deck.winRate * 100)}%` : '—')
    : `${deck.matches}g`

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm ${muted ? 'bg-ink text-parchment-faint' : 'bg-ink-2 text-parchment'}`}>
      <ColorIdentity color={deck.color} size={13} />
      {deck.deckname}
      <span className="text-xs font-mono text-parchment-faint">
        {statLabel} · {deck.wins}/{deck.matches}
      </span>
    </span>
  )
}

export default TierList
