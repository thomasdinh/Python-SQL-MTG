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

function WinRateChart({ decks, matchPlayers }) {
  const data = decks
    .map((deck) => {
      const deckMatches = matchPlayers.filter((mp) => mp.deck_id === deck.deckid)
      const wins = deckMatches.filter((mp) => mp.won === 1).length
      const total = deckMatches.length
      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
      return {
        name: deck.deckname,
        winRate,
        wins,
        total,
      }
    })
    .filter((d) => d.total > 0)
    .sort((a, b) => b.winRate - a.winRate)

  if (data.length === 0) {
    return <p className="text-sm text-gray-400">No match data yet.</p>
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Win rate by deck</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 32 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value, name, props) => [
              `${value}% (${props.payload.wins}/${props.payload.total})`,
              'Win rate'
            ]}
          />
          <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.winRate >= 50 ? '#639922' : '#e24b4a'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default WinRateChart