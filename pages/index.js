import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import MuseumCard from '../components/MuseumCard';
import museumImages from '../lib/museumImages';
import museumNames from '../lib/museumNames';
import museumImageCredits from '../lib/museumImageCredits';
import museumTicketUrls from '../lib/museumTicketUrls';
import museumCategories from '../lib/museumCategories';
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

const CATEGORY_FILTERS = [
  { id: 'science', labelKey: 'filterScience' },
  { id: 'history', labelKey: 'filterHistory' },
  { id: 'kids', labelKey: 'filterKids' },
  { id: 'modernArt', labelKey: 'filterModernArt' },
  { id: 'culture', labelKey: 'filterCulture' },
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
  const [allMuseums, setAllMuseums] = useState(() => (shouldUseInitialData ? initialMuseumsSorted : []));
  const [error, setError] = useState(() => (shouldUseInitialData ? initialError : null));
  const [activeFilters, setActiveFilters] = useState([]);

  const categoryFilters = useMemo(
    () => CATEGORY_FILTERS.map((filter) => ({ ...filter, label: t(filter.labelKey) })),
    [t]
  );

  const activeFilterSet = useMemo(() => new Set(activeFilters), [activeFilters]);

  const filteredResults = useMemo(() => {
    if (activeFilterSet.size === 0) return allMuseums;
    return allMuseums.filter((museum) => {
      const categories = museumCategories[museum.slug] || [];
      return categories.some((category) => activeFilterSet.has(category));
    });
  }, [allMuseums, activeFilterSet]);

  const hasActiveFilters = activeFilters.length > 0;
  const showReset = Boolean(query || hasExposities || hasActiveFilters);

  const toggleFilter = (filterId) => {
    setActiveFilters((prev) => {
      if (prev.includes(filterId)) {
        return prev.filter((item) => item !== filterId);
      }
      return [...prev, filterId];
    });
  };

  const handleToggleExpositions = () => {
    if (!router.isReady) return;
    const nextQuery = {};
    if (query) nextQuery.q = query;
    if (!hasExposities) {
      nextQuery.exposities = '1';
    }
    router.push({ pathname: '/', query: nextQuery }, undefined, { shallow: true });
  };

  const handleResetFilters = () => {
    setActiveFilters([]);
    setQuery('');
    if (initialMuseumsSorted.length > 0) {
      setAllMuseums(initialMuseumsSorted);
      setError(initialError ?? null);
    }
    if (router.isReady) {
      router.push('/', undefined, { shallow: true });
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    setQuery(qFromUrl);
  }, [router.isReady, qFromUrl]);

  useEffect(() => {
    if (!router.isReady) return;

    const usingDefaultFilters = !query && !hasExposities;

    if (usingDefaultFilters && initialMuseumsSorted.length > 0) {
      setAllMuseums(initialMuseumsSorted);
      setError(initialError ?? null);
      return;
    }

    if (!supabaseClient) {
      setAllMuseums([]);
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
                setAllMuseums([]);
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
          setAllMuseums(sortMuseums(filtered));
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
      setAllMuseums(initialMuseumsSorted);
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
      <form className="controls" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="home-search" className="sr-only">
          {t('searchMuseums')}
        </label>
        <div className="search-area">
          <div className="search-bar">
            <span className="search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="7" />
                <line x1="20" y1="20" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              id="home-search"
              type="text"
              className="search-input"
              placeholder={t('searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setQuery('')}
                aria-label={t('clearSearch')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="filters-group">
          <div className="filter-chips" role="group" aria-label={t('filterGroupLabel')}>
            {categoryFilters.map((filter) => {
              const isActive = activeFilterSet.has(filter.id);
              return (
                <button
                  key={filter.id}
                  type="button"
                  className={`filter-chip${isActive ? ' active' : ''}`}
                  onClick={() => toggleFilter(filter.id)}
                  aria-pressed={isActive}
                >
                  <span>{filter.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              className={`filter-chip${hasExposities ? ' active' : ''}`}
              onClick={handleToggleExpositions}
              aria-pressed={hasExposities}
            >
              <span>{t('expositions')}</span>
            </button>
          </div>
          {showReset && (
            <button type="button" className="filter-reset" onClick={handleResetFilters}>
              <span className="filter-reset-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 12a9 9 0 1 1 9 9" />
                  <path d="M3 12h4M3 12V8" />
                </svg>
              </span>
              <span>{t('reset')}</span>
            </button>
          )}
        </div>
      </form>

      <p className="count">{filteredResults.length} {t('results')}</p>

      {filteredResults.length === 0 ? (
        <p>{t('noResults')}</p>
      ) : (
        <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {filteredResults.map((m) => (
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
