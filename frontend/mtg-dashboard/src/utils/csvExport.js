/**
 * Converts the /matches/detail list into a flat CSV: one row per
 * (match, player) pair, since a match can have anywhere from 2 to N
 * players and CSV doesn't do nested structures.
 */
export function matchesToCsv (matches) {
  const header = ['match_id', 'date', 'group_id', 'deck_name', 'placement', 'won', 'comment']
  const rows = [header.join(',')]

  for (const m of matches) {
    for (const p of m.players) {
      const fields = [
        m.match_id,
        m.date ?? '',
        m.group_id ?? '',
        csvEscape(p.deck_name),
        p.placement,
        p.won,
        csvEscape(m.comment ?? ''),
      ]
      rows.push(fields.join(','))
    }
  }

  return rows.join('\n')
}

function csvEscape (value) {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/** Triggers a browser download of `content` as a file named `filename`. */
export function downloadCsv (filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
