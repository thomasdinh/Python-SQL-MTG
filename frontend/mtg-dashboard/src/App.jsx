import { useState, useEffect } from 'react'
import PlayerSelector from './components/PlayerSelector'
import DeckList from './components/DeckList'

const API_BASE = 'http://localhost:8000'

function App() {
  const [players, setPlayers] = useState([])
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const [decks, setDecks] = useState([])
  const [decksLoading, setDecksLoading] = useState(false)
  const [decksError, setDecksError] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/users/`)
      .then((res) => res.json())
      .then((data) => setPlayers(data))
    . catch((err) => console.error('Could not load players:', err))
  }, [])

  useEffect(() => {
    if (selectedPlayerId === null) return

    setDecksLoading(true)
    setDecksError(null)
    setDecks([])

    fetch(`${API_BASE}/decks_by_player/${selectedPlayerId}`)
      .then((res) => res.json())
      .then((data) => {
        setDecks(data)
        setDecksLoading(false)
      })
      .catch((err) => {
        setDecksError(err.message)
        setDecksLoading(false)
      })
  }, [selectedPlayerId])

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
          <div className="text-gray-400 text-sm mt-2">
            Select a player to see their decks.
          </div>
        ) : (
          <DeckList
            decks={decks}
            loading={decksLoading}
            error={decksError}
          />
        )}
      </main>

    </div>
  )
}

export default App