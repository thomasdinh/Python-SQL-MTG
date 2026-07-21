import { Trophy } from 'lucide-react'
import { useTranslation } from '../i18n/context'

/**
 * Renders a report object from utils/comparisonReport.js: a summary card
 * (title + one auto-generated insight sentence) and a side-by-side
 * metrics table. `better` on each metric (1, 2, or null) highlights
 * whichever value actually is the better one — not every metric has a
 * meaningful "better" (e.g. matches played, tier), so those are left
 * unhighlighted rather than guessing.
 */
function ComparisonReport ({ report, name1, name2 }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface border border-brass/30 rounded-lg p-5">
        <p className="text-xs text-parchment-faint uppercase tracking-wide mb-1">{report.title}</p>
        {report.periodLabel && (
          <p className="text-xs text-parchment-faint mb-3">{report.periodLabel}</p>
        )}
        <p className="text-sm text-parchment leading-relaxed">{report.insight}</p>
      </div>

      <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-hairline text-xs text-parchment-faint uppercase tracking-wide">
              <th className="text-left font-medium py-2 px-4">{t('matches.reportMetric')}</th>
              <th className="text-center font-medium py-2 px-4">{name1}</th>
              <th className="text-center font-medium py-2 px-4">{name2}</th>
            </tr>
          </thead>
          <tbody>
            {report.metrics.map((m) => (
              <tr key={m.label} className="border-b border-hairline last:border-0">
                <td className="py-2.5 px-4 text-parchment-dim">
                  {m.label}
                  {m.note && (
                    <span className="block text-[11px] text-parchment-faint mt-0.5 font-normal">{m.note}</span>
                  )}
                </td>
                <td className={`py-2.5 px-4 text-center font-mono ${m.better === 1 ? 'text-win font-medium' : 'text-parchment'}`}>
                  <span className="inline-flex items-center gap-1 justify-center">
                    {m.better === 1 && <Trophy size={11} className="text-brass" />}
                    {m.value1}
                  </span>
                </td>
                <td className={`py-2.5 px-4 text-center font-mono ${m.better === 2 ? 'text-win font-medium' : 'text-parchment'}`}>
                  <span className="inline-flex items-center gap-1 justify-center">
                    {m.better === 2 && <Trophy size={11} className="text-brass" />}
                    {m.value2}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ComparisonReport