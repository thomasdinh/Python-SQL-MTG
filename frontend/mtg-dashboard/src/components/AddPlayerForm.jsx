import { useState } from 'react'
import { X } from 'lucide-react'
import  API_BASE  from '../config'

function AddPlayerForm({ onAddPlayer, onClickClose}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // ✅ FIX 1: accept event + prevent page reload
  function handleSubmit(e) {
    e.preventDefault() // ⭐ IMPORTANT

    if (!firstName.trim()) {
      setError('First name is required')
      return
    }

    if (!lastName.trim()) {
      setError('Last name is required')
      return
    }

    setSubmitting(true)
    setError(null)

    fetch(`${API_BASE}/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstname: firstName.trim(),
        lastname: lastName.trim()
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to create user')
        return res.json()
      })
      .then(newUser => {
        setFirstName('')
        setLastName('')
        setSubmitting(false)

        
        onAddPlayer(newUser)
      })
      .catch(err => {
        setError(err.message)
        setSubmitting(false)
      })
  }

  return (
    <form onSubmit={handleSubmit} className='add-player-form'>
      <div className='bg-white border border-gray-200 rounded mt-4 p-5'>
        <div className='flex items-center justify-between mb-4 gap-4'>
        <h2 className='text-sm font-medium text-gray-900 mb-4'>Add a player</h2>
        <button className=' text-gray-400 hover:text-red-600 cursor-pointer' onClick={() => onClickClose()}>
            <X />
        </button>
        </div>
        <div className='flex flex-col-2 gap-3'>
          <div className='flex flex-col-2 gap-1 flex-1'>
            <div className='flex flex-col gap-1 flex-1'>
              <label className='text-xs text-gray-500'>First Name</label>
              <input
                type='text'
                name='firstName'
                placeholder='First Name'
                required
                value={firstName}
                className='border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-400'
                onChange={e => setFirstName(e.target.value)}
              />
            </div>

            <div className='flex flex-col gap-1 flex-1'>
              <label className='text-xs text-gray-500'>Last Name</label>
              <input
                type='text'
                name='lastName'
                placeholder='Last Name'
                required
                value={lastName}
                className='border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-400'
                onChange={e => setLastName(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          type="submit" // ✅ FIX 3: use submit instead of onClick
          disabled={submitting}
          className='bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed mt-4'
        >
          {submitting ? 'Adding...' : 'Add Player'}
        </button>

        {/* ✅ Optional: show error */}
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>
    </form>
  )
}

export default AddPlayerForm