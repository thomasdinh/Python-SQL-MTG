import { useState, useEffect } from 'react'
import DeckList from '../components/DeckList'
import AddDeckForm from '../components/AddDeckForm'

const API_BASE = 'http://localhost:8000'

function Decks() {
  const [decks, setDecks] = useState([])
  const [decksLoading, setDecksLoading] = useState(true)
  const [decksError, setDecksError] = useState(null)
  const [allMatchPlayers, setAllMatchPlayers] = useState([])
  const [players, setPlayers] = useState([])
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const [matches, setMatches] = useState([])

  // fetch all players for the selector
  useEffect(() => {
    fetch(`${API_BASE}/users/`)
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data)
        if (data.length > 0) setSelectedPlayerId(data[0].userid)
      })
      .catch((err) => console.error('Could not load players:', err))
  }, [])

  // fetch all matches for the stats  useEffect(() => {
  useEffect(() => {
    fetch(`${API_BASE}/matches/`)
      .then((res) => res.json())
      .then((data) => setMatches(data))
      .catch((err) => console.error('Could not load matches:', err))
  }, [])  

  // fetch all decks
  useEffect(() => {
    setDecksLoading(true)
    setDecksError(null)
    setDecks([])
    setAllMatchPlayers([])

    fetch(`${API_BASE}/decks/`)
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
              .then((res) => (res.status === 404 ? [] : res.json()))
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
  }, [])

  function handleDeckAdded(newDeck) {
    setDecks([...decks, newDeck])
  }

  function handleDeckDeleted(deletedId) {
    setDecks(decks.filter((d) => d.deckid !== deletedId))
    setAllMatchPlayers(allMatchPlayers.filter((mp) => mp.deck_id !== deletedId))
  }

  const totalMatches = allMatchPlayers.length
  const totalWins = allMatchPlayers.filter((mp) => mp.won === 1).length
  const overallWinRate = totalMatches > 0
    ? Math.round((totalWins / totalMatches) * 100)
    : 0

  return (
    <div className="p-8 ">
      <h1 className="text-2xl font-medium text-gray-900 mb-6">Decks</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Decks</p>
          <p className="text-2xl font-medium text-gray-900">{decks.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Matches</p>
          <p className="text-2xl font-medium text-gray-900">{matches ? matches.length : 0}</p>
        </div>
      </div>

      <DeckList
        decks={decks}
        loading={decksLoading}
        error={decksError}
        onDeckDeleted={handleDeckDeleted}
      />

      <div className="mt-8 bg-white border border-gray-200 rounded-xl p-5">
        

        <div className="flex flex-col gap-1 mb-4">
          <label className="text-xs text-gray-500">Player</label>
          <select
            value={selectedPlayerId ?? ''}
            onChange={(e) => setSelectedPlayerId(parseInt(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-400 bg-white"
          >
            <option value="" disabled>Select a player</option>
            {players.map((player) => (
              <option key={player.userid} value={player.userid}>
                {player.firstname} {player.lastname}
              </option>
            ))}
          </select>
        </div>

        {selectedPlayerId && (
          <AddDeckForm
            playerId={selectedPlayerId}
            onDeckAdded={handleDeckAdded}
            hideTitle
          />
        )}
      </div>
    </div>
  )
}

export default Decks