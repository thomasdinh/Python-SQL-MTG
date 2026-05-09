import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'

const API_BASE = 'http://localhost:8000'

function AddMatchForm({ onMatchAdded }) {
  const [allDecks, setAllDecks] = useState([])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [comment, setComment] = useState('')
  const [participants, setParticipants] = useState([
    { deckId: '', placement: 1 },
    { deckId: '', placement: 2 },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // fetch all decks for the dropdowns
  useEffect(() => {
    fetch(`${API_BASE}/decks/`)
      .then((res) => res.json())
      .then((data) => setAllDecks(data))
      .catch(() => setError('Could not load decks'))
  }, [])

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
    if (!date) return 'Date is required'
    if (participants.length < 2) return 'A match needs at least 2 participants'
    for (const p of participants) {
      if (!p.deckId) return 'All participants need a deck selected'
    }
    const deckIds = participants.map((p) => p.deckId)
    const unique = new Set(deckIds)
    if (unique.size !== deckIds.length) return 'Each deck can only appear once'
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
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <h2 className="text-sm font-medium text-gray-900 mb-4">Log a match</h2>

      <div className="flex flex-col gap-4">

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Comment (optional)</label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Won via combo turn 7"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-500">Participants</label>
            <span className="text-xs text-gray-400">
              Placement 1 = winner
            </span>
          </div>

          {participants.map((p, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-5 flex-shrink-0">
                #{p.placement}
              </span>
              <select
                value={p.deckId}
                onChange={(e) => updateParticipant(index, 'deckId', e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400 bg-white"
              >
                <option value="">Select deck</option>
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
                className="w-16 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400 text-center"
              />
              {participants.length > 2 && (
                <button
                  onClick={() => removeParticipant(index)}
                  className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addParticipant}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mt-1 w-fit"
          >
            <Plus size={13} />
            Add participant
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
        >
          {submitting ? 'Saving...' : 'Log match'}
        </button>

      </div>
    </div>
  )
}

export default AddMatchForm