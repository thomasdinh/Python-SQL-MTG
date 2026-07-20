import { RotateCcw } from 'lucide-react'
import { TIER_LEVELS } from '../utils/deckTiers'
import { useTranslation } from '../i18n/context'

const EDITABLE_TIERS = TIER_LEVELS.slice(0, 8) // SSS..E — F has no threshold of its own

function TierThresholdEditor ({ thresholds, defaults, onChange, label }) {
  const { t } = useTranslation()
  const isDefault = thresholds.every((v, i) => v === defaults[i])

  function updateAt (index, rawValue) {
    const pct = Math.max(0, Math.min(100, Number(rawValue) || 0))
    const next = [...thresholds]
    next[index] = pct / 100
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-parchment-dim">{label}</label>
        {!isDefault && (
          <button
            type="button"
            onClick={() => onChange(defaults)}
            className="flex items-center gap-1 text-xs text-parchment-faint hover:text-brass transition-colors"
          >
            <RotateCcw size={11} />
            {t('common.reset')}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {EDITABLE_TIERS.map((tier, i) => (
          <div key={tier} className="flex flex-col gap-1">
            <span className="text-[10px] text-parchment-faint text-center">{tier} \u2265</span>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={Math.round(thresholds[i] * 100)}
                onChange={(e) => updateAt(i, e.target.value)}
                className="bg-ink border border-hairline rounded-md pl-2 pr-5 py-1.5 text-xs text-parchment outline-none focus:border-brass w-16"
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-parchment-faint pointer-events-none">%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TierThresholdEditor