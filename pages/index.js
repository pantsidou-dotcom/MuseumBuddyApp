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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expositionsOnly, setExpositionsOnly] = useState(hasExposities);

  useEffect(() => {
    if (!router.isReady) return;
    setQuery(qFromUrl);
  }, [router.isReady, qFromUrl]);

  useEffect(() => {
    setExpositionsOnly(hasExposities);
  }, [hasExposities]);

  const hasActiveFilters = useMemo(() => hasExposities, [hasExposities]);
  const hasQuery = useMemo(() => query.trim().length > 0, [query]);

  const applyFilters = () => {
    if (!router.isReady) return;
    const trimmedQuery = query.trim();
    const params = {};
    if (trimmedQuery) params.q = trimmedQuery;
    if (expositionsOnly) params.exposities = '1';

    if (trimmedQuery !== query) {
      setQuery(trimmedQuery);
    }

    if (Object.keys(params).length > 0) {
      router.push({ pathname: '/', query: params }, undefined, { shallow: true });
    } else {
      router.push('/', undefined, { shallow: true });
    }

    setFiltersOpen(false);
  };

  const resetFilters = () => {
    if (!router.isReady) return;
    setQuery('');
    setExpositionsOnly(false);
    router.push('/', undefined, { shallow: true });
    setFiltersOpen(false);
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
      <div className="home-wrapper">
        <div className="home-page">
          <section className="home-hero">
            <div className="home-hero__copy">
              <p className="home-hero__eyebrow">MuseumBuddy</p>
              <h1 className="home-hero__title">{t('heroTitle')}</h1>
              <p className="home-hero__subtitle">{t('heroSubtitle')}</p>
            </div>
            <form
              className="home-search"
              onSubmit={(e) => {
                e.preventDefault();
                applyFilters();
              }}
            >
              <div className="home-search-field">
                <span className="home-search-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </span>
                <input
                  id="search"
                  type="text"
                  aria-label={t('searchPlaceholder')}
                  placeholder={t('searchPlaceholder')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                type="button"
                className={`home-filter-button${hasActiveFilters || expositionsOnly ? ' is-active' : ''}`}
                onClick={() => setFiltersOpen((prev) => !prev)}
                aria-expanded={filtersOpen}
                aria-controls="filters-panel"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 5h16" />
                  <path d="M6 12h12" />
                  <path d="M10 19h4" />
                </svg>
                <span>{t('filters')}</span>
              </button>
            </form>
            {filtersOpen && (
              <div id="filters-panel" className="home-filter-panel">
                <p className="home-filter-title">{t('filtersTitle')}</p>
                <label className="home-filter-option">
                  <input
                    type="checkbox"
                    checked={expositionsOnly}
                    onChange={(e) => setExpositionsOnly(e.target.checked)}
                  />
                  <span>{t('filterExpositions')}</span>
                </label>
                <div className="home-filter-actions">
                  <button type="button" className="home-filter-apply" onClick={applyFilters}>
                    {t('applyFilters')}
                  </button>
                  {(hasQuery || hasActiveFilters || expositionsOnly) && (
                    <button type="button" className="home-filter-reset" onClick={resetFilters}>
                      {t('reset')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="home-results">
            <div className="home-results-header">
              <p className="home-results-count">
                {results.length} {t('results')}
              </p>
              {(hasActiveFilters || hasQuery) && (
                <button type="button" className="home-results-reset" onClick={resetFilters}>
                  {t('reset')}
                </button>
              )}
            </div>

            {results.length === 0 ? (
              <p className="home-results-empty">{t('noResults')}</p>
            ) : (
              <ul className="home-results-list">
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
