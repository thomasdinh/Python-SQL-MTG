import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Layers } from 'lucide-react'
import MatchHistory from '../components/MatchHistory'
import PlacementChart from '../components/charts/PlacementChart'

const API_BASE = 'http://localhost:8000'

function DeckDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [deck, setDeck] = useState(null)
  const [deckLoading, setDeckLoading] = useState(true)
  const [matchPlayers, setMatchPlayers] = useState([])
  const [imgError, setImgError] = useState(false)

  // fetch the deck
  useEffect(() => {
    fetch(`${API_BASE}/decks/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Deck not found')
        return res.json()
      })
      .then((data) => {
        setDeck(data)
        setDeckLoading(false)
      })
      .catch(() => navigate('/decks'))
  }, [id])

  // fetch match players for this deck
  useEffect(() => {
    fetch(`${API_BASE}/matches_by_deck/${id}`)
      .then((res) => {
        if (res.status === 404) return []
        if (!res.ok) throw new Error('Failed to load matches')
        return res.json()
      })
      .then((data) => setMatchPlayers(data))
      .catch(() => setMatchPlayers([]))
  }, [id])

  // derived stats
  const totalMatches = matchPlayers.length
  const wins = matchPlayers.filter((mp) => mp.won === 1).length
  const losses = totalMatches - wins
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

  const avgPlacement = totalMatches > 0
    ? (matchPlayers.reduce((sum, mp) => sum + mp.placement, 0) / totalMatches).toFixed(1)
    : '—'

  if (deckLoading) return <p className="p-8 text-sm text-gray-400">Loading deck...</p>
  if (!deck) return null

  const showImage = deck.image_url && !imgError

  return (
    <div className="max-w-3xl mx-auto p-8">

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      {/* deck header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex gap-5 items-center mb-6">
        <div className="w-20 h-20 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {showImage ? (
            <img
              src={deck.image_url}
              alt={deck.deckname}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <Layers size={32} className="text-purple-400" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-medium text-gray-900 truncate">
            {deck.deckname}
            {deck.partnername && (
              <span className="text-gray-400"> / {deck.partnername}</span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {deck.color ?? 'Colorless'} · MV {deck.manavalue ?? '—'}
          </p>
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Matches</p>
          <p className="text-2xl font-medium text-gray-900">{totalMatches}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Wins</p>
          <p className="text-2xl font-medium text-green-600">{wins}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Losses</p>
          <p className="text-2xl font-medium text-red-500">{losses}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Win rate</p>
          <p className={`text-2xl font-medium ${winRate >= 50 ? 'text-green-600' : 'text-red-500'}`}>
            {totalMatches > 0 ? `${winRate}%` : '—'}
          </p>
        </div>
      </div>

      {/* avg placement */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <p className="text-xs text-gray-400 mb-1">Average placement</p>
        <p className="text-2xl font-medium text-gray-900">{avgPlacement}</p>
      </div>

      {/* placement chart */}
      {totalMatches > 0 && (
        <div className="mb-6">
          <PlacementChart matchPlayers={matchPlayers} />
        </div>
      )}

      {/* match history */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-900 mb-3">Match history</h2>
        <MatchHistory deckId={parseInt(id)} />
      </div>

    </div>
  )
}

export default DeckDetail