function AddButton ({ onClick, hoverText }) {
  return (
    <button
      onClick={() => onClick()}
      className='group flex items-center gap-2 m-1 cursor-pointer'
      title={hoverText}
    >
      <div className='border border-hairline-2 w-9 h-9 rounded-full bg-surface flex items-center justify-center flex-shrink-0 text-parchment-dim transition-colors group-hover:border-brass group-hover:text-brass'>
        +
      </div>
      {hoverText && (
        <span className='text-sm text-parchment-dim transition-colors group-hover:text-parchment'>
          {hoverText}
        </span>
      )}
    </button>
  )
}

export default AddButton
