import Image from 'next/image';
import SEO from '../components/SEO';
import MuseumCard from '../components/MuseumCard';
import ExpositionCard from '../components/ExpositionCard';
import { useFavorites } from '../components/FavoritesContext';
import { useLanguage } from '../components/LanguageContext';
import Button from '../components/ui/Button';
import createBlurDataUrl from '../lib/createBlurDataUrl';

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const { t } = useLanguage();

  const museumFavorites = favorites.filter((f) => f.type === 'museum');
  const expositionFavorites = favorites.filter((f) => f.type === 'exposition');
  const favoritesBlurDataURL = createBlurDataUrl('#cbd5f5');

  return (
    <>
      <SEO title={t('favoritesTitle')} />
      <h1 className="page-title">{t('favoritesTitle')}</h1>
      {favorites.length === 0 ? (
        <section
          className="favorites-empty-state"
          aria-labelledby="favorites-empty-heading"
        >
          <div className="favorites-empty-state__media">
            <Image
              src="/images/favorites-empty.svg"
              alt={t('favoritesEmptyIllustrationAlt')}
              width={360}
              height={240}
              priority
              placeholder="blur"
              blurDataURL={favoritesBlurDataURL}
            />
          </div>
          <div className="favorites-empty-state__content">
            <h2 id="favorites-empty-heading">{t('favoritesEmptyTitle')}</h2>
            <p>{t('favoritesEmptyBody')}</p>
            <Button href="/" variant="primary" size="lg" className="favorites-empty-state__cta" prefetch>
              {t('favoritesEmptyCta')}
            </Button>
          </div>
        </section>
      ) : (
        <>
          {museumFavorites.length > 0 && (
            <>
              <h2 className="page-title">{t('favoriteMuseums')}</h2>
              <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {museumFavorites.map((m, index) => (
                  <li key={`m-${m.id}`}>
                    <MuseumCard museum={m} priority={index < 3} />
                  </li>
                ))}
              </ul>
            </>
          )}
          {expositionFavorites.length > 0 && (
            <>
              <h2 className="page-title">{t('favoriteExhibitions')}</h2>
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
