import { useState } from 'react'
import { Layers, TrendingUp, TrendingDown } from 'lucide-react'

function TierDeckCard ({ deck, metric, muted = false, movement }) {
  const [imgError, setImgError] = useState(false)
  const showImage = deck.image_url && !imgError

  const statLabel = metric === 'winrate'
    ? (deck.winRate != null ? `${Math.round(deck.winRate * 100)}%` : '—')
    : `${deck.matches}g`

  return (
    <div className={`w-24 flex flex-col items-center gap-1.5 text-center flex-shrink-0 ${muted ? 'opacity-60' : ''}`}>
      <div className="relative w-20 h-20 rounded-lg bg-surface-raised border border-hairline overflow-hidden flex items-center justify-center">
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
        {movement > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-ink/80 rounded-full p-0.5" title={`+${movement}`}>
            <TrendingUp size={12} className="text-win" />
          </span>
        )}
        {movement < 0 && (
          <span className="absolute top-0.5 right-0.5 bg-ink/80 rounded-full p-0.5" title={`${movement}`}>
            <TrendingDown size={12} className="text-loss" />
          </span>
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