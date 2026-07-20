import { useState, useRef } from 'react'
import { Upload, AlertTriangle, HelpCircle } from 'lucide-react'
import { useTranslation } from '../i18n/context'
import  API_BASE  from '../config'

function ImportMatchesButton({ onImportComplete }) {
  const { t } = useTranslation()
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [replaceExisting, setReplaceExisting] = useState(false)
  const [showFormatHelp, setShowFormatHelp] = useState(false)
  // Set while we're waiting on the user to decide what to do about deck
  // names the CSV references that don't exist in the system yet — see
  // findMissingDecks below. Holds everything needed to resume the import.
  const [pending, setPending] = useState(null)
  const fileInputRef = useRef(null)

  function parseList(raw) {
    return raw.trim().replace(/[[\]]/g, '').split(',').map(s => s.trim()).filter(Boolean)
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

  // A real CSV row tokenizer — respects double-quoted fields, including
  // ones that contain the delimiter itself (e.g. "Voja,Temmet,Aesi,Animar"
  // as a single Decklist value) or an escaped "" quote. A naive
  // line.split(',') breaks on exactly this kind of data: every quoted
  // field with an embedded comma would get sliced into extra columns and
  // shift everything after it.
  function parseCSVRows(text, delimiter) {
    const rows = []
    let row = []
    let field = ''
    let inQuotes = false
    const chars = text.replace(/\r\n/g, '\n')

    for (let i = 0; i < chars.length; i++) {
      const c = chars[i]
      if (inQuotes) {
        if (c === '"') {
          if (chars[i + 1] === '"') { field += '"'; i++ } // escaped quote
          else inQuotes = false
        } else {
          field += c
        }
      } else if (c === '"') {
        inQuotes = true
      } else if (c === delimiter) {
        row.push(field); field = ''
      } else if (c === '\n') {
        row.push(field); rows.push(row); row = []; field = ''
      } else {
        field += c
      }
    }
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
    return rows.filter(r => r.some(v => v.trim() !== ''))
  }

  function parseCSV(text) {
    const firstLine = text.slice(0, text.indexOf('\n') === -1 ? text.length : text.indexOf('\n'))
    const delimiter = firstLine.includes('\t') ? '\t' : ','
    const rows = parseCSVRows(text, delimiter)
    if (rows.length < 2) return []

    const headers = rows[0].map(h => h.trim().replace(/^\uFEFF/, ''))
    return rows.slice(1).map(values => {
      const row = {}
      headers.forEach((h, i) => { row[h] = (values[i] || '').trim() })
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

  /**
   * Scans every row's Decklist for deck names that aren't in the system
   * yet — checked up front, before creating anything, so a typo or a
   * genuinely new deck shows up as one clear list instead of N scattered
   * per-row failures after the fact. Decks need an owner (ownerid), which
   * a match-history CSV has no way to specify, so this can't auto-create
   * them — the responsible move is surfacing what's missing and letting
   * the person add those decks first.
   */
  function findMissingDecks(rows, deckMap) {
    const missing = new Set()
    for (const row of rows) {
      for (const name of parseList(row['Decklist'] || '')) {
        if (!deckMap[name.toLowerCase()]) missing.add(name)
      }
    }
    return [...missing]
  }

  /**
   * Reads the backend's actual error detail (FastAPI returns it as JSON
   * {detail: "..."}) instead of throwing a generic client-side message —
   * without this, a real backend error (a bad constraint, a bug, whatever)
   * gets hidden behind the same unhelpful phrase every time, which is
   * exactly what made a real bug here take longer to diagnose than it
   * should have.
   */
  async function throwOnError (res, fallbackMessage) {
    if (res.ok) return
    try {
      const body = await res.json()
      throw new Error(body.detail || fallbackMessage)
    } catch (err) {
      if (err instanceof SyntaxError) throw new Error(fallbackMessage) // response wasn't JSON
      throw err
    }
  }

  async function deleteAllExistingMatches() {
    const res = await fetch(`${API_BASE}/matches/`)
    if (!res.ok) throw new Error('Could not load existing matches to replace')
    const existing = await res.json()
    await Promise.all(
      existing.map(m =>
        fetch(`${API_BASE}/matches/${m.match_id}`, { method: 'DELETE' })
          .then(r => throwOnError(r, `Failed to delete existing match #${m.match_id}`))
      )
    )
  }

  async function importRow (row, deckMap) {
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

    // The CSV's own match_id column (if present) is intentionally never
    // read here — matches get their ID from the database's own
    // auto-increment, same as every other way of creating a match in this
    // app. A CSV's match_id is just whatever the original export happened
    // to use; it has no meaning to import against.
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
    await throwOnError(matchRes, 'Failed to create match')
    const newMatch = await matchRes.json()

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
        }).then(r => throwOnError(r, 'Failed to create match player'))
      )
    )
  }

  async function runImport(rows, deckMap) {
    setImporting(true)
    setPending(null)

    try {
      if (replaceExisting) {
        if (!window.confirm(t('matches.replaceConfirm'))) {
          setImporting(false)
          return
        }
        await deleteAllExistingMatches()
      }

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

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return

    // reset input so same file can be selected again
    e.target.value = ''

    setImporting(true)
    setResult(null)
    setPending(null)

    try {
      const text = await file.text()
      const rows = parseCSV(text).filter(r => r['Decklist'] && r['date'])

      if (rows.length === 0) {
        setResult({ success: 0, errors: [t('matches.noValidRows')] })
        setImporting(false)
        return
      }

      const deckMap = await fetchAllDecks()
      const missingDecks = findMissingDecks(rows, deckMap)

      if (missingDecks.length > 0) {
        // Hold off on importing anything until the person decides —
        // either they go add these decks and re-import, or they
        // explicitly choose to proceed and skip the affected matches.
        setPending({ rows, deckMap, missingDecks })
        setImporting(false)
        return
      }

      await runImport(rows, deckMap)
    } catch (err) {
      setResult({ success: 0, errors: [err.message] })
      setImporting(false)
    }
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

      <label className="flex items-center gap-2 text-xs text-parchment-faint cursor-pointer select-none">
        <input
          type="checkbox"
          checked={replaceExisting}
          onChange={(e) => setReplaceExisting(e.target.checked)}
          className="accent-brass"
        />
        {t('matches.replaceExisting')}
      </label>

      <button
        type="button"
        onClick={() => setShowFormatHelp(!showFormatHelp)}
        className="flex items-center gap-1.5 text-xs text-parchment-faint hover:text-brass transition-colors w-fit"
      >
        <HelpCircle size={12} />
        {t('matches.csvFormatHelp')}
      </button>

      {showFormatHelp && (
        <div className="bg-ink-2 border border-hairline rounded-md p-3 flex flex-col gap-2">
          <p className="text-xs text-parchment-dim">{t('matches.csvFormatIntro')}</p>
          <pre className="bg-ink border border-hairline rounded-md p-2 overflow-x-auto text-[11px] font-mono text-parchment-faint leading-relaxed">
{`Decklist,match_result,date,group_id,comment
"Atraxa,Korvold,Muldrotha,Urza","1, 0, 0, 0",31.03.25,0,"combo turn 7"
"Voja,Temmet,Aesi","[1, 0, 0]",01.04.25,0,`}
          </pre>
          <ul className="flex flex-col gap-1 text-xs text-parchment-faint list-disc list-inside">
            <li>{t('matches.csvFormatDecklist')}</li>
            <li>{t('matches.csvFormatResult')}</li>
            <li>{t('matches.csvFormatDate')}</li>
            <li>{t('matches.csvFormatOptional')}</li>
          </ul>
        </div>
      )}

      <button
        onClick={() => fileInputRef.current.click()}
        disabled={importing}
        className="flex items-center gap-2 border border-hairline rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-surface-raised disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Upload size={14} />
        {importing ? 'Importing...' : t('matches.importCsv')}
      </button>

      {pending && (
        <div className="rounded-md px-4 py-3 text-sm border bg-brass/10 border-brass/30">
          <p className="flex items-center gap-1.5 font-medium text-brass mb-1">
            <AlertTriangle size={13} />
            {t('matches.missingDecksTitle').replace('{n}', pending.missingDecks.length)}
          </p>
          <p className="text-xs text-parchment-dim mb-2">{t('matches.missingDecksHint')}</p>
          <ul className="flex flex-wrap gap-1.5 mb-3">
            {pending.missingDecks.map((name) => (
              <li key={name} className="text-xs font-mono bg-ink px-2 py-1 rounded-md text-parchment-dim">
                {name}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => runImport(pending.rows, pending.deckMap)}
              className="text-xs px-3 py-1.5 rounded-md border border-hairline text-parchment-dim hover:bg-surface-raised transition-colors"
            >
              {t('matches.proceedAnyway')}
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="text-xs text-parchment-faint hover:text-parchment transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className={`rounded-md px-4 py-3 text-sm border ${
          result.errors.length === 0
            ? 'bg-win/10 border-win/30 text-win'
            : 'bg-brass/10 border-brass/30 text-brass'
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