import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/players', label: 'Players' },
  { to: '/matches', label: 'Matches' },
  { to: '/decks', label: 'Decks' },
]

function Navbar() {
  const location = useLocation()

  return (
    <nav className="bg-white border-b border-gray-200 px-8 h-14 flex items-center justify-between flex-shrink-0">
      <span className="font-medium text-gray-900">MTG Dashboard</span>
      <div className="flex gap-6">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`text-sm transition-colors ${
              location.pathname === link.to
                ? 'text-gray-900 font-medium'
                : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

export default Navbar