import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import { useTranslation } from '../i18n/context'

/** Linear interpolation between two hex colors, t in [0, 1]. */
function interpolateHex (hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16)
  const b = parseInt(hexB.slice(1), 16)
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bch = Math.round(ab + (bb - ab) * t)
  return `#${[r, g, bch].map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

// Best placement is brass (matches SSS tier / premium accent elsewhere in
// the app), worst is the same loss-red used for stat cards — every
// placement in between is interpolated, so this scales cleanly whether
// the pod is 3-player or 6-player instead of degrading to flat gray past
// 3rd place like a fixed 3-color map would.
function placementColor (placement, maxPlacement) {
  if (maxPlacement <= 1) return '#c9a227'
  const t = (placement - 1) / (maxPlacement - 1)
  return interpolateHex('#c9a227', '#b5493a', t)
}

function PlacementChart ({ matchPlayers }) {
  const { t } = useTranslation()

  const counts = {}
  matchPlayers.forEach((mp) => {
    counts[mp.placement] = (counts[mp.placement] || 0) + 1
  })

  const totalGames = matchPlayers.length
  const placements = Object.keys(counts).map(Number).sort((a, b) => a - b)
  const maxPlacement = placements.length > 0 ? Math.max(...placements) : 0

  const data = placements.map((placement) => ({
    placement: `#${placement}`,
    count: counts[placement],
    pct: Math.round((counts[placement] / totalGames) * 100),
    raw: placement,
  }))

  if (data.length === 0) {
    return <p className="text-sm text-parchment-faint">No match data yet.</p>
  }

  const avgPlacement = (
    matchPlayers.reduce((sum, mp) => sum + mp.placement, 0) / totalGames
  ).toFixed(1)
  const mostCommon = data.reduce((best, d) => (d.count > best.count ? d : best), data[0])

  return (
    <div className="bg-surface border border-hairline rounded-lg p-5">
      <h3 className="text-sm font-medium text-parchment mb-1">{t('placement.title')}</h3>
      <p className="text-xs text-parchment-faint font-mono mb-4">
        {t('placement.summary', {
          games: totalGames,
          avg: avgPlacement,
          common: mostCommon.raw,
          pct: mostCommon.pct,
        })}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 20, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33393b" />
          <XAxis
            dataKey="placement"
            tick={{ fontSize: 12, fill: '#ede6d6' }}
            axisLine={{ stroke: '#33393b' }}
            tickLine={{ stroke: '#33393b' }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: '#9ca39f' }}
            axisLine={{ stroke: '#33393b' }}
            tickLine={{ stroke: '#33393b' }}
          />
          <Tooltip
            contentStyle={{ background: '#1d2224', border: '1px solid #33393b', borderRadius: 6, fontSize: 12 }}
            labelStyle={{ color: '#ede6d6' }}
            itemStyle={{ color: '#ede6d6' }}
            cursor={{ fill: 'rgba(201,162,39,0.06)' }}
            formatter={(value, name, props) => [`${value} ${t('placement.times')} (${props.payload.pct}%)`, '']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="pct"
              position="top"
              formatter={(v) => `${v}%`}
              style={{ fill: '#9ca39f', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
            />
            {data.map((entry) => (
              <Cell key={entry.raw} fill={placementColor(entry.raw, maxPlacement)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PlacementChart