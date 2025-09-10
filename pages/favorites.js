import Head from 'next/head';
import MuseumCard from '../components/MuseumCard';
import ExpositionCard from '../components/ExpositionCard';
import { useFavorites } from '../components/FavoritesContext';
import { useLanguage } from '../components/LanguageContext';

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const { t } = useLanguage();

  const museumFavorites = favorites.filter((f) => f.type === 'museum');
  const expositionFavorites = favorites.filter((f) => f.type === 'exposition');

  return (
    <>
      <Head>
        <title>{t('favoritesTitle')}</title>
      </Head>
      <h1 className="page-title">{t('favoritesTitle')}</h1>
      {favorites.length === 0 ? (
        <p>{t('noFavorites')}</p>
      ) : (
        <>
          {museumFavorites.length > 0 && (
            <>
              <h2 className="page-title">{t('favoriteMuseums')}</h2>
              <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {museumFavorites.map((m) => (
                  <li key={`m-${m.id}`}>
                    <MuseumCard museum={m} />
                  </li>
                ))}
              </ul>
            </>
          )}
          {expositionFavorites.length > 0 && (
            <>
              <h2 className="page-title">{t('favoriteExpositions')}</h2>
              <ul className="events-list">
                {expositionFavorites.map((e) => (
                  <li key={`e-${e.id}`}>
                    <ExpositionCard exposition={e} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </>
  );
}
