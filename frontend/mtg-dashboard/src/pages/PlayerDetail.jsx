import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import DeckList from '../components/DeckList'
import AddDeckForm from '../components/AddDeckForm'
import DeckAnalysisTable from '../components/DeckAnalysisTable'
import PlacementChart from '../components/PlacementChart'
import WinRateProgressionChart from '../components/WinRateProgressionChart'
import HeadToHead from '../components/HeadToHead'
import DeckTierList from '../components/DeckTierList'
import AddButton from '../components/AddButton'
import StatCard from '../components/StatCard'
import { usePlayer, usePlayers } from '../hooks/useUsers'
import { useDecksWithStats, useDecks, useInvalidateDecks } from '../hooks/useDecks'
import { useMatchesByPlayer, useMatchesDetailed, useInvalidateMatches } from '../hooks/useMatches'
import { computeStreaks } from '../utils/streaks'
import { useTranslation } from '../i18n/context'

function PlayerDetail () {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: player, error: playerError } = usePlayer(id)
  const {
    data: decks = [],
    isLoading: decksLoading,
    error: decksError
  } = useDecksWithStats(id)
  const { data: matchPlayers = [] } = useMatchesByPlayer(id)
  const { data: allMatches = [] } = useMatchesDetailed()
  const { data: allDecks = [] } = useDecks()
  const { data: allPlayers = [] } = usePlayers()
  const invalidateDecks = useInvalidateDecks()
  const invalidateMatches = useInvalidateMatches()

  const [showAddDeckForm, setShowAddDeckForm] = useState(false)

  const streaks = useMemo(() => {
    const ownerId = parseInt(id)
    const chronological = allMatches
      .filter((m) => m.players.some((p) => p.owner_id === ownerId))
      .slice()
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map((m) => m.players.find((p) => p.owner_id === ownerId).won)
    return computeStreaks(chronological)
  }, [allMatches, id])

  // DeckTierList computes its own stats from raw deck + match data (so its
  // own timespan/playgroup filters work), so it needs the plain deck list
  // scoped to this player — not the pre-aggregated /decks/with-stats data
  // used for the stat cards above.
  const playerDecks = useMemo(
    () => allDecks.filter((d) => d.ownerid === parseInt(id)),
    [allDecks, id]
  )

  if (playerError) {
    navigate('/players')
    return null
  }

  function handleDeckAdded () {
    invalidateDecks()
  }

  function handleDeckDeleted () {
    invalidateDecks()
    invalidateMatches()
  }

  function handleDeckUpdated () {
    invalidateDecks()
  }

  const totalWins = decks.reduce((sum, d) => sum + (d.wins || 0), 0)
  const totalMatches = decks.reduce((sum, d) => sum + (d.matches || 0), 0)
  const overallWinRate =
    totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0

  return (
    <div className='p-8'>
      <button
        onClick={() => navigate('/players')}
        className='flex items-center gap-2 text-sm text-parchment-faint hover:text-parchment mb-6 transition-colors'
      >
        <ArrowLeft size={14} />
        {t('common.allPlayers')}
      </button>

      {player && (
        <h1 className="font-display text-2xl tracking-wide text-parchment mb-6">
          {player.firstname} {player.lastname}
        </h1>
      )}

      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6'>
        <StatCard label={t('stat.decks')} value={decks.length} />
        <StatCard label={t('stat.matches')} value={totalMatches} />
        <StatCard
          label={t('stat.winRate')}
          value={totalMatches > 0 ? `${overallWinRate}%` : '—'}
          tone={totalMatches > 0 ? (overallWinRate >= 50 ? 'win' : 'loss') : undefined}
        />
        <StatCard
          label={t('stat.streak')}
          value={streaks.current > 0 ? `${streaks.currentType === 'win' ? 'W' : 'L'}${streaks.current}` : '—'}
          tone={streaks.currentType === 'win' ? 'win' : streaks.currentType === 'loss' ? 'loss' : undefined}
        />
      </div>

      <div className='flex flex-col gap-6 mb-6'>
        <DeckAnalysisTable decks={playerDecks} matches={allMatches} />
        <PlacementChart matchPlayers={matchPlayers} />
        {totalMatches > 0 && (
          <WinRateProgressionChart
            matches={allMatches}
            players={allPlayers}
            decks={allDecks}
            subjectType="player"
            subjectId={parseInt(id)}
          />
        )}
        {totalMatches > 0 && (
          <HeadToHead matches={allMatches} players={allPlayers} subjectOwnerId={parseInt(id)} />
        )}
        {playerDecks.length > 0 && (
          <div className="bg-surface border border-hairline rounded-lg p-5">
            <h3 className="text-sm font-medium text-parchment mb-4">{t('tierlist.title')}</h3>
            <DeckTierList decks={playerDecks} matches={allMatches} variant="embedded" />
          </div>
        )}
      </div>

      <div className='mb-4'>
        <DeckList
          decks={decks}
          loading={decksLoading}
          error={decksError ? decksError.message : null}
          onDeckUpdated={handleDeckUpdated}
          onDeckDeleted={handleDeckDeleted}
        />
        <div>
          {!showAddDeckForm && (
            <AddButton onClick={() => setShowAddDeckForm(!showAddDeckForm)} hoverText={t('decks.addDeck')} />
          )}
        </div>
      </div>

      {showAddDeckForm && (
        <AddDeckForm
          playerId={parseInt(id)}
          onDeckAdded={handleDeckAdded}
          onClickClose={() => setShowAddDeckForm(false)}
        />
      )}
    </div>
  )
}

export default PlayerDetail