import { useState } from 'react'
import { X } from 'lucide-react'
import  API_BASE  from '../config'
import ColorIdentity from './ColorIdentity'
import { useTranslation } from '../i18n/context'

function AddDeckForm ({ playerId, onDeckAdded, onClickClose }) {
  const { t } = useTranslation()
  const [deckname, setDeckname] = useState('')
  const [color, setColor] = useState('')
  const [manavalue, setManavalue] = useState('')
  const [partnername, setPartnername] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [image_url, setImageUrl] = useState('')
  const [error, setError] = useState(null)

  function handleSubmit () {
    if (!deckname.trim()) {
      setError(t('forms.deckNameRequired'))
      return
    }

    setSubmitting(true)
    setError(null)

    fetch(`${API_BASE}/decks/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deckname: deckname.trim(),
        color: color.trim().toUpperCase() || null,
        manavalue: manavalue ? parseInt(manavalue) : null,
        partnername: partnername.trim() || null,
        ownerid: playerId,
        image_url: image_url || null
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to create deck')
        return res.json()
      })
      .then(newDeck => {
        setDeckname('')
        setColor('')
        setManavalue('')
        setPartnername('')
        setImageUrl('')
        setSubmitting(false)
        onDeckAdded(newDeck)
      })
      .catch(err => {
        setError(err.message)
        setSubmitting(false)
      })
  }

  const inputClass = 'bg-ink border border-hairline rounded-md px-3 py-2 text-sm text-parchment outline-none focus:border-brass placeholder:text-parchment-faint'

  return (
    <div className='bg-surface border border-hairline rounded-lg p-5 mb-6'>
      <div className='flex items-center justify-between mb-4 gap-4'>
        <h2 className='text-sm font-medium text-parchment mb-4'>{t('forms.addDeckTitle')}</h2>
        <button className='text-parchment-faint hover:text-loss cursor-pointer' onClick={() => onClickClose()}>
          <X size={18} />
        </button>
      </div>

      <div className='flex flex-col gap-3'>
        <div className='flex flex-col-2 gap-3'>
          <div className='flex flex-col gap-1 flex-1'>
            <label className='text-xs text-parchment-dim'>{t('forms.commanderName')}</label>
            <input
              type='text'
              value={deckname}
              onChange={e => setDeckname(e.target.value)}
              placeholder="e.g. Atraxa, Praetors' Voice"
              className={inputClass}
            />
          </div>

          <div className='flex flex-col gap-1 flex-1'>
            <label className='text-xs text-parchment-dim'>{t('forms.partnerOptional')}</label>
            <input
              type='text'
              value={partnername}
              onChange={e => setPartnername(e.target.value)}
              placeholder='e.g. Thrasios'
              className={inputClass}
            />
          </div>
        </div>

        <div className='flex flex-col gap-1'>
          <label className='text-xs text-parchment-dim'>{t('forms.imageUrlOptional')}</label>
          <input
            type='text'
            value={image_url}
            onChange={e => setImageUrl(e.target.value)}
            placeholder='e.g. https://example.com/image.jpg'
            className={inputClass}
          />
        </div>

        <div className='flex flex-col-2 gap-3 items-end'>
          <div className='flex flex-col gap-1 flex-1'>
            <label className='text-xs text-parchment-dim'>{t('forms.colorIdentity')}</label>
            <input
              type='text'
              value={color}
              onChange={e => setColor(e.target.value)}
              placeholder='e.g. WUBG'
              className={inputClass}
            />
          </div>
          <div className='flex flex-col gap-1 flex-1'>
            <label className='text-xs text-parchment-dim'>{t('forms.manaValue')}</label>
            <input
              type='text'
              value={manavalue}
              onChange={e => setManavalue(e.target.value)}
              placeholder='e.g. 1,2,3...'
              className={inputClass}
            />
          </div>
          <div className='pb-2'>
            <ColorIdentity color={color} size={16} />
          </div>
        </div>

        {error && <p className='text-xs text-loss'>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className='bg-brass text-ink rounded-md px-4 py-2 text-sm font-medium hover:bg-brass-dim disabled:opacity-50 disabled:cursor-not-allowed w-fit'
        >
          {submitting ? t('forms.adding') : t('decks.addDeck')}
        </button>
      </div>
    </div>
  )
}

export default AddDeckForm
