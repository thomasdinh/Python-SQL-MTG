import DeckTierList from '../components/DeckTierList'
import { useDecks } from '../hooks/useDecks'
import { useMatchesDetailed } from '../hooks/useMatches'
import { useTranslation } from '../i18n/context'

function TierList () {
  const { t } = useTranslation()
  const { data: decks = [], isLoading: decksLoading } = useDecks()
  const { data: matches = [], isLoading: matchesLoading } = useMatchesDetailed()
  const loading = decksLoading || matchesLoading

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl tracking-wide text-parchment mb-6">{t('tierlist.title')}</h1>

      {loading ? (
        <p className="text-sm text-parchment-faint">{t('common.loadingDecks')}</p>
      ) : (
        <DeckTierList decks={decks} matches={matches} />
      )}
    </div>
  )
}

export default TierList