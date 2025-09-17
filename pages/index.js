import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import MuseumCard from '../components/MuseumCard';
import museumImages from '../lib/museumImages';
import museumNames from '../lib/museumNames';
import museumImageCredits from '../lib/museumImageCredits';
import museumTicketUrls from '../lib/museumTicketUrls';
import { useLanguage } from '../components/LanguageContext';
import { supabase as supabaseClient } from '../lib/supabase';
import SEO from '../components/SEO';

const FEATURED_SLUGS = [
  'van-gogh-museum-amsterdam',
  'rijksmuseum-amsterdam',
  'anne-frank-huis-amsterdam',
  'stedelijk-museum-amsterdam',
  'moco-museum-amsterdam',
  'scheepvaartmuseum-amsterdam',
  'nemo-science-museum-amsterdam',
  'hart-museum-amsterdam',
  'rembrandthuis-amsterdam',
];

function sortMuseums(museums) {
  return [...museums].sort((a, b) => {
    const aIndex = FEATURED_SLUGS.indexOf(a.slug);
    const bIndex = FEATURED_SLUGS.indexOf(b.slug);
    const aFeatured = aIndex !== -1;
    const bFeatured = bIndex !== -1;
    if (aFeatured || bFeatured) {
      if (aFeatured && bFeatured) return aIndex - bIndex;
      return aFeatured ? -1 : 1;
    }
    return a.naam.localeCompare(b.naam);
  });
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

export default function Home() {
  const { t } = useLanguage();
  const router = useRouter();

  const qFromUrl = useMemo(() => {
    const q = router.query?.q;
    return typeof q === 'string' ? q.trim() : '';
  }, [router.query]);

  const hasExposities = useMemo(() => {
    return Object.prototype.hasOwnProperty.call(router.query || {}, 'exposities');
  }, [router.query]);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;
    setQuery(qFromUrl);
  }, [router.isReady, qFromUrl]);

  const expositiesHref = useMemo(() => {
    return query ? `/?q=${encodeURIComponent(query)}&exposities=1` : '/?exposities=1';
  }, [query]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!supabaseClient) {
      setError('missingSupabase');
      return;
    }
    let isCancelled = false;

    const run = async () => {
      try {
        let db = supabaseClient
          .from('musea')
          .select('id, naam, stad, provincie, slug, gratis_toegankelijk, ticket_affiliate_url, website_url')
          .order('naam', { ascending: true });

        if (query) db = db.ilike('naam', `%${query}%`);

        if (hasExposities) {
          const today = todayYMD('Europe/Amsterdam');
          const { data: exRows, error: exError } = await supabaseClient
            .from('exposities')
            .select('museum_id')
            .or(`eind_datum.gte.${today},eind_datum.is.null`);

          if (!exError) {
            const ids = [...new Set((exRows || []).map((e) => e.museum_id))];
            if (ids.length === 0) {
              if (!isCancelled) setResults([]);
              return;
            }
            db = db.in('id', ids);
          }
        }

        const { data, error } = await db;
        if (error) {
          if (!isCancelled) setError('queryFailed');
          return;
        }

        const filtered = (data || []).filter(
          (m) => m.slug !== 'amsterdam-tulip-museum-amsterdam'
        );

        if (!isCancelled) {
          setResults(sortMuseums(filtered));
          setError(null);
        }
      } catch {
        if (!isCancelled) setError('unknown');
      }
    };

    const timer = setTimeout(run, 200);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [router.isReady, query, hasExposities]);

  if (error) {
    return (
      <>
        <SEO title={t('homeTitle')} description={t('homeDescription')} />
        <main className="container" style={{ maxWidth: 800 }}>
          <p>{t('somethingWrong')}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <SEO title={t('homeTitle')} description={t('homeDescription')} />
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
                  imageCredit: museumImageCredits[m.slug],
                  ticketUrl: m.ticket_affiliate_url || museumTicketUrls[m.slug] || m.website_url,
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}