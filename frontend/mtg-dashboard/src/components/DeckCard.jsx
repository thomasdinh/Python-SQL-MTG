function DeckCard({ deck }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 items-center">
      <div className="bg-purple-100 rounded-lg w-14 h-14 flex items-center justify-center text-2xl flex-shrink-0">
        🃏
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-medium text-gray-900 truncate">
          {deck.deckname}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {deck.color ?? 'Colorless'} · MV {deck.manavalue ?? '—'}
        </p>
      </div>
    </div>
  )
}

export default DeckCard