import DeckCard from './DeckCard'
import { useTranslation } from '../i18n/context'

function DeckList({ decks, loading, error, onDeckDeleted, onDeckUpdated }) {
  const { t } = useTranslation()
  if (loading) return <p className="text-parchment-faint text-sm">{t('common.loadingDecks')}</p>
  if (error)   return <p className="text-loss text-sm">Error: {error}</p>
  if (decks.length === 0) return <p className="text-parchment-faint text-sm">{t('common.noDecksFound')}</p>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem'}}>
      {decks.map((deck) => (
        <DeckCard
          key={deck.deckid}
          deck={deck}
          onDeckDeleted={onDeckDeleted}
          onDeckUpdated={onDeckUpdated}
        />
      ))}
    </div>
  )
}

export default DeckList