import DeckCard from './components/DeckCard'

const testDecks = [
  { deckid: 1, deckname: 'Atraxa Superfriends', color: 'WUBG', manavalue: 3, ownerid: 1 },
  { deckid: 2, deckname: 'Krenko Goblins', color: 'R', manavalue: 2, ownerid: 1 },
  { deckid: 3, deckname: 'Muldrotha Graveyard', color: 'BUG', manavalue: 4, ownerid: 1 },
]

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-medium text-gray-900 mb-6">
        MTG Commander Dashboard
      </h1>
      <div className="flex flex-cols-2 gap-3 max-w-md">
        {testDecks.map((deck) => (
          <DeckCard key={deck.deckid} deck={deck} />
        ))}
      </div>
    </div>
  )
}

export default App