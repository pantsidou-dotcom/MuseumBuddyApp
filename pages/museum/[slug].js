import Head from 'next/head';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import museumImages from '../../lib/museumImages';
import museumNames from '../../lib/museumNames';
import museumImageCredits from '../../lib/museumImageCredits';
import ExpositionCard from '../../components/ExpositionCard';
import { useLanguage } from '../../components/LanguageContext';
import { useFavorites } from '../../components/FavoritesContext';

function formatDate(d, locale) {
  if (!d) return '';
  try {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return d;
  }
}

function todayYMD(tz = 'Europe/Amsterdam') {
  const fmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date());
}

export default function MuseumDetail({ museum, exposities, error }) {
  const { lang, t } = useLanguage();
  const { favorites, toggleFavorite } = useFavorites();
  const locale = lang === 'en' ? 'en-GB' : 'nl-NL';

  if (error) {
    return (
      <>
        <Head>
          <title>Museum — MuseumBuddy</title>
        </Head>
        <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
          <p>{t('somethingWrong')}</p>
          <a href="/" style={{ display: 'inline-block', marginTop: '1rem' }}>
            &larr; {t('back')}
          </a>
        </main>
      </>
    );
  }

  const name = museum ? museumNames[museum.slug] || museum.naam : '';
  const museumItem =
    museum && name
      ? { id: museum.id, slug: museum.slug, title: name, image: museumImages[museum.slug] }
      : null;
  const isFavorite = museumItem
    ? favorites.some((f) => f.id === museum.id && f.type === 'museum')
    : false;

  const handleFavorite = () => {
    if (museumItem) {
      toggleFavorite({ ...museumItem, type: 'museum' });
    }
  };

  return (
    <>
      <Head>
        <title>{name ? `${name} — MuseumBuddy` : 'Museum — MuseumBuddy'}</title>
        <meta name="description" content={t('museumDescription', { name: name || 'museum' })} />
      </Head>

      <main className="container" style={{ maxWidth: 800 }}>
        <a href="/" className="backlink" style={{ display: 'inline-block', marginBottom: 16 }}>
          &larr; {t('back')}
        </a>

        <h1 className="detail-title">{name}</h1>
        <p className="detail-sub">
          {[museum.stad, museum.provincie].filter(Boolean).join(', ')}
        </p>

        {museumImages[museum.slug] && (
          <div style={{ position: 'relative', width: '100%', height: 300, margin: '16px 0' }}>
            <Image
              src={museumImages[museum.slug]}
              alt={name}
              fill
              sizes="(max-width: 800px) 100vw, 800px"
              style={{ objectFit: 'cover' }}
            />
            <div className="image-credit">
              {t('museumLabel')}: {name} — {t('photographerLabel')}: {museumImageCredits[museum.slug] || t('unknown')}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '16px 0' }}>
          {museum.website_url && (
            <a
              href={museum.website_url}
              target="_blank"
              rel="noreferrer"
              className="btn-reset"
            >
              {t('website')}
            </a>
          )}
          {museum.ticket_affiliate_url && (
            <a
              href={museum.ticket_affiliate_url}
              target="_blank"
              rel="noreferrer"
              className="btn-reset"
            >
              {t('tickets')}
            </a>
          )}
          {museumItem && (
            <button
              className={`icon-button large${isFavorite ? ' favorited' : ''}`}
              aria-label={t('save')}
              aria-pressed={isFavorite}
              onClick={handleFavorite}
            >
              <svg
                viewBox="0 0 24 24"
                fill={isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 8.25c0 4.556-9 11.25-9 11.25S3 12.806 3 8.25a5.25 5.25 0 0 1 9-3.676A5.25 5.25 0 0 1 21 8.25Z" />
              </svg>
            </button>
          )}
        </div>

        <h2 className="page-title">{t('expositionsTitle')}</h2>
        {!exposities || exposities.length === 0 ? (
          <p>{t('noExpositions')}</p>
        ) : (
          <ul className="events-list">
            {exposities.map((e) => (
              <li key={e.id}>
                <ExpositionCard exposition={e} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

export async function getServerSideProps(context) {
  const { slug } = context.params || {};
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    context.res.statusCode = 500;
    return { props: { museum: null, exposities: [], error: true } };
  }

  const supabase = createClient(url, anon);

  const { data: museum, error: museumError } = await supabase
    .from('musea')
    .select('id, naam, stad, provincie, website_url, ticket_affiliate_url, slug')
    .eq('slug', slug)
    .single();

  if (museumError) {
    if (museumError.code === 'PGRST116') {
      return { notFound: true };
    }
    context.res.statusCode = 500;
    return { props: { museum: null, exposities: [], error: true } };
  }

  const today = todayYMD('Europe/Amsterdam'); // "YYYY-MM-DD"
  const { data: exposities, error: exError } = await supabase
    .from('exposities')
    .select('id, titel, start_datum, eind_datum, bron_url')
    .eq('museum_id', museum.id)
    .or(`eind_datum.gte.${today},eind_datum.is.null`)
    .order('start_datum', { ascending: true, nullsFirst: false });

  if (exError) {
    context.res.statusCode = 500;
    return { props: { museum: null, exposities: [], error: true } };
  }

  return {
    props: {
      museum,
      exposities: exposities || [],
      error: false,
    },
  };
}
