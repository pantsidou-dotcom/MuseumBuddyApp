import Head from 'next/head';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import museumImages from '../../lib/museumImages';
import museumNames from '../../lib/museumNames';
import ExpositionCard from '../../components/ExpositionCard';
import { useLanguage } from '../../components/LanguageContext';

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
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
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
        </div>

        <h2 className="page-title">{t('expositionsTitle')}</h2>
        {!exposities || exposities.length === 0 ? (
          <p>{t('noExpositions')}</p>
        ) : (
          <ul className="events-list">
            {exposities.map((e) => {
              const periode = [formatDate(e.start_datum, locale), formatDate(e.eind_datum, locale)]
                .filter(Boolean)
                .join(' – ');

              return (
                <li key={e.id}>
                  <ExpositionCard exposition={e} periode={periode} />
                </li>
              );
            })}
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
  let { data: exposities, error: exError } = await supabase
    .from('exposities')
    .select('id, titel, omschrijving, start_datum, eind_datum, bron_url')
    .eq('museum_id', museum.id)
    .or(`eind_datum.gte.${today},eind_datum.is.null`)
    .order('start_datum', { ascending: true, nullsFirst: false });

  if (exError && exError.code === '42703') {
    const retry = await supabase
      .from('exposities')
      .select('id, titel, start_datum, eind_datum, bron_url')
      .eq('museum_id', museum.id)
      .or(`eind_datum.gte.${today},eind_datum.is.null`)
      .order('start_datum', { ascending: true, nullsFirst: false });
    exposities = retry.data;
    exError = retry.error;
  }

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
