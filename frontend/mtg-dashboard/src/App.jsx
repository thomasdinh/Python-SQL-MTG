import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Players from './pages/Players'
import PlayerDetail from './pages/PlayerDetail'
import Matches from './pages/Matches'
import Decks from './pages/Decks'
import DeckDetail from './pages/DeckDetail'
import TierList from './pages/TierList'
import Settings from './pages/Settings'
import { applyTheme, watchSystemTheme } from './theme'

function App() {
  // Re-apply on boot (the inline script in index.html already avoided the
  // initial flash; this makes sure React-driven parts, like the derived
  // --color-brass-dim shade, are in sync too) and keep 'system' mode synced
  // if the OS theme changes while the app is open.
  useEffect(() => {
    applyTheme()
    return watchSystemTheme()
  }, [])

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/players" element={<Players />} />
        <Route path="/players/:id" element={<PlayerDetail />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/decks" element={<Decks />} />
        <Route path="/decks/:id" element={<DeckDetail />} />
        <Route path="/tierlist" element={<TierList />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  )
}

export default App