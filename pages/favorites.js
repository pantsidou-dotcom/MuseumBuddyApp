import Head from 'next/head';
import MuseumCard from '../components/MuseumCard';
import { useFavorites } from '../components/FavoritesContext';

export default function FavoritesPage() {
  const { favorites } = useFavorites();

  return (
    <>
      <Head>
        <title>Favorieten</title>
      </Head>
      <h1 className="page-title">Favorieten</h1>
      {favorites.length === 0 ? (
        <p>Geen favorieten.</p>
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
