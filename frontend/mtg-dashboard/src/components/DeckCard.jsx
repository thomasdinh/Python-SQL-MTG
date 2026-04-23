import { useState } from 'react'
import { Trash2, ChevronDown, ChevronUp, Layers } from 'lucide-react'
import MatchHistory from './MatchHistory'

const API_BASE = 'http://localhost:8000'

function DeckCard({ deck, onDeckDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [imgError, setImgError] = useState(false)

  function handleDelete() {
    if (!confirm(`Delete "${deck.deckname}"?`)) return
    setDeleting(true)
    fetch(`${API_BASE}/decks/${deck.deckid}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to delete deck')
        onDeckDeleted(deck.deckid)
      })
      .catch((err) => {
        alert(err.message)
        setDeleting(false)
      })
  }

  const showImage = deck.image_url && !imgError

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex gap-4 items-center">
        <div className="bg-purple-100 rounded-lg w-14 h-14 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {showImage ? (
            <img
              src={deck.image_url}
              alt={deck.deckname}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <Layers size={24} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-medium text-gray-900 truncate">
            {deck.deckname}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {deck.color ?? 'Colorless'} · MV {deck.manavalue ?? '—'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-gray-300 hover:text-gray-500 transition-colors"
          >
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-gray-300 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {showHistory && <MatchHistory deckId={deck.deckid} />}
    </div>
  )
}

export default DeckCard