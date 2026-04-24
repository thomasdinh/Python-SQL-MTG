import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import DeckList from '../components/DeckList'
import AddDeckForm from '../components/AddDeckForm'
import WinRateChart from '../components/WinRateChart'
import PlacementChart from '../components/PlacementChart'

const API_BASE = 'http://localhost:8000'

function PlayerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [player, setPlayer] = useState(null)
  const [decks, setDecks] = useState([])
  const [decksLoading, setDecksLoading] = useState(true)
  const [decksError, setDecksError] = useState(null)
  const [allMatchPlayers, setAllMatchPlayers] = useState([])

  useEffect(() => {
    fetch(`${API_BASE}/users/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Player not found')
        return res.json()
      })
      .then((data) => setPlayer(data))
      .catch(() => navigate('/players'))
  }, [id])

  useEffect(() => {
    if (!id) return
    setDecksLoading(true)
    setDecksError(null)
    setDecks([])
    setAllMatchPlayers([])

    fetch(`${API_BASE}/decks_by_player/${id}`)
      .then((res) => {
        if (res.status === 404) return []
        if (!res.ok) throw new Error('Failed to load decks')
        return res.json()
      })
      .then((deckData) => {
        setDecks(deckData)
        setDecksLoading(false)
        return Promise.all(
          deckData.map((deck) =>
            fetch(`${API_BASE}/matches_by_deck/${deck.deckid}`)
              .then((res) => res.status === 404 ? [] : res.json())
              .catch(() => [])
          )
        )
      })
      .then((results) => {
        setAllMatchPlayers(results.flat())
      })
      .catch((err) => {
        setDecksError(err.message)
        setDecksLoading(false)
      })
  }, [id])

  function handleDeckAdded(newDeck) {
    setDecks([...decks, newDeck])
  }

  function handleDeckDeleted(deletedId) {
    setDecks(decks.filter((d) => d.deckid !== deletedId))
    setAllMatchPlayers(allMatchPlayers.filter((mp) => mp.deck_id !== deletedId))
  }

  const totalWins = allMatchPlayers.filter((mp) => mp.won === 1).length
  const totalMatches = allMatchPlayers.length
  const overallWinRate = totalMatches > 0
    ? Math.round((totalWins / totalMatches) * 100)
    : 0

  return (
    <div className="max-w-3xl mx-auto p-8">

      <button
        onClick={() => navigate('/players')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        All players
      </button>

      {player && (
        <h1 className="text-2xl font-medium text-gray-900 mb-6">
          {player.firstname} {player.lastname}
        </h1>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Decks</p>
          <p className="text-2xl font-medium text-gray-900">{decks.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Matches</p>
          <p className="text-2xl font-medium text-gray-900">{totalMatches}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Win rate</p>
          <p className={`text-2xl font-medium ${overallWinRate >= 50 ? 'text-green-600' : 'text-red-500'}`}>
            {totalMatches > 0 ? `${overallWinRate}%` : '—'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <WinRateChart decks={decks} matchPlayers={allMatchPlayers} />
        <PlacementChart matchPlayers={allMatchPlayers} />
        <AddDeckForm playerId={parseInt(id)} onDeckAdded={handleDeckAdded} />
        <DeckList
          decks={decks}
          loading={decksLoading}
          error={decksError}
          onDeckDeleted={handleDeckDeleted}
        />
      </div>

    </div>
  )
}

export default PlayerDetail