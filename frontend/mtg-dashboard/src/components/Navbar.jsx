import { Link, useLocation } from 'react-router-dom'
import { Settings as SettingsIcon } from 'lucide-react'
import { isCustomApiBase } from '../config'
import { useTranslation } from '../i18n/context'

function Navbar() {
  const location = useLocation()
  const customServer = isCustomApiBase()
  const { t } = useTranslation()

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/players', label: t('nav.players') },
    { to: '/matches', label: t('nav.matches') },
    { to: '/decks', label: t('nav.decks') },
    { to: '/tierlist', label: t('nav.tierlist') },
  ]

  return (
    <nav className="bg-ink-2 border-b border-hairline px-6 sm:px-8 h-16 flex items-center justify-between flex-shrink-0">
      <Link to="/" className="flex items-center gap-2.5">
        <svg width="22" height="22" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="7.25" fill="var(--color-brass)" stroke="rgba(0,0,0,0.35)" />
          <path d="M8 3.2 9.3 6.7 12.8 8 9.3 9.3 8 12.8 6.7 9.3 3.2 8 6.7 6.7z" fill="#14181a" />
        </svg>
        <span className="font-display text-lg tracking-wide text-parchment">
          The Pod Ledger
        </span>
      </Link>
      <div className="flex items-center gap-1">
        {links.map((link) => {
          const active = location.pathname === link.to
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`relative px-3 py-2 text-sm transition-colors ${
                active
                  ? 'text-parchment'
                  : 'text-parchment-faint hover:text-parchment-dim'
              }`}
            >
              {link.label}
              {active && (
                <span className="absolute left-3 right-3 -bottom-[1px] h-[2px] bg-brass rounded-full" />
              )}
            </Link>
          )
        })}
        <Link
          to="/settings"
          title={customServer ? `${t('nav.settings')} (custom server active)` : t('nav.settings')}
          className={`relative ml-1 p-2 rounded-md transition-colors ${
            location.pathname === '/settings'
              ? 'text-parchment bg-surface-raised'
              : 'text-parchment-faint hover:text-parchment hover:bg-surface-raised'
          }`}
        >
          <SettingsIcon size={16} />
          {customServer && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brass" />
          )}
        </Link>
      </div>
    </nav>
  )
}

export default Navbar
