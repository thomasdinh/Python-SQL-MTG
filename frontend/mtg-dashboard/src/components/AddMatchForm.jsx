import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import  API_BASE  from '../config'
import { useDecks } from '../hooks/useDecks'
import { useTranslation } from '../i18n/context'

function AddMatchForm({ onMatchAdded }) {
  const { t } = useTranslation()
  const { data: allDecks = [], error: decksError } = useDecks()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [comment, setComment] = useState('')
  const [participants, setParticipants] = useState([
    { deckId: '', placement: 1 },
    { deckId: '', placement: 2 },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  function addParticipant() {
    setParticipants([
      ...participants,
      { deckId: '', placement: participants.length + 1 }
    ])
  }

  function removeParticipant(index) {
    const updated = participants
      .filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, placement: i + 1 }))
    setParticipants(updated)
  }

  function updateParticipant(index, field, value) {
    setParticipants(participants.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    ))
  }

  function validate() {
    if (!date) return t('forms.dateRequired')
    if (participants.length < 2) return t('forms.minParticipants')
    for (const p of participants) {
      if (!p.deckId) return t('forms.allNeedDeck')
    }
    const deckIds = participants.map((p) => p.deckId)
    const unique = new Set(deckIds)
    if (unique.size !== deckIds.length) return t('forms.deckOnce')
    return null
  }

  function handleSubmit() {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError(null)

    const winner = participants.find((p) => p.placement === 1)

    // step 1 — create the match
    fetch(`${API_BASE}/matches/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Decklist: winner ? String(winner.deckId) : 'tbd',
        match_result: 'completed',
        date: date,
        group_id: 1,
        comment: comment.trim() || null,
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to create match')
        return res.json()
      })
      .then((newMatch) => {
        // step 2 — create a matchplayer for each participant in parallel
        return Promise.all(
          participants.map((p) =>
            fetch(`${API_BASE}/matchplayers/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                match_id: newMatch.match_id,
                deck_id: parseInt(p.deckId),
                placement: p.placement,
                won: p.placement === 1 ? 1 : 0,
              })
            }).then((res) => {
              if (!res.ok) throw new Error('Failed to create match player')
              return res.json()
            })
          )
        ).then(() => newMatch)
      })
      .then((newMatch) => {
        // reset form
        setDate(new Date().toISOString().slice(0, 10))
        setComment('')
        setParticipants([
          { deckId: '', placement: 1 },
          { deckId: '', placement: 2 },
        ])
        setSubmitting(false)
        onMatchAdded(newMatch.match_id)
      })
      .catch((err) => {
        setError(err.message)
        setSubmitting(false)
      })
  }

  return (
    <div className="bg-surface border border-hairline rounded-lg p-5 mb-6">
      <h2 className="text-sm font-medium text-parchment mb-4">{t('matches.logAMatch')}</h2>

      <div className="flex flex-col gap-4">

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-parchment-dim">{t('matches.date')}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-ink border border-hairline rounded-md px-3 py-2 text-sm text-parchment outline-none focus:border-brass"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-parchment-dim">{t('matches.commentOptional')}</label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Won via combo turn 7"
              className="bg-ink border border-hairline rounded-md px-3 py-2 text-sm text-parchment outline-none focus:border-brass"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-parchment-dim">{t('matches.participants')}</label>
            <span className="text-xs text-parchment-faint">
              {t('matches.placementWinnerHint')}
            </span>
          </div>

          {participants.map((p, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xs text-parchment-faint w-5 flex-shrink-0 font-mono">
                #{p.placement}
              </span>
              <select
                value={p.deckId}
                onChange={(e) => updateParticipant(index, 'deckId', e.target.value)}
                className="flex-1 bg-ink border border-hairline rounded-md px-3 py-2 text-sm text-parchment outline-none focus:border-brass"
              >
                <option value="">{t('matches.selectDeck')}</option>
                {allDecks.map((deck) => (
                  <option key={deck.deckid} value={deck.deckid}>
                    {deck.deckname}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                max={participants.length}
                value={p.placement}
                onChange={(e) => updateParticipant(index, 'placement', parseInt(e.target.value))}
                className="w-16 bg-ink border border-hairline rounded-md px-3 py-2 text-sm text-parchment outline-none focus:border-brass text-center"
              />
              {participants.length > 2 && (
                <button
                  onClick={() => removeParticipant(index)}
                  className="text-parchment-faint hover:text-loss transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addParticipant}
            className="flex items-center gap-1.5 text-xs text-parchment-dim hover:text-parchment transition-colors mt-1 w-fit"
          >
            <Plus size={13} />
            {t('matches.addParticipant')}
          </button>
        </div>

        {(error || decksError) && (
          <p className="text-xs text-loss">{error || t('matches.couldNotLoadDecks')}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-brass text-ink rounded-md px-4 py-2 text-sm font-medium hover:bg-brass-dim disabled:opacity-50 disabled:cursor-not-allowed w-fit"
        >
          {submitting ? t('matches.saving') : t('matches.logMatch')}
        </button>

      </div>
    </div>
  )
}

export default AddMatchForm