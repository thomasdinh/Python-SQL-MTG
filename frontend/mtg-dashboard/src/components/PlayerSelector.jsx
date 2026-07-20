function PlayerSelector({ players, selectedId, onSelect }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-medium text-parchment-faint uppercase tracking-wide">
        Players
      </h2>
      {players.map((player) => (
        <button
          key={player.userid}
          onClick={() => onSelect(player.userid)}
          className={`text-left px-4 py-2.5 rounded-md text-sm transition-colors ${
            selectedId === player.userid
              ? 'bg-brass/15 text-brass font-medium'
              : 'text-parchment-dim hover:bg-surface-raised'
          }`}
        >
          {player.firstname} {player.lastname}
        </button>
      ))}
    </div>
  )
}

export default PlayerSelector
