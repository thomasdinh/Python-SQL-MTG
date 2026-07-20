import { Link } from 'react-router-dom'
import ColorIdentity from '../components/ColorIdentity'
import { useTranslation } from '../i18n/context'

function Home() {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto p-8 sm:p-12">
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <ColorIdentity color="WUBRG" size={18} />
        </div>
        <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-parchment mb-4 leading-tight">
          {t('home.title')}
        </h1>
        <p className="text-parchment-dim max-w-lg leading-relaxed">
          {t('home.tagline')}
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Link
          to="/players"
          className="bg-surface border border-hairline rounded-lg p-5 hover:border-brass-dim transition-colors"
        >
          <p className="text-xs text-parchment-faint uppercase tracking-wide mb-2">{t('home.step1')}</p>
          <h2 className="text-sm font-medium text-parchment mb-1">{t('home.step1Heading')}</h2>
          <p className="text-xs text-parchment-dim leading-relaxed">{t('home.step1Body')}</p>
        </Link>
        <Link
          to="/decks"
          className="bg-surface border border-hairline rounded-lg p-5 hover:border-brass-dim transition-colors"
        >
          <p className="text-xs text-parchment-faint uppercase tracking-wide mb-2">{t('home.step2')}</p>
          <h2 className="text-sm font-medium text-parchment mb-1">{t('home.step2Heading')}</h2>
          <p className="text-xs text-parchment-dim leading-relaxed">{t('home.step2Body')}</p>
        </Link>
        <Link
          to="/matches"
          className="bg-surface border border-hairline rounded-lg p-5 hover:border-brass-dim transition-colors"
        >
          <p className="text-xs text-parchment-faint uppercase tracking-wide mb-2">{t('home.step3')}</p>
          <h2 className="text-sm font-medium text-parchment mb-1">{t('home.step3Heading')}</h2>
          <p className="text-xs text-parchment-dim leading-relaxed">{t('home.step3Body')}</p>
        </Link>
      </div>

      <div className="bg-ink-2 border border-hairline rounded-lg p-5">
        <h2 className="text-sm font-medium text-parchment mb-1">{t('home.aboutTitle')}</h2>
        <p className="text-sm text-parchment-dim leading-relaxed">
          {t('home.aboutBody')}
        </p>
      </div>
    </div>
  )
}

export default Home
