import { useState } from 'react'
import { Layers } from 'lucide-react'

function TierDeckCard ({ deck, metric, muted = false }) {
  const [imgError, setImgError] = useState(false)
  const showImage = deck.image_url && !imgError

  const statLabel = metric === 'winrate'
    ? (deck.winRate != null ? `${Math.round(deck.winRate * 100)}%` : '—')
    : `${deck.matches}g`

  return (
    <div className={`w-24 flex flex-col items-center gap-1.5 text-center flex-shrink-0 ${muted ? 'opacity-60' : ''}`}>
      <div className="w-20 h-20 rounded-lg bg-surface-raised border border-hairline overflow-hidden flex items-center justify-center">
        {showImage ? (
          <img
            src={deck.image_url}
            alt={deck.deckname}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Layers size={22} className="text-parchment-faint" />
        )}
      </div>
      <p className="text-xs text-parchment font-medium leading-tight line-clamp-2" title={deck.deckname}>
        {deck.deckname}
      </p>
      <p className="text-xs font-mono text-parchment-faint">{statLabel}</p>
    </div>
  )
}

export default TierDeckCard