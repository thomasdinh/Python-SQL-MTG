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
  1: '#639922',
  2: '#5dcaa5',
  3: '#ef9f27',
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
    return <p className="text-sm text-gray-400">No match data yet.</p>
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Placement distribution</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="placement" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => [value, 'Times']} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={PLACEMENT_COLORS[entry.raw] || '#888780'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PlacementChart