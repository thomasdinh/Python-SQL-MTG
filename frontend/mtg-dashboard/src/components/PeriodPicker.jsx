import { daysAgo } from '../utils/dateRanges'
import { useTranslation } from '../i18n/context'

const PRESET_DAYS = { last30: 30, last90: 90, last180: 180, last365: 365 }

function PeriodPicker ({ label, from, to, onChange }) {
  const { t } = useTranslation()

  function applyPreset (key) {
    if (key === 'custom' || !PRESET_DAYS[key]) return
    onChange({ from: daysAgo(PRESET_DAYS[key]), to: daysAgo(0) })
  }

  const inputClass = 'bg-ink border border-hairline rounded-md px-3 py-2 text-sm text-parchment outline-none focus:border-brass'

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-parchment-dim font-medium">{label}</span>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-parchment-faint">Preset</label>
          <select onChange={(e) => applyPreset(e.target.value)} defaultValue="custom" className={inputClass}>
            <option value="custom">{t('matches.compareCustom')}</option>
            <option value="last30">{t('matches.compareLast', { n: 30 })}</option>
            <option value="last90">{t('matches.compareLast', { n: 90 })}</option>
            <option value="last180">{t('matches.compareLast', { n: 180 })}</option>
            <option value="last365">{t('matches.compareLast', { n: 365 })}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-parchment-faint">{t('common.from')}</label>
          <input
            type="date"
            value={from}
            onChange={(e) => onChange({ from: e.target.value, to })}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-parchment-faint">{t('common.to')}</label>
          <input
            type="date"
            value={to}
            onChange={(e) => onChange({ from, to: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  )
}

export default PeriodPicker