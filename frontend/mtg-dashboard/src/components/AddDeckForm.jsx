import { useState } from 'react'
import { X } from 'lucide-react'
import { API_BASE_URL } from '../config'

function AddDeckForm ({ playerId, onDeckAdded, onClickClose }) {
  const [deckname, setDeckname] = useState('')
  const [color, setColor] = useState('')
  const [manavalue, setManavalue] = useState('')
  const [partnername, setPartnername] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [image_url, setImageUrl] = useState('')
  const [error, setError] = useState(null)

  function handleSubmit () {
    if (!deckname.trim()) {
      setError('Deck name is required')
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

  return (
    <div className='bg-white border border-gray-200 rounded-xl p-5 mb-6'>
      <div className='flex items-center justify-between mb-4 gap-4'>
        <h2 className='text-sm font-medium text-gray-900 mb-4'>Add a deck</h2>
        <button className='text-gray-400 hover:text-red-600 cursor-pointer' onClick={() => onClickClose()}>
          <X />
        </button>
      </div>

      <div className='flex flex-col gap-3'>
        <div className='flex flex-col-2 gap-3'>
          <div className='flex flex-col gap-1 flex-1'>
            <label className='text-xs text-gray-500'>Commander name</label>
            <input
              type='text'
              value={deckname}
              onChange={e => setDeckname(e.target.value)}
              placeholder="e.g. Atraxa, Praetors' Voice"
              className='border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-400'
            />
          </div>

          <div className='flex flex-col gap-1 flex-1'>
            <label className='text-xs text-gray-500'>Partner (optional)</label>
            <input
              type='text'
              value={partnername}
              onChange={e => setPartnername(e.target.value)}
              placeholder='e.g. Thrasios'
              className='border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-400'
            />
          </div>
        </div>

        <div className='flex flex-col gap-1'>
          <label className='text-xs text-gray-500'>Image URL (optional)</label>
          <input
            type='text'
            value={image_url}
            onChange={e => setImageUrl(e.target.value)}
            placeholder='e.g. https://example.com/image.jpg'
            className='border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-400'
          />
        </div>

        <div className='flex flex-col-2 gap-3'>
          <div className='flex flex-col gap-1 flex-1'>
            <label className='text-xs text-gray-500'>Color identity</label>
            <input
              type='text'
              value={color}
              onChange={e => setColor(e.target.value)}
              placeholder='e.g. WUBG'
              className='border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-400'
            />
          </div>
          <div className='flex flex-col gap-1 flex-1'>
            <label className='text-xs text-gray-500'>Mana Value</label>
            <input
              type='text'
              value={manavalue}
              onChange={e => setManavalue(e.target.value)}
              placeholder='e.g. 1,2,3...'
              className='border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-400'
            />
          </div>
        </div>

        {error && <p className='text-xs text-red-500'>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className='bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {submitting ? 'Adding...' : 'Add deck'}
        </button>
      </div>
    </div>
  )
}

export default AddDeckForm
