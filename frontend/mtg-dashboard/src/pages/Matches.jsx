import { useState, useMemo } from 'react'
import { Plus, X, Download } from 'lucide-react'
import MatchCard from '../components/MatchCard'
import AddMatchForm from '../components/AddMatchForm'
import ImportMatchesButton from '../components/ImportMatchesButton'
import MatchFilters from '../components/MatchFilters'
import { applyMatchFilters } from '../utils/matchFilters'
import { matchesToCsv, downloadCsv } from '../utils/csvExport'
import { useMatchesDetailed, useInvalidateMatches } from '../hooks/useMatches'
import { useDecks } from '../hooks/useDecks'
import { usePlayers } from '../hooks/useUsers'
import { useTranslation } from '../i18n/context'

function Matches () {
  const { t } = useTranslation()
  const { data: matches = [], isLoading, error } = useMatchesDetailed()
  const { data: decks = [] } = useDecks()
  const { data: players = [] } = usePlayers()
  const invalidateMatches = useInvalidateMatches()
  const [showForm, setShowForm] = useState(false)

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [minPlayers, setMinPlayers] = useState(null)
  const [deckId, setDeckId] = useState(null)
  const [ownerId, setOwnerId] = useState(null)
  const [sort, setSort] = useState('date_desc')

  const visibleMatches = useMemo(
    () => applyMatchFilters(matches, { from, to, minPlayers, deckId, ownerId, sort }),
    [matches, from, to, minPlayers, deckId, ownerId, sort]
  )

  function clearFilters () {
    setFrom('')
    setTo('')
    setMinPlayers(null)
    setDeckId(null)
    setOwnerId(null)
  }

  function handleMatchAdded () {
    setShowForm(false)
    invalidateMatches()
  }

  function handleMatchDeleted () {
    invalidateMatches()
  }

  function handleExport () {
    const csv = matchesToCsv(visibleMatches)
    const stamp = new Date().toISOString().slice(0, 10)
    downloadCsv(`matches-${stamp}.csv`, csv)
  }

  if (isLoading)
    return <p className='p-8 text-sm text-parchment-faint'>{t('common.loadingMatches')}</p>
  if (error) return <p className='p-8 text-sm text-loss'>Error: {error.message}</p>

  return (
    <div className='p-8'>
      <div className='flex items-center justify-between mb-6 max-w-6xl mx-auto'>
        <h1 className="font-display text-2xl tracking-wide text-parchment">
          {t('matches.title')}
          <span className='text-parchment-faint font-mono font-normal text-lg ml-2'>
            {matches.length}
          </span>
        </h1>

        <div className='flex items-center gap-3'>
          <ImportMatchesButton onImportComplete={invalidateMatches} />
          <button
            onClick={handleExport}
            disabled={visibleMatches.length === 0}
            title={t('matches.exportCsv')}
            className='flex items-center gap-2 border border-hairline rounded-md px-4 py-2 text-sm text-parchment-dim hover:bg-surface-raised disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            <Download size={14} />
            {t('matches.exportCsv')}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className='flex items-center gap-1.5 bg-brass text-ink rounded-md px-4 py-2 text-sm font-medium hover:bg-brass-dim transition-colors'
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? t('common.cancel') : t('matches.logMatch')}
          </button>
        </div>
      </div>

      <div className='max-w-6xl mx-auto'>
        {showForm && <AddMatchForm onMatchAdded={handleMatchAdded} />}

        <MatchFilters
          players={players}
          decks={decks}
          from={from} to={to} onFromChange={setFrom} onToChange={setTo}
          minPlayers={minPlayers} onMinPlayersChange={setMinPlayers}
          deckId={deckId} onDeckChange={setDeckId}
          ownerId={ownerId} onOwnerChange={setOwnerId}
          sort={sort} onSortChange={setSort}
          onClear={clearFilters}
        />

        <p className='text-xs text-parchment-faint mb-3'>
          {visibleMatches.length} of {matches.length} matches
        </p>

        {visibleMatches.length === 0 ? (
          <p className='text-sm text-parchment-faint'>
            {matches.length === 0 ? t('common.noMatchesYet') : t('common.noMatchesFilters')}
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '1rem'
            }}
          >
            {visibleMatches.map(match => (
              <MatchCard
                key={match.match_id}
                match={match}
                onMatchDeleted={handleMatchDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Matches
