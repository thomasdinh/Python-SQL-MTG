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
import ColorIdentity from './ColorIdentity'
import  API_BASE  from '../config'
import { useTranslation } from '../i18n/context'

function DeckCard ({ deck, onDeckDeleted, onDeckUpdated }) {
  const { t } = useTranslation()
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
  const hasStats = deck.matches !== undefined
  const winRate = hasStats && deck.matches > 0 ? Math.round((deck.wins / deck.matches) * 100) : null

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
      setEditError(t('forms.deckNameRequired'))
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

  const inputClass = 'bg-ink border border-hairline rounded-md px-3 py-2 text-sm text-parchment outline-none focus:border-brass'

  // edit mode
  if (editing) {
    return (
      <div className='bg-surface border border-brass-dim rounded-lg p-4'>
        <div className='flex flex-col gap-3'>
          <div className='grid grid-cols-2 gap-3'>
            <div className='flex flex-col gap-1'>
              <label className='text-xs text-parchment-dim'>{t('forms.ownerId')}</label>
              <input
                type='number'
                value={ownerid}
                onChange={e => setOwnerId(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs text-parchment-dim'>{t('forms.commanderName')}</label>
              <input
                value={deckname}
                onChange={e => setDeckname(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs text-parchment-dim'>
                {t('forms.partnerOptional')}
              </label>
              <input
                value={partnername}
                onChange={e => setPartnername(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs text-parchment-dim'>{t('forms.colorIdentity')}</label>
              <input
                value={color}
                onChange={e => setColor(e.target.value)}
                placeholder='e.g. WUBG'
                className={inputClass}
              />
            </div>
            <div className='flex flex-col gap-1'>
              <label className='text-xs text-parchment-dim'>{t('forms.commanderMv')}</label>
              <input
                type='number'
                value={manavalue}
                onChange={e => setManavalue(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className='flex flex-col gap-1 col-span-2'>
              <label className='text-xs text-parchment-dim'>
                {t('forms.imageUrlOptional')}
              </label>
              <input
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {editError && <p className='text-xs text-loss'>{editError}</p>}

          <div className='flex gap-2'>
            <button
              onClick={handleSave}
              disabled={saving}
              className='flex items-center gap-1.5 bg-brass text-ink rounded-md px-4 py-2 text-sm font-medium hover:bg-brass-dim disabled:opacity-50'
            >
              <Check size={13} />
              {saving ? t('forms.saving') : t('common.save')}
            </button>
            <button
              onClick={handleCancelEdit}
              className='flex items-center gap-1.5 border border-hairline rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-surface-raised'
            >
              <X size={13} />
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // display mode
  return (
    <div className='bg-surface border border-hairline rounded-lg p-4'>
      <div className='flex gap-4 items-center'>
        <div className='bg-surface-raised rounded-md w-14 h-14 flex items-center justify-center flex-shrink-0 overflow-hidden border border-hairline'>
          {showImage ? (
            <img
              src={deck.image_url}
              alt={deck.deckname}
              className='w-full h-full object-cover'
              onError={() => setImgError(true)}
            />
          ) : (
            <Layers size={22} className='text-parchment-faint' />
          )}
        </div>
        <div className='flex-1 min-w-0'>
          <h2
            onClick={() => navigate(`/decks/${deck.deckid}`)}
            className='text-base font-medium text-parchment truncate cursor-pointer hover:text-brass transition-colors'
          >
            {deck.deckname}
            {deck.partnername && (
              <span className='text-parchment-faint'> / {deck.partnername}</span>
            )}
          </h2>
          <div className='flex items-center gap-2 mt-1'>
            <ColorIdentity color={deck.color} size={14} />
            <span className='text-xs text-parchment-faint'>· MV {deck.manavalue ?? '—'}</span>
            {winRate !== null && (
              <span className='text-xs font-mono text-parchment-dim'>
                · {deck.wins}/{deck.matches} ({winRate}%)
              </span>
            )}
          </div>
        </div>
        <div className='flex items-center gap-2 flex-shrink-0'>
          <button
            onClick={() => setEditing(true)}
            className='text-parchment-faint hover:text-brass transition-colors'
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className='text-parchment-faint hover:text-parchment transition-colors'
          >
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className='text-parchment-faint hover:text-loss disabled:opacity-50 transition-colors'
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
