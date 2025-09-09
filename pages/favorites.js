import Head from 'next/head';
import MuseumCard from '../components/MuseumCard';
import { useFavorites } from '../components/FavoritesContext';
import { useLanguage } from '../components/LanguageContext';

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const { t } = useLanguage();

  return (
    <>
      <Head>
        <title>{t('favoritesTitle')}</title>
      </Head>
      <h1 className="page-title">{t('favoritesTitle')}</h1>
      {favorites.length === 0 ? (
        <p>{t('noFavorites')}</p>
      ) : (
        <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {favorites.map((m) => (
            <li key={m.id}>
              <MuseumCard museum={m} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
