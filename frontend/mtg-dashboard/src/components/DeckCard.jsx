import { useState } from 'react'
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  Layers,
  Pencil,
  X,
  Check
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import MatchHistory from './MatchHistory'
import PlayerSelector from './PlayerSelector'
import  API_BASE  from '../config'

function DeckCard ({ deck, onDeckDeleted, onDeckUpdated }) {
  const navigate = useNavigate()

  const [deleting, setDeleting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [imgError, setImgError] = useState(false)

  // edit state

  const [editing, setEditing] = useState(false)
  const [ownerid, setOwnerId] = useState(deck.ownerid ?? '')
  const [deckname, setDeckname] = useState(deck.deckname)
  const [color, setColor] = useState(deck.color ?? '')
  const [manavalue, setManavalue] = useState(deck.manavalue ?? '')
  const [partnername, setPartnername] = useState(deck.partnername ?? '')
  const [imageUrl, setImageUrl] = useState(deck.image_url ?? '')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState(null)

  const showImage = deck.image_url && !imgError

  function handleDelete () {
    if (!confirm(`Delete "${deck.deckname}"?`)) return
    setDeleting(true)
    fetch(`${API_BASE}/decks/${deck.deckid}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete deck')
        onDeckDeleted(deck.deckid)
      })
      .catch(err => {
        alert(err.message)
        setDeleting(false)
      })
  }

  function handleCancelEdit () {
    // reset fields back to original values
    setOwnerId(deck.ownerid)
    setDeckname(deck.deckname)
    setColor(deck.color ?? '')
    setManavalue(deck.manavalue ?? '')
    setPartnername(deck.partnername ?? '')
    setImageUrl(deck.image_url ?? '')
    setEditError(null)
    setEditing(false)
  }

  function handleSave () {
    if (!deckname.trim()) {
      setEditError('Deck name is required')
      return
    }

    setSaving(true)
    setEditError(null)

    fetch(`${API_BASE}/decks/${deck.deckid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deckname: deckname.trim(),
        color: color.trim().toUpperCase() || null,
        manavalue: manavalue ? parseInt(manavalue) : null,
        partnername: partnername.trim() || null,
        ownerid: ownerid ? parseInt(ownerid) : null,
        image_url: imageUrl.trim() || null
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update deck')
        return res.json()
      })
      .then(updatedDeck => {
        setSaving(false)
        setEditing(false)
        onDeckUpdated(updatedDeck)
      })
      .catch(err => {
        setEditError(err.message)
        setSaving(false)
      })
  }

  // edit mode
  if (editing) {
    return (
      <div className='bg-white border border-purple-200 rounded-xl p-4'>
        <div className='flex flex-col gap-3'>
          <div className='grid grid-cols-2 gap-3'>
            <div className='flex flex-col gap-1'>
              <label className='text-xs text-gray-500'>Owner ID</label>
              <input
                type='number'
                value={ownerid}
                onChange={e => setOwnerId(e.target.value)}
                className='border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400'
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs text-gray-500'>Commander name</label>
              <input
                value={deckname}
                onChange={e => setDeckname(e.target.value)}
                className='border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400'
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs text-gray-500'>
                Partner (optional)
              </label>
              <input
                value={partnername}
                onChange={e => setPartnername(e.target.value)}
                className='border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400'
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs text-gray-500'>Color identity</label>
              <input
                value={color}
                onChange={e => setColor(e.target.value)}
                className='border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400'
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs text-gray-500'>Commander MV</label>
              <input
                type='number'
                value={manavalue}
                onChange={e => setManavalue(e.target.value)}
                className='border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400'
              />
            </div>
            <div className='flex flex-col gap-1 col-span-2'>
              <label className='text-xs text-gray-500'>
                Image URL (optional)
              </label>
              <input
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className='border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400'
              />
            </div>
          </div>

          {editError && <p className='text-xs text-red-500'>{editError}</p>}

          <div className='flex gap-2'>
            <button
              onClick={handleSave}
              disabled={saving}
              className='flex items-center gap-1.5 bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-purple-700 disabled:opacity-50'
            >
              <Check size={13} />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancelEdit}
              className='flex items-center gap-1.5 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50'
            >
              <X size={13} />
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // display mode
  return (
    <div className='bg-white border border-gray-200 rounded-xl p-4'>
      <div className='flex gap-4 items-center'>
        <div className='bg-purple-100 rounded-lg w-14 h-14 flex items-center justify-center flex-shrink-0 overflow-hidden'>
          {showImage ? (
            <img
              src={deck.image_url}
              alt={deck.deckname}
              className='w-full h-full object-cover'
              onError={() => setImgError(true)}
            />
          ) : (
            <Layers size={24} className='text-purple-400' />
          )}
        </div>
        <div className='flex-1 min-w-0'>
          <h2
            onClick={() => navigate(`/decks/${deck.deckid}`)}
            className='text-base font-medium text-gray-900 truncate cursor-pointer hover:text-purple-600 transition-colors'
          >
            {deck.deckname}
            {deck.partnername && (
              <span className='text-gray-400'> / {deck.partnername}</span>
            )}
          </h2>
          <p className='text-sm text-gray-500 mt-0.5'>
            {deck.color ?? 'Colorless'} · MV {deck.manavalue ?? '—'}
          </p>
        </div>
        <div className='flex items-center gap-2 flex-shrink-0'>
          <button
            onClick={() => setEditing(true)}
            className='text-gray-300 hover:text-purple-500 transition-colors'
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className='text-gray-300 hover:text-gray-500 transition-colors'
          >
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className='text-gray-300 hover:text-red-500 disabled:opacity-50 transition-colors'
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
