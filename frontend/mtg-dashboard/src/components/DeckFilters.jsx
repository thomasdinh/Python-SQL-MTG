import ColorIdentity from './ColorIdentity'
import { DECK_SORTS } from '../utils/deckFilters'
import { useTranslation } from '../i18n/context'

const COLORS = ['W', 'U', 'B', 'R', 'G']

function DeckFilters ({ players, ownerId, onOwnerChange, colors, onColorsToggle, sort, onSortChange, onClear }) {
  const { t } = useTranslation()
  const active = ownerId || colors.length > 0

  const SORT_LABELS = {
    name: t('players.sortName'),
    winrate: t('players.sortWinrate'),
    matches: t('players.sortMatches'),
    recent: DECK_SORTS.recent.label, // "most recently played" — deck-specific, no player equivalent to reuse
  }

  return (
    <div className="bg-surface border border-hairline rounded-lg p-4 mb-6 flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-parchment-dim">{t('common.player')}</label>
        <select
          value={ownerId ?? ''}
          onChange={(e) => onOwnerChange(e.target.value ? parseInt(e.target.value) : null)}
          className="bg-ink border border-hairline rounded-md px-3 py-2 text-sm text-parchment outline-none focus:border-brass"
        >
          <option value="">{t('common.allPlayers')}</option>
          {players.map((p) => (
            <option key={p.userid} value={p.userid}>{p.firstname} {p.lastname}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-parchment-dim">{t('common.colors')}</label>
        <div className="flex items-center gap-1.5 h-[38px]">
          {COLORS.map((c) => {
            const selected = colors.includes(c)
            return (
              <button
                key={c}
                type="button"
                onClick={() => onColorsToggle(c)}
                title={c}
                className={`rounded-full transition-all ${selected ? 'ring-2 ring-brass ring-offset-2 ring-offset-surface' : 'opacity-50 hover:opacity-100'}`}
              >
                <ColorIdentity color={c} size={20} />
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-parchment-dim">{t('common.sortBy')}</label>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-ink border border-hairline rounded-md px-3 py-2 text-sm text-parchment outline-none focus:border-brass"
        >
          {Object.keys(DECK_SORTS).map((key) => (
            <option key={key} value={key}>{SORT_LABELS[key]}</option>
          ))}
        </select>
      </div>

      {active && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-parchment-faint hover:text-brass transition-colors mb-2"
        >
          {t('common.clearFilters')}
        </button>
      )}
    </div>
  )
}

export default DeckFilters
