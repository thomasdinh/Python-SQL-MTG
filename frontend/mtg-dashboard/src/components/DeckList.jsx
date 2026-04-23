import DeckCard from './DeckCard'

function DeckList({ decks, loading, error, onDeckDeleted }) {
  if (loading) return <p className="text-gray-400 text-sm">Loading decks...</p>
  if (error)   return <p className="text-red-400 text-sm">Error: {error}</p>
  if (decks.length === 0) return <p className="text-gray-400 text-sm">No decks found.</p>

  return (
    <div className="flex flex-col gap-3">
      {decks.map((deck) => (
        <DeckCard
          key={deck.deckid}
          deck={deck}
          onDeckDeleted={onDeckDeleted}
        />
      ))}
    </div>
  )
}

export default DeckList