function PlayerSelector({ players, selectedId, onSelect }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        Players
      </h2>
      {players.map((player) => (
        <button
          key={player.userid}
          onClick={() => onSelect(player.userid)}
          className={`text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
            selectedId === player.userid
              ? 'bg-purple-100 text-purple-900 font-medium'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {player.firstname} {player.lastname}
        </button>
      ))}
    </div>
  )
}

export default PlayerSelector