import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import DeckList from '../components/DeckList'
import AddDeckForm from '../components/AddDeckForm'

function Decks () {
  const [decks, setDecks] = useState([])
  const [decksLoading, setDecksLoading] = useState(true)
  const [decksError, setDecksError] = useState(null)
  const [allMatchPlayers, setAllMatchPlayers] = useState([])

  useEffect(() => {
    setDecksLoading(true)
    setDecksError(null)
    setDecks([])
    setAllMatchPlayers([])

    fetch(`http://localhost:8000/decks/`)
      .then(res => {
        if (res.status === 404) return []
        if (!res.ok) throw new Error('Failed to load decks')
        return res.json()
      })
      .then(deckData => {
        setDecks(deckData)
        setDecksLoading(false)
        return Promise.all(
          deckData.map(deck =>
            fetch(`http://localhost:8000/matches_by_deck/${deck.deckid}`)
              .then(res => (res.status === 404 ? [] : res.json()))
              .catch(() => [])
          )
        )
      })
      .then(results => {
        setAllMatchPlayers(results.flat())
      })
      .catch(err => {
        setDecksError(err.message)
        setDecksLoading(false)
      })
  }, [])

  function handleDeckAdded (newDeck) {
    setDecks([...decks, newDeck])
  }

  function handleDeckDeleted (deletedId) {
    setDecks(decks.filter(d => d.deckid !== deletedId))
    setAllMatchPlayers(allMatchPlayers.filter(mp => mp.deck_id !== deletedId))
  }

  const totalWins = allMatchPlayers.filter(mp => mp.won === 1).length
  const totalMatches = allMatchPlayers.length
  const overallWinRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0

  return (
    <div className='p-8'>
      <h1>Decks</h1>
      <div className='grid grid-cols-2 gap-4 mb-6'>
        <div className='bg-white border border-gray-200 rounded-xl p-4'>
          <p className='text-xs text-gray-400 mb-1'>Decks</p>
          <p className='text-2xl font-medium text-gray-900'>{decks.length}</p>
        </div>
        <div className='bg-white border border-gray-200 rounded-xl p-4'>
          <p className='text-xs text-gray-400 mb-1'>Matches</p>
          <p className='text-2xl font-medium text-gray-900'>{100}</p>
        </div>
      </div>
      <DeckList
        decks={decks}
        loading={decksLoading}
        error={decksError}
        onDeckDeleted={handleDeckDeleted}
      />
      <AddDeckForm playerId={parseInt(1)} onDeckAdded={handleDeckAdded} />
    </div>
  )
}

export default Decks
