/**
 * A single stat readout: label + big number, in the mono face for that
 * "scorepad" feel. `tone` optionally colors the number (win/loss/brass).
 */
function StatCard ({ label, value, tone }) {
  const toneClass =
    tone === 'win'
      ? 'text-win'
      : tone === 'loss'
      ? 'text-loss'
      : tone === 'brass'
      ? 'text-brass'
      : 'text-parchment'

  return (
    <div className="bg-surface border border-hairline rounded-lg p-4">
      <p className="text-xs text-parchment-dim mb-1 tracking-wide uppercase">{label}</p>
      <p className={`text-2xl font-mono font-medium ${toneClass}`}>{value}</p>
    </div>
  )
}

export default StatCard
