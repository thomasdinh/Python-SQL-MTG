import { useState } from 'react'
import { X } from 'lucide-react'
import  API_BASE  from '../config'
import { useTranslation } from '../i18n/context'

function AddPlayerForm({ onAddPlayer, onClickClose}) {
  const { t } = useTranslation()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()

    if (!firstName.trim()) {
      setError(t('forms.firstNameRequired'))
      return
    }

    if (!lastName.trim()) {
      setError(t('forms.lastNameRequired'))
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

  const inputClass = 'bg-ink border border-hairline rounded-md px-3 py-2 text-sm text-parchment outline-none focus:border-brass'

  return (
    <form onSubmit={handleSubmit} className='add-player-form'>
      <div className='bg-surface border border-hairline rounded-lg mt-4 p-5'>
        <div className='flex items-center justify-between mb-4 gap-4'>
          <h2 className='text-sm font-medium text-parchment'>{t('forms.addPlayerTitle')}</h2>
          <button type='button' className='text-parchment-faint hover:text-loss cursor-pointer' onClick={() => onClickClose()}>
            <X size={18} />
          </button>
        </div>
        <div className='flex flex-col-2 gap-3'>
          <div className='flex flex-col-2 gap-1 flex-1'>
            <div className='flex flex-col gap-1 flex-1'>
              <label className='text-xs text-parchment-dim'>{t('forms.firstName')}</label>
              <input
                type='text'
                name='firstName'
                placeholder={t('forms.firstName')}
                required
                value={firstName}
                className={inputClass}
                onChange={e => setFirstName(e.target.value)}
              />
            </div>

            <div className='flex flex-col gap-1 flex-1'>
              <label className='text-xs text-parchment-dim'>{t('forms.lastName')}</label>
              <input
                type='text'
                name='lastName'
                placeholder={t('forms.lastName')}
                required
                value={lastName}
                className={inputClass}
                onChange={e => setLastName(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className='bg-brass text-ink rounded-md px-4 py-2 text-sm font-medium hover:bg-brass-dim disabled:opacity-50 disabled:cursor-not-allowed mt-4'
        >
          {submitting ? t('forms.adding') : t('players.addPlayer')}
        </button>

        {error && (
          <p className="text-loss text-sm mt-2">{error}</p>
        )}
      </div>
    </form>
  )
}

export default AddPlayerForm
