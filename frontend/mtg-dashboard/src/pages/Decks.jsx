import { useState, useMemo } from 'react'
import DeckList from '../components/DeckList'
import AddDeckForm from '../components/AddDeckForm'
import AddButton from '../components/AddButton'
import StatCard from '../components/StatCard'
import DeckFilters from '../components/DeckFilters'
import { applyDeckFilters } from '../utils/deckFilters'
import { usePlayers } from '../hooks/useUsers'
import { useDecksWithStats, useInvalidateDecks } from '../hooks/useDecks'
import { useMatchesList } from '../hooks/useMatches'
import { useTranslation } from '../i18n/context'

function Decks () {
  const { t } = useTranslation()
  const { data: decks = [], isLoading: decksLoading, error: decksError } = useDecksWithStats()
  const { data: players = [] } = usePlayers()
  const { data: matches = [] } = useMatchesList()
  const invalidateDecks = useInvalidateDecks()

  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const [showAddDeckForm, setShowAddDeckForm] = useState(false)

  // filter/sort state for the deck list (separate from the "add deck" form's
  // player selector below)
  const [filterOwnerId, setFilterOwnerId] = useState(null)
  const [filterColors, setFilterColors] = useState([])
  const [sort, setSort] = useState('name')

  const visibleDecks = useMemo(
    () => applyDeckFilters(decks, { ownerId: filterOwnerId, colors: filterColors, sort }),
    [decks, filterOwnerId, filterColors, sort]
  )

  function toggleColor (c) {
    setFilterColors((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  function clearFilters () {
    setFilterOwnerId(null)
    setFilterColors([])
  }

  // default the "add deck" form's player selector to the first player once
  // loaded, without needing a setState-in-effect round trip
  const effectiveSelectedPlayerId = selectedPlayerId ?? players[0]?.userid ?? null

  function handleDeckAdded () {
    invalidateDecks()
  }

  function handleDeckDeleted () {
    invalidateDecks()
  }

  function handleDeckUpdated () {
    invalidateDecks()
  }

  return (
    <div className='p-8'>
      <h1 className="font-display text-2xl tracking-wide text-parchment mb-6">{t('decks.title')}</h1>

      <div className='grid grid-cols-2 gap-4 mb-6'>
        <StatCard label={t('stat.decks')} value={decks.length} />
        <StatCard label={t('stat.matches')} value={matches ? matches.length : 0} />
      </div>

      <DeckFilters
        players={players}
        ownerId={filterOwnerId}
        onOwnerChange={setFilterOwnerId}
        colors={filterColors}
        onColorsToggle={toggleColor}
        sort={sort}
        onSortChange={setSort}
        onClear={clearFilters}
      />

      {!decksLoading && !decksError && (
        <p className='text-xs text-parchment-faint mb-3'>
          {visibleDecks.length} of {decks.length} decks
        </p>
      )}

      <DeckList
        decks={visibleDecks}
        loading={decksLoading}
        error={decksError ? decksError.message : null}
        onDeckDeleted={handleDeckDeleted}
        onDeckUpdated={handleDeckUpdated}
      />
      {!showAddDeckForm && (
        <AddButton onClick={() => setShowAddDeckForm(!showAddDeckForm)} hoverText={t('decks.addDeck')} />
      )}
      {showAddDeckForm && (
        <div>
          <div className='mt-4 bg-surface border border-hairline rounded-lg p-5'>
            <div className='flex flex-col gap-1 mb-4'>
              <label className='text-xs text-parchment-dim'>
                {t('decks.selectPlayer')}
              </label>
              <select
                value={effectiveSelectedPlayerId ?? ''}
                onChange={e => setSelectedPlayerId(parseInt(e.target.value))}
                className='bg-ink border border-hairline rounded-md px-3 py-2 text-sm text-parchment outline-none focus:border-brass'
              >
                <option value='' disabled>
                  Select a player
                </option>
                {players.map(player => (
                  <option key={player.userid} value={player.userid}>
                    {player.firstname} {player.lastname}
                  </option>
                ))}
              </select>
            </div>

            {effectiveSelectedPlayerId && (
              <AddDeckForm
                playerId={effectiveSelectedPlayerId}
                className='mt-6'
                onDeckAdded={handleDeckAdded}
                onClickClose={() => setShowAddDeckForm(false)}
                hideTitle
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Decks
