import { useState, useEffect } from 'react'
import PlayerSelector from './components/PlayerSelector'
import DeckList from './components/DeckList'
import AddDeckForm from './components/AddDeckForm'
import WinRateChart from './components/WinRateChart'

const API_BASE = 'http://localhost:8000'

function App() {
  const [players, setPlayers] = useState([])
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const [decks, setDecks] = useState([])
  const [decksLoading, setDecksLoading] = useState(false)
  const [decksError, setDecksError] = useState(null)
  const [allMatchPlayers, setAllMatchPlayers] = useState([])

  useEffect(() => {
    fetch(`${API_BASE}/users/`)
      .then((res) => res.json())
      .then((data) => setPlayers(data))
      .catch((err) => console.error('Could not load players:', err))
  }, [])

  useEffect(() => {
    if (selectedPlayerId === null) return
    setDecksLoading(true)
    setDecksError(null)
    setDecks([])
    setAllMatchPlayers([])

    fetch(`${API_BASE}/decks_by_player/${selectedPlayerId}`)
      .then((res) => {
        if (res.status === 404) return []
        if (!res.ok) throw new Error('Failed to load decks')
        return res.json()
      })
      .then((deckData) => {
        setDecks(deckData)
        setDecksLoading(false)

        // fetch all match players for every deck in parallel
        return Promise.all(
          deckData.map((deck) =>
            fetch(`${API_BASE}/matches_by_deck/${deck.deckid}`)
              .then((res) => res.status === 404 ? [] : res.json())
              .catch(() => [])
          )
        )
      })
      .then((results) => {
        const flat = results.flat()
        setAllMatchPlayers(flat)
      })
      .catch((err) => {
        setDecksError(err.message)
        setDecksLoading(false)
      })
  }, [selectedPlayerId])

  function handleDeckAdded(newDeck) {
    setDecks([...decks, newDeck])
  }

  function handleDeckDeleted(deletedId) {
    setDecks(decks.filter((deck) => deck.deckid !== deletedId))
    setAllMatchPlayers(allMatchPlayers.filter((mp) => mp.deck_id !== deletedId))
  }

  const totalWins = allMatchPlayers.filter((mp) => mp.won === 1).length
  const totalMatches = allMatchPlayers.length
  const overallWinRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0


  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-56 bg-white border-r border-gray-200 p-4 flex-shrink-0">
        <p className="text-lg font-medium text-gray-900 mb-6">MTG Dashboard</p>
        <PlayerSelector
          players={players}
          selectedId={selectedPlayerId}
          onSelect={setSelectedPlayerId}
        />
      </aside>

      <main className="flex-1 p-8">
        {selectedPlayerId === null ? (
          <p className="text-gray-400 text-sm">Select a player to see their decks.</p>
        ) : (
          <>
            <WinRateChart decks={decks} matchPlayers={allMatchPlayers} />
            
            <AddDeckForm
              playerId={selectedPlayerId}
              onDeckAdded={handleDeckAdded}
            />
            <DeckList
              decks={decks}
              loading={decksLoading}
              error={decksError}
              onDeckDeleted={handleDeckDeleted}
            />
          </>
        )}
      </main>
    </div>
  )
}

export default App