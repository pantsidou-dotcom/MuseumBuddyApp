import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import MuseumCard from '../components/MuseumCard';
import museumImages from '../lib/museumImages';
import museumNames from '../lib/museumNames';
import museumImageCredits from '../lib/museumImageCredits';
import { useLanguage } from '../components/LanguageContext';
import { supabase as supabaseClient } from '../lib/supabase';

function todayYMD(tz = 'Europe/Amsterdam') {
  const fmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date());
}

export default function Home({ items, q, hasExposities }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState(q || '');
  const [results, setResults] = useState(items);
  const expositiesHref = query ? `/?q=${encodeURIComponent(query)}&exposities=1` : '/?exposities=1';

  useEffect(() => {
    if (!supabaseClient) return;
    const timer = setTimeout(async () => {
      let db = supabaseClient
        .from('musea')
        .select('id, naam, stad, provincie, slug, gratis_toegankelijk, ticket_affiliate_url, website_url')
        .order('naam', { ascending: true });

      if (query) {
        db = db.ilike('naam', `%${query}%`);
      }

      if (hasExposities) {
        const today = todayYMD('Europe/Amsterdam');
        const { data: exRows, error: exError } = await supabaseClient
          .from('exposities')
          .select('museum_id')
          .or(`eind_datum.gte.${today},eind_datum.is.null`);

        if (!exError) {
          const ids = [...new Set((exRows || []).map((e) => e.museum_id))];
          if (ids.length === 0) {
            setResults([]);
            return;
          }
          db = db.in('id', ids);
        }
      }

      const { data, error } = await db;
      if (!error) {
        setResults(data || []);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, hasExposities]);

  return (
    <>
      <Head>
        <title>{t('homeTitle')}</title>
        <meta name="description" content={t('homeDescription')} />
      </Head>

      <form className="controls" onSubmit={(e) => e.preventDefault()}>
        <div className="control-row">
          <input
            type="text"
            className="input"
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <a href={expositiesHref} className="btn-reset">
            {t('expositions')}
          </a>
          {(query || hasExposities) && (
            <a href="/" className="btn-reset">
              {t('reset')}
            </a>
          )}
        </div>
      </form>

      <p className="count">{results.length} {t('results')}</p>

      {results.length === 0 ? (
        <p>{t('noResults')}</p>
      ) : (
        <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {results.map((m) => (
            <li key={m.id}>
              <MuseumCard
                museum={{
                  id: m.id,
                  slug: m.slug,
                  title: museumNames[m.slug] || m.naam,
                  city: m.stad,
                  province: m.provincie,
                  free: m.gratis_toegankelijk,
                  image: museumImages[m.slug],
                  photographer: museumImageCredits[m.slug],
                  ticketUrl: m.ticket_affiliate_url || m.website_url,
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export async function getServerSideProps({ query }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, anon);

  const q = typeof query.q === 'string' ? query.q.trim() : '';
  const hasExposities = Object.prototype.hasOwnProperty.call(query, 'exposities');

  let db = supabase
    .from('musea')
    .select('id, naam, stad, provincie, slug, gratis_toegankelijk, ticket_affiliate_url, website_url')
    .order('naam', { ascending: true });

  if (q) {
    db = db.ilike('naam', `%${q}%`);
  }

  if (hasExposities) {
    const today = todayYMD('Europe/Amsterdam');
    const { data: exRows, error: exError } = await supabase
      .from('exposities')
      .select('museum_id')
      .or(`eind_datum.gte.${today},eind_datum.is.null`);

    if (exError) {
      return { props: { items: [], q, hasExposities } };
    }

    const ids = [...new Set((exRows || []).map((e) => e.museum_id))];

    if (ids.length === 0) {
      return { props: { items: [], q, hasExposities } };
    }

    db = db.in('id', ids);
  }

  const { data, error } = await db;

  if (error) {
    return { props: { items: [], q, hasExposities } };
  }

  return {
    props: {
      items: data || [],
      q,
      hasExposities,
    },
  };
}
