function AddButton ({ onClick, hoverText }) {
  return (
    <button
      onClick={() => onClick()}
      className='rounded-full m-5 flex items-center gap-2 hover:border-purple-400 hover:border-3 hover:shadow-sm transition-all text-left cursor-pointer'
      title={hoverText}
    >
      <div className='border border-purple-300 w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0'>
        +
      </div>
    </button>
  )
}

export default AddButton
