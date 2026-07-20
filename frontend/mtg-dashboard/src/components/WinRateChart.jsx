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
    return <p className="text-sm text-parchment-faint">No match data yet.</p>
  }

  return (
    <div className="bg-surface border border-hairline rounded-lg p-5">
      <h3 className="text-sm font-medium text-parchment mb-4">Win rate by deck</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 32 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#33393b" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 12, fill: '#9ca39f' }}
            axisLine={{ stroke: '#33393b' }}
            tickLine={{ stroke: '#33393b' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 12, fill: '#ede6d6' }}
            axisLine={{ stroke: '#33393b' }}
            tickLine={{ stroke: '#33393b' }}
          />
          <Tooltip
            contentStyle={{ background: '#1d2224', border: '1px solid #33393b', borderRadius: 6, fontSize: 12 }}
            labelStyle={{ color: '#ede6d6' }}
            itemStyle={{ color: '#ede6d6' }}
            cursor={{ fill: 'rgba(201,162,39,0.06)' }}
            formatter={(value, name, props) => [
              `${value}% (${props.payload.wins}/${props.payload.total})`,
              'Win rate'
            ]}
          />
          <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.winRate >= 50 ? '#7ba05b' : '#b5493a'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default WinRateChart
