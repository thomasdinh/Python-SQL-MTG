import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

const PLACEMENT_COLORS = {
  1: '#c9a227',
  2: '#7ba05b',
  3: '#4a8ab5',
}

function PlacementChart({ matchPlayers }) {
  const counts = {}
  matchPlayers.forEach((mp) => {
    counts[mp.placement] = (counts[mp.placement] || 0) + 1
  })

  const data = Object.keys(counts)
    .map(Number)
    .sort((a, b) => a - b)
    .map((placement) => ({
      placement: `#${placement}`,
      count: counts[placement],
      raw: placement,
    }))

  if (data.length === 0) {
    return <p className="text-sm text-parchment-faint">No match data yet.</p>
  }

  return (
    <div className="bg-surface border border-hairline rounded-lg p-5">
      <h3 className="text-sm font-medium text-parchment mb-4">Placement distribution</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33393b" />
          <XAxis dataKey="placement" tick={{ fontSize: 12, fill: '#ede6d6' }} axisLine={{ stroke: '#33393b' }} tickLine={{ stroke: '#33393b' }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca39f' }} axisLine={{ stroke: '#33393b' }} tickLine={{ stroke: '#33393b' }} />
          <Tooltip
            contentStyle={{ background: '#1d2224', border: '1px solid #33393b', borderRadius: 6, fontSize: 12 }}
            labelStyle={{ color: '#ede6d6' }}
            itemStyle={{ color: '#ede6d6' }}
            cursor={{ fill: 'rgba(201,162,39,0.06)' }}
            formatter={(value) => [value, 'Times']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={PLACEMENT_COLORS[entry.raw] || '#86837c'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PlacementChart
