import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Dot,
} from 'recharts'
import { filterSubjectMatches, computeWinRateProgression } from '../utils/winRateProgression'
import { useTranslation } from '../i18n/context'

function CustomDot (props) {
  const { cx, cy, payload } = props
  const color = payload.won === 1 ? '#7ba05b' : '#b5493a'
  return <Dot cx={cx} cy={cy} r={3.5} fill={color} stroke="none" />
}

/**
 * @param matches   full /matches/detail list (already fetched by the page)
 * @param players   full player list, for the opponent filter
 * @param decks     full deck list, for the opponent filter
 * @param subjectType 'deck' | 'player'
 * @param subjectId   deckid or userid this progression is for
 */
function WinRateProgressionChart ({ matches, players, decks, subjectType, subjectId }) {
  const { t } = useTranslation()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [groupId, setGroupId] = useState(null)
  const [opponentPlayerId, setOpponentPlayerId] = useState(null)
  const [opponentDeckId, setOpponentDeckId] = useState(null)
  const [excludeMatchIds, setExcludeMatchIds] = useState([])
  const [mode, setMode] = useState('cumulative')
  const [windowSize, setWindowSize] = useState(5)
  const [showFilters, setShowFilters] = useState(false)

  // matches involving the subject, after date/group/opponent filters — this
  // is also what populates the "exclude specific matches" checklist below,
  // so that list only ever shows matches actually eligible to plot
  const candidateMatches = useMemo(
    () => filterSubjectMatches(matches, { subjectType, subjectId, from, to, groupId, opponentPlayerId, opponentDeckId }),
    [matches, subjectType, subjectId, from, to, groupId, opponentPlayerId, opponentDeckId]
  )

  const points = useMemo(
    () => computeWinRateProgression(candidateMatches, { subjectType, subjectId, excludeMatchIds, mode, windowSize }),
    [candidateMatches, subjectType, subjectId, excludeMatchIds, mode, windowSize]
  )

  // playgroups (group_id) that actually appear in this subject's full match
  // history — computed before the groupId filter so the dropdown always
  // shows every option, not just the currently-selected one
  const availableGroups = useMemo(() => {
    const all = filterSubjectMatches(matches, { subjectType, subjectId })
    return [...new Set(all.map((m) => m.group_id).filter((g) => g != null))].sort((a, b) => a - b)
  }, [matches, subjectType, subjectId])

  function toggleExcluded (matchId) {
    setExcludeMatchIds((prev) =>
      prev.includes(matchId) ? prev.filter((id) => id !== matchId) : [...prev, matchId]
    )
  }

  function clearFilters () {
    setFrom('')
    setTo('')
    setGroupId(null)
    setOpponentPlayerId(null)
    setOpponentDeckId(null)
    setExcludeMatchIds([])
  }

  const active = from || to || groupId != null || opponentPlayerId || opponentDeckId || excludeMatchIds.length > 0
  const inputClass = 'bg-ink border border-hairline rounded-md px-3 py-2 text-sm text-parchment outline-none focus:border-brass'
  const wins = points.filter((p) => p.won === 1).length

  return (
    <div className="bg-surface border border-hairline rounded-lg p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-parchment">{t('progression.title')}</h3>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="text-xs text-parchment-dim hover:text-brass transition-colors"
        >
          {showFilters ? t('progression.hideFilters') : t('progression.filters')}{active ? ' •' : ''}
        </button>
      </div>
      <p className="text-xs text-parchment-faint font-mono mb-4">
        {points.length > 0
          ? mode === 'rolling'
            ? `${points.length} games · ${t('progression.lastNGames', { n: Math.min(windowSize, points.length) })}: ${points[points.length - 1].winRate}%`
            : `${wins}/${points.length} games (${points[points.length - 1].winRate}%)`
          : t('progression.noGamesRange')}
      </p>

      {showFilters && (
        <div className="bg-ink-2 border border-hairline rounded-lg p-4 mb-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-parchment-dim">{t('common.from')}</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-parchment-dim">{t('common.to')}</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-parchment-dim">{t('tierlist.playgroup')}</label>
              <select
                value={groupId ?? ''}
                onChange={(e) => setGroupId(e.target.value ? parseInt(e.target.value) : null)}
                className={inputClass}
              >
                <option value="">{t('common.anyGroup')}</option>
                {availableGroups.map((g) => (
                  <option key={g} value={g}>Group {g}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-parchment-dim">{t('progression.vsPlayer')}</label>
              <select
                value={opponentPlayerId ?? ''}
                onChange={(e) => setOpponentPlayerId(e.target.value ? parseInt(e.target.value) : null)}
                className={inputClass}
              >
                <option value="">{t('common.anyPlayer')}</option>
                {players.map((p) => (
                  <option key={p.userid} value={p.userid}>{p.firstname} {p.lastname}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-parchment-dim">{t('progression.vsDeck')}</label>
              <select
                value={opponentDeckId ?? ''}
                onChange={(e) => setOpponentDeckId(e.target.value ? parseInt(e.target.value) : null)}
                className={inputClass}
              >
                <option value="">{t('common.anyDeck')}</option>
                {decks.filter((d) => !(subjectType === 'deck' && d.deckid === subjectId)).map((d) => (
                  <option key={d.deckid} value={d.deckid}>{d.deckname}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-parchment-dim">{t('progression.mode')}</label>
              <div className="flex border border-hairline rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMode('cumulative')}
                  className={`px-3 py-2 text-sm transition-colors ${mode === 'cumulative' ? 'bg-brass text-ink' : 'text-parchment-dim hover:bg-surface-raised'}`}
                >
                  {t('progression.cumulative')}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('rolling')}
                  className={`px-3 py-2 text-sm transition-colors border-l border-hairline ${mode === 'rolling' ? 'bg-brass text-ink' : 'text-parchment-dim hover:bg-surface-raised'}`}
                >
                  {t('progression.rolling')}
                </button>
              </div>
            </div>
            {mode === 'rolling' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-parchment-dim">{t('progression.window')}</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={windowSize}
                  onChange={(e) => setWindowSize(Math.max(2, parseInt(e.target.value) || 2))}
                  className={`${inputClass} w-20`}
                />
              </div>
            )}
            {active && (
              <button type="button" onClick={clearFilters} className="text-xs text-parchment-faint hover:text-brass transition-colors mb-2">
                {t('common.clearFilters')}
              </button>
            )}
          </div>

          {candidateMatches.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-parchment-dim">{t('progression.excludeMatches')}</label>
              <div className="max-h-32 overflow-y-auto flex flex-col gap-0.5 bg-ink border border-hairline rounded-md p-2">
                {candidateMatches
                  .slice()
                  .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                  .map((m) => {
                    const opponents = m.players
                      .filter((p) => (subjectType === 'deck' ? p.deck_id !== subjectId : p.owner_id !== subjectId))
                      .map((p) => p.deck_name)
                      .join(', ')
                    const excluded = excludeMatchIds.includes(m.match_id)
                    return (
                      <label key={m.match_id} className="flex items-center gap-2 text-xs px-1.5 py-1 rounded hover:bg-surface-raised cursor-pointer">
                        <input
                          type="checkbox"
                          checked={excluded}
                          onChange={() => toggleExcluded(m.match_id)}
                          className="accent-brass"
                        />
                        <span className={excluded ? 'text-parchment-faint line-through' : 'text-parchment-dim'}>
                          #{m.match_id} · {m.date ? m.date.slice(0, 10) : '—'} · vs {opponents || '—'}
                        </span>
                      </label>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {points.length === 0 ? (
        <p className="text-sm text-parchment-faint">{t('progression.noGamesFilters')}</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#33393b" />
            <XAxis
              dataKey="game"
              tickFormatter={(v) => `#${v}`}
              tick={{ fontSize: 12, fill: '#9ca39f' }}
              axisLine={{ stroke: '#33393b' }}
              tickLine={{ stroke: '#33393b' }}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 12, fill: '#9ca39f' }}
              axisLine={{ stroke: '#33393b' }}
              tickLine={{ stroke: '#33393b' }}
            />
            <ReferenceLine y={50} stroke="#40474a" strokeDasharray="4 4" />
            <Tooltip
              contentStyle={{ background: '#1d2224', border: '1px solid #33393b', borderRadius: 6, fontSize: 12 }}
              labelStyle={{ color: '#ede6d6' }}
              itemStyle={{ color: '#ede6d6' }}
              formatter={(value) => [`${value}%`, mode === 'rolling' ? t('progression.lastNGames', { n: windowSize }) : t('stat.winRate')]}
              labelFormatter={(game, payload) => {
                const p = payload?.[0]?.payload
                if (!p) return t('progression.gameNum', { n: game })
                return `${t('progression.gameNum', { n: game })} · ${p.date ? p.date.slice(0, 10) : '—'} · ${p.won ? t('progression.won') : t('progression.lost')}`
              }}
            />
            <Line
              type="monotone"
              dataKey="winRate"
              stroke="#c9a227"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 5, fill: '#c9a227' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default WinRateProgressionChart
