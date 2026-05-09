import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

function ImportMatchesButton({ onImportComplete }) {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const fileInputRef = useRef(null)

  function parseList(raw) {
    return raw.trim().replace(/[\[\]]/g, '').split(',').map(s => s.trim()).filter(Boolean)
  }

  function parseDate(raw) {
    raw = raw.trim()
    // DD.MM.YY
    let m = raw.match(/^(\d{2})\.(\d{2})\.(\d{2})$/)
    if (m) return `20${m[3]}-${m[2]}-${m[1]}`
    // DD.MM.YYYY
    m = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
    if (m) return `${m[3]}-${m[2]}-${m[1]}`
    // already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
    return null
  }

  function parseCSV(text) {
    const lines = text.trim().split('\n').filter(Boolean)
    if (lines.length < 2) return []

    // detect delimiter — tab or comma
    const delimiter = lines[0].includes('\t') ? '\t' : ','
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^\uFEFF/, ''))

    return lines.slice(1).map(line => {
      const values = line.split(delimiter)
      const row = {}
      headers.forEach((h, i) => {
        row[h] = (values[i] || '').trim()
      })
      return row
    })
  }

  async function fetchAllDecks() {
    const res = await fetch(`${API_BASE}/decks/`)
    if (!res.ok) throw new Error('Could not load decks')
    const decks = await res.json()
    // build lowercase name → id map
    const map = {}
    decks.forEach(d => { map[d.deckname.toLowerCase()] = d.deckid })
    return map
  }

  async function importRow(row, deckMap) {
    const deckNames = parseList(row['Decklist'] || '')
    const results   = parseList(row['match_result'] || '')
    const date      = parseDate(row['date'] || '')
    const groupId   = parseInt(row['group_id']) || 0
    const comment   = row['comment'] || null

    if (!date)              throw new Error(`Invalid date: "${row['date']}"`)
    if (deckNames.length < 2) throw new Error('Need at least 2 decks')

    // look up deck IDs
    const deckIds = deckNames.map(name => {
      const id = deckMap[name.toLowerCase()]
      if (!id) throw new Error(`Deck not found: "${name}"`)
      return id
    })

    // pad results
    while (results.length < deckNames.length) results.push('0')

    // step 1 — create match
    const matchRes = await fetch(`${API_BASE}/matches/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Decklist: String(deckIds[0]),
        match_result: 'completed',
        date,
        group_id: groupId,
        comment: comment || null,
      })
    })
    if (!matchRes.ok) throw new Error('Failed to create match')
    const newMatch = await matchRes.json()

    // step 2 — create match players
    await Promise.all(
      deckIds.map((deckId, i) =>
        fetch(`${API_BASE}/matchplayers/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            match_id:  newMatch.match_id,
            deck_id:   deckId,
            placement: i + 1,
            won:       results[i] === '1' ? 1 : 0,
          })
        }).then(r => { if (!r.ok) throw new Error('Failed to create match player') })
      )
    )
  }

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return

    // reset input so same file can be selected again
    e.target.value = ''

    setImporting(true)
    setResult(null)

    try {
      const text = await file.text()
      const rows = parseCSV(text).filter(r => r['Decklist'] && r['date'])

      if (rows.length === 0) {
        setResult({ success: 0, errors: ['No valid rows found in file'] })
        setImporting(false)
        return
      }

      const deckMap = await fetchAllDecks()

      let success = 0
      const errors = []

      // import rows one at a time so errors don't block each other
      for (let i = 0; i < rows.length; i++) {
        try {
          await importRow(rows[i], deckMap)
          success++
        } catch (err) {
          errors.push(`Row ${i + 2}: ${err.message}`)
        }
      }

      setResult({ success, errors })
      if (success > 0 && onImportComplete) onImportComplete()

    } catch (err) {
      setResult({ success: 0, errors: [err.message] })
    }

    setImporting(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.tsv,.txt"
        onChange={handleFile}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current.click()}
        disabled={importing}
        className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Upload size={14} />
        {importing ? 'Importing...' : 'Import CSV'}
      </button>

      {result && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          result.errors.length === 0
            ? 'bg-green-50 border border-green-100 text-green-800'
            : 'bg-amber-50 border border-amber-100 text-amber-800'
        }`}>
          <p className="font-medium mb-1">
            {result.success} match{result.success !== 1 ? 'es' : ''} imported
            {result.errors.length > 0 && `, ${result.errors.length} failed`}
          </p>
          {result.errors.length > 0 && (
            <ul className="flex flex-col gap-0.5 mt-1">
              {result.errors.map((e, i) => (
                <li key={i} className="text-xs opacity-80">{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default ImportMatchesButton