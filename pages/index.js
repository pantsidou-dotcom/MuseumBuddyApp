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

export default function Home({ initialMuseums = [], initialError = null }) {
  const { t } = useLanguage();
  const router = useRouter();

  const qFromUrl = useMemo(() => {
    const q = router.query?.q;
    return typeof q === 'string' ? q.trim() : '';
  }, [router.query]);

  const hasExposities = useMemo(() => {
    return Object.prototype.hasOwnProperty.call(router.query || {}, 'exposities');
  }, [router.query]);

  const initialMuseumsSorted = useMemo(() => sortMuseums(initialMuseums || []), [initialMuseums]);
  const shouldUseInitialData = !qFromUrl && !hasExposities && initialMuseumsSorted.length > 0;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState(() => (shouldUseInitialData ? initialMuseumsSorted : []));
  const [error, setError] = useState(() => (shouldUseInitialData ? initialError : null));
  const [sheetOpen, setSheetOpen] = useState(false);
  const appliedFilters = useMemo(
    () => ({
      inRegion: false,
      temporarily: hasExposities,
      childFriendly: false,
      free: false,
    }),
    [hasExposities]
  );
  const [draftFilters, setDraftFilters] = useState(appliedFilters);

  useEffect(() => {
    setDraftFilters(appliedFilters);
  }, [appliedFilters]);

  useEffect(() => {
    if (!router.isReady) return;
    setQuery(qFromUrl);
  }, [router.isReady, qFromUrl]);

  const openSheet = () => {
    setDraftFilters(appliedFilters);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setDraftFilters(appliedFilters);
  };

  const applyFilters = () => {
    const nextQuery = {};
    if (query) nextQuery.q = query;
    if (draftFilters.temporarily) nextQuery.exposities = '1';
    router.push({ pathname: '/', query: nextQuery }, undefined, { shallow: false });
    setSheetOpen(false);
  };

  const hasActiveFilters = appliedFilters.temporarily;

  const resetAll = () => {
    setQuery('');
    router.push('/', undefined, { shallow: false });
  };

  useEffect(() => {
    if (!router.isReady) return;

    const usingDefaultFilters = !query && !hasExposities;

    if (usingDefaultFilters && initialMuseumsSorted.length > 0) {
      setResults(initialMuseumsSorted);
      setError(initialError ?? null);
      return;
    }

    if (!supabaseClient) {
      setResults([]);
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
              if (!isCancelled) {
                setResults([]);
                setError(null);
              }
              return;
            }
            db = db.in('id', ids);
          }
        }

        const { data, error: queryError } = await db;
        if (queryError) {
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

    const delay = query || hasExposities ? 200 : 0;
    const timer = setTimeout(run, delay);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [router.isReady, query, hasExposities, initialMuseumsSorted, initialError]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!query && !hasExposities && initialMuseumsSorted.length > 0) {
      setResults(initialMuseumsSorted);
      setError(initialError ?? null);
    }
  }, [router.isReady, query, hasExposities, initialMuseumsSorted, initialError]);

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
      <div className="page-header">
        <div className="eyebrow">{t('homeEyebrow')}</div>
        <h1>{t('homeHeading')}</h1>
        <p>{t('homeSubheading')}</p>
      </div>
      <form className="search-row" onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          className="search-input"
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('searchPlaceholder')}
        />
        <button
          type="button"
          className={`filter-btn${hasActiveFilters ? ' is-active' : ''}`}
          onClick={openSheet}
        >
          {t('filters')}
        </button>
        {(query || hasExposities) && (
          <button type="button" className="clear-btn" onClick={resetAll}>
            {t('reset')}
          </button>
        )}
      </form>

      <section className="results-section">
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
      </section>

      <div className={`filter-sheet${sheetOpen ? ' is-open' : ''}`} aria-hidden={!sheetOpen}>
        <button type="button" className="filter-backdrop" onClick={closeSheet} aria-label={t('filtersCancel')} />
        <div className="filter-panel" role="dialog" aria-modal="true" aria-labelledby="filters-title">
          <h3 id="filters-title">{t('filtersTitle')}</h3>
          <label className="filter-check">
            <input
              type="checkbox"
              checked={draftFilters.inRegion}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, inRegion: e.target.checked }))}
            />
            <span>{t('filterRegion')}</span>
          </label>
          <label className="filter-check">
            <input
              type="checkbox"
              checked={draftFilters.temporarily}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, temporarily: e.target.checked }))}
            />
            <span>{t('filterTemporary')}</span>
          </label>
          <label className="filter-check">
            <input
              type="checkbox"
              checked={draftFilters.childFriendly}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, childFriendly: e.target.checked }))}
            />
            <span>{t('filterChildFriendly')}</span>
          </label>
          <label className="filter-check">
            <input
              type="checkbox"
              checked={draftFilters.free}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, free: e.target.checked }))}
            />
            <span>{t('filterFree')}</span>
          </label>
          <div className="filter-actions">
            <button type="button" className="btn ghost" onClick={closeSheet}>
              {t('filtersCancel')}
            </button>
            <button type="button" className="btn primary" onClick={applyFilters}>
              {t('filtersDone')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getStaticProps() {
  if (!supabaseClient) {
    return {
      props: {
        initialMuseums: [],
        initialError: 'missingSupabase',
      },
    };
  }

  try {
    const { data, error } = await supabaseClient
      .from('musea')
      .select('id, naam, stad, provincie, slug, gratis_toegankelijk, ticket_affiliate_url, website_url')
      .order('naam', { ascending: true });

    if (error) {
      return {
        props: {
          initialMuseums: [],
          initialError: 'queryFailed',
        },
      };
    }

    const filtered = (data || []).filter((m) => m.slug !== 'amsterdam-tulip-museum-amsterdam');

    return {
      props: {
        initialMuseums: sortMuseums(filtered),
        initialError: null,
      },
    };
  } catch (err) {
    return {
      props: {
        initialMuseums: [],
        initialError: 'unknown',
      },
    };
  }
}
