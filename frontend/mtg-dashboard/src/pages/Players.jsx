import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, User } from 'lucide-react'
import AddButton from '../components/AddButton'
import AddPlayerForm from '../components/AddPlayerForm'
import { usePlayers, useInvalidatePlayers } from '../hooks/useUsers'
import { useDecks } from '../hooks/useDecks'
import { useMatchesDetailed } from '../hooks/useMatches'
import { computePlayerStats, sortPlayers } from '../utils/playerStats'
import { useTranslation } from '../i18n/context'

function Players () {
  const { t } = useTranslation()
  const { data: players = [], isLoading, error } = usePlayers()
  const { data: decks = [] } = useDecks()
  const { data: matches = [] } = useMatchesDetailed()
  const invalidatePlayers = useInvalidatePlayers()
  const [showAddForm, setShowAddForm] = useState(false)
  const [sort, setSort] = useState('winrate')
  const navigate = useNavigate()

  const PLAYER_SORT_LABELS = {
    name: t('players.sortName'),
    winrate: t('players.sortWinrate'),
    matches: t('players.sortMatches'),
  }

  const rankedPlayers = useMemo(
    () => sortPlayers(computePlayerStats(players, matches, decks), sort),
    [players, matches, decks, sort]
  )

  if (isLoading)
    return <p className='p-8 text-sm text-parchment-faint'>{t('common.loadingPlayers')}</p>
  if (error) return <p className='p-8 text-sm text-loss'>{error.message}</p>

  function handleNewPlayerAdded () {
    invalidatePlayers()
  }

  return (
    <div className='p-8'>
      <div className='flex items-center justify-between mb-6 flex-wrap gap-3'>
        <h1 className="font-display text-2xl tracking-wide text-parchment">{t('players.title')}</h1>
        <div className='flex flex-col gap-1'>
          <label className='text-xs text-parchment-dim'>{t('common.sortBy')}</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className='bg-ink border border-hairline rounded-md px-3 py-2 text-sm text-parchment outline-none focus:border-brass'
          >
            {Object.entries(PLAYER_SORT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1rem'
        }}
      >
        {rankedPlayers.map(player => (
          <button
            key={player.userid}
            onClick={() => navigate(`/players/${player.userid}`)}
            className='bg-surface border border-hairline rounded-lg px-5 py-4 flex items-center gap-4 hover:border-brass-dim transition-colors text-left'
          >
            <div className='w-9 h-9 rounded-full bg-surface-raised border border-hairline flex items-center justify-center flex-shrink-0'>
              <User size={16} className='text-brass' />
            </div>
            <div className='flex-1 min-w-0'>
              <p className='font-medium text-parchment truncate'>
                {player.firstname} {player.lastname}
              </p>
              <p className='text-xs font-mono text-parchment-faint mt-0.5'>
                {player.matches > 0
                  ? `${Math.round(player.winRate * 100)}% · ${player.wins}/${player.matches}`
                  : t('players.noGamesYet')}
                {' · '}{player.decksOwned} {player.decksOwned === 1 ? t('players.deck') : t('players.decks')}
              </p>
            </div>
            <ChevronRight size={16} className='text-parchment-faint flex-shrink-0' />
          </button>
        ))}
        <div>
        {!showAddForm && (
        <AddButton
          onClick={() => setShowAddForm(!showAddForm)}
          className='mt-6 '
          hoverText={t('players.addPlayer')}
        />

      )}
      </div>
      </div>

      {showAddForm && <AddPlayerForm onAddPlayer={handleNewPlayerAdded} onClickClose={() => setShowAddForm(false)} />}
    </div>
  )
}

export default Players
