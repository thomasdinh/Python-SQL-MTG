import { MATCH_SORTS } from '../utils/matchFilters'
import { useTranslation } from '../i18n/context'

function MatchFilters ({
  players, decks,
  from, to, onFromChange, onToChange,
  minPlayers, onMinPlayersChange,
  deckId, onDeckChange,
  ownerId, onOwnerChange,
  sort, onSortChange,
  onClear,
}) {
  const { t } = useTranslation()
  const active = from || to || minPlayers || deckId || ownerId
  const inputClass = 'bg-ink border border-hairline rounded-md px-3 py-2 text-sm text-parchment outline-none focus:border-brass'

  const SORT_LABELS = {
    date_desc: t('matches.sortNewest'),
    date_asc: t('matches.sortOldest'),
    id_desc: t('matches.sortIdDesc'),
    id_asc: t('matches.sortIdAsc'),
  }

  return (
    <div className="bg-surface border border-hairline rounded-lg p-4 mb-6 flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-parchment-dim">{t('common.from')}</label>
        <input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-parchment-dim">{t('common.to')}</label>
        <input type="date" value={to} onChange={(e) => onToChange(e.target.value)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-parchment-dim">{t('matches.minPlayers')}</label>
        <input
          type="number"
          min="0"
          placeholder="Any"
          value={minPlayers || ''}
          onChange={(e) => onMinPlayersChange(e.target.value ? parseInt(e.target.value) : null)}
          className={`${inputClass} w-24`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-parchment-dim">{t('matches.commander')}</label>
        <select value={deckId ?? ''} onChange={(e) => onDeckChange(e.target.value ? parseInt(e.target.value) : null)} className={inputClass}>
          <option value="">{t('common.anyDeck')}</option>
          {decks.map((d) => (
            <option key={d.deckid} value={d.deckid}>{d.deckname}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-parchment-dim">{t('common.player')}</label>
        <select value={ownerId ?? ''} onChange={(e) => onOwnerChange(e.target.value ? parseInt(e.target.value) : null)} className={inputClass}>
          <option value="">{t('common.anyPlayer')}</option>
          {players.map((p) => (
            <option key={p.userid} value={p.userid}>{p.firstname} {p.lastname}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-parchment-dim">{t('common.sortBy')}</label>
        <select value={sort} onChange={(e) => onSortChange(e.target.value)} className={inputClass}>
          {Object.entries(MATCH_SORTS).map(([key]) => (
            <option key={key} value={key}>{SORT_LABELS[key]}</option>
          ))}
        </select>
      </div>

      {active && (
        <button type="button" onClick={onClear} className="text-xs text-parchment-faint hover:text-brass transition-colors mb-2">
          {t('common.clearFilters')}
        </button>
      )}
    </div>
  )
}

export default MatchFilters
