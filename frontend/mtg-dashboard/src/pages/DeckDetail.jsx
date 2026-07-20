import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Layers } from 'lucide-react'
import MatchHistory from '../components/MatchHistory'
import RecentForm from '../components/RecentForm'
import WinRateProgressionChart from '../components/WinRateProgressionChart'
import ColorIdentity from '../components/ColorIdentity'
import StatCard from '../components/StatCard'
import { useDeck, useDeckMatchHistory, useDecks } from '../hooks/useDecks'
import { useMatchesDetailed } from '../hooks/useMatches'
import { usePlayers } from '../hooks/useUsers'
import { computeStreaks } from '../utils/streaks'
import { useTranslation } from '../i18n/context'

function DeckDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)

  const { data: deck, isLoading: deckLoading, error: deckError } = useDeck(id)
  const { data: matchPlayers = [] } = useDeckMatchHistory(id)
  const { data: allMatches = [] } = useMatchesDetailed()
  const { data: decks = [] } = useDecks()
  const { data: players = [] } = usePlayers()

  if (deckError) {
    navigate('/decks')
    return null
  }

  if (deckLoading) return <p className="p-8 text-sm text-parchment-faint">{t('common.loadingDeck')}</p>
  if (!deck) return null

  const showImage = deck.image_url && !imgError

  const totalMatches = matchPlayers.length
  const wins = matchPlayers.filter((mp) => mp.won === 1).length
  const losses = totalMatches - wins
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0
  const avgPlacement = totalMatches > 0
    ? (matchPlayers.reduce((sum, mp) => sum + mp.placement, 0) / totalMatches).toFixed(1)
    : '—'
  const chronologicalResults = matchPlayers
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .map((mp) => mp.won)
  const streaks = computeStreaks(chronologicalResults)

  return (
    <div className="max-w-3xl mx-auto p-8">

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-parchment-faint hover:text-parchment mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        {t('common.back')}
      </button>

      {/* deck header */}
      <div className="bg-surface border border-hairline rounded-lg p-6 flex gap-5 items-center mb-6">
        <div className="w-20 h-20 rounded-lg bg-surface-raised border border-hairline overflow-hidden flex items-center justify-center flex-shrink-0">
          {showImage ? (
            <img
              src={deck.image_url}
              alt={deck.deckname}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <Layers size={32} className="text-parchment-faint" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-2xl tracking-wide text-parchment truncate">
            {deck.deckname}
            {deck.partnername && (
              <span className="text-parchment-faint font-body text-lg"> / {deck.partnername}</span>
            )}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <ColorIdentity color={deck.color} size={16} />
            <span className="text-sm text-parchment-dim">· MV {deck.manavalue ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard label={t('stat.matches')} value={totalMatches} />
        <StatCard label={t('stat.wins')} value={wins} tone="win" />
        <StatCard label={t('stat.losses')} value={losses} tone="loss" />
        <StatCard
          label={t('stat.winRate')}
          value={totalMatches > 0 ? `${winRate}%` : '—'}
          tone={totalMatches > 0 ? (winRate >= 50 ? 'win' : 'loss') : undefined}
        />
        <StatCard
          label={t('stat.streak')}
          value={streaks.current > 0 ? `${streaks.currentType === 'win' ? 'W' : 'L'}${streaks.current}` : '—'}
          tone={streaks.currentType === 'win' ? 'win' : streaks.currentType === 'loss' ? 'loss' : undefined}
        />
        <StatCard label={t('stat.avgPlacement')} value={avgPlacement} />
      </div>

      {/* recent form */}
      {totalMatches > 0 && (
        <div className="bg-surface border border-hairline rounded-lg p-5 mb-6">
          <h3 className="text-sm font-medium text-parchment mb-3">{t('analysis.recentForm')}</h3>
          <RecentForm chronologicalResults={chronologicalResults} />
        </div>
      )}

      {/* win rate progression */}
      {totalMatches > 0 && (
        <div className="mb-6">
          <WinRateProgressionChart
            matches={allMatches}
            players={players}
            decks={decks}
            subjectType="deck"
            subjectId={deck.deckid}
          />
        </div>
      )}

      {/* match history */}
      <div className="bg-surface border border-hairline rounded-lg p-5">
        <h2 className="text-sm font-medium text-parchment mb-3">Match history</h2>
        <MatchHistory deckId={parseInt(id)} />
      </div>

    </div>
  )
}

export default DeckDetail