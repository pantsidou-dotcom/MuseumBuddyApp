import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import MuseumCard from '../components/MuseumCard';
import museumImages from '../lib/museumImages';
import museumNames from '../lib/museumNames';
import museumImageCredits from '../lib/museumImageCredits';
import museumTicketUrls from '../lib/museumTicketUrls';
import { useLanguage } from '../components/LanguageContext';
import { supabase as supabaseClient } from '../lib/supabase';
import SEO from '../components/SEO';
import FiltersSheet from '../components/FiltersSheet';

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

const FILTERS_EVENT = 'museumBuddy:openFilters';

const DEFAULT_FILTERS = Object.freeze({
  free: false,
  exhibitions: false,
  kidFriendly: false,
  nearby: false,
});

const BASE_MUSEUM_COLUMNS =
  'id, naam, stad, provincie, slug, gratis_toegankelijk, ticket_affiliate_url, website_url';
const OPTIONAL_MUSEUM_COLUMNS = 'kindvriendelijk, afstand_meter'; // TODO: bevestig kolomnamen zodra beschikbaar in Supabase.

function parseBooleanParam(value) {
  if (Array.isArray(value)) {
    return value.some((item) => parseBooleanParam(item));
  }

  if (value === undefined) return false;

  if (value === null) return false;

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return true;
    if (['1', 'true', 'yes', 'ja', 'waar'].includes(normalized)) return true;
    return false;
  }

  return Boolean(value);
}

export default function Home({ initialMuseums = [], initialError = null }) {
  const { t } = useLanguage();
  const router = useRouter();

  const qFromUrl = useMemo(() => {
    const q = router.query?.q;
    return typeof q === 'string' ? q.trim() : '';
  }, [router.query]);

  const filtersFromUrl = useMemo(() => {
    const queryFilters = router.query || {};
    return {
      ...DEFAULT_FILTERS,
      free: parseBooleanParam(queryFilters.gratis),
      exhibitions: parseBooleanParam(queryFilters.exposities),
    };
  }, [router.query]);

  const initialMuseumsSorted = useMemo(() => sortMuseums(initialMuseums || []), [initialMuseums]);
  const shouldUseInitialData =
    !qFromUrl && !filtersFromUrl.free && !filtersFromUrl.exhibitions && initialMuseumsSorted.length > 0;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState(() => (shouldUseInitialData ? initialMuseumsSorted : []));
  const [error, setError] = useState(() => (shouldUseInitialData ? initialError : null));
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(filtersFromUrl);
  const [sheetFilters, setSheetFilters] = useState(filtersFromUrl);

  useEffect(() => {
    if (!router.isReady) return;
    setQuery(qFromUrl);
  }, [router.isReady, qFromUrl]);

  useEffect(() => {
    if (!router.isReady) return;
    setActiveFilters(filtersFromUrl);
    if (!filtersSheetOpen) {
      setSheetFilters(filtersFromUrl);
    }
  }, [router.isReady, filtersFromUrl, filtersSheetOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleOpen = () => setFiltersSheetOpen(true);
    window.addEventListener(FILTERS_EVENT, handleOpen);
    return () => {
      window.removeEventListener(FILTERS_EVENT, handleOpen);
    };
  }, []);

  const buildQueryParams = useCallback(
    (searchValue, filters) => {
      const params = new URLSearchParams();
      if (searchValue) params.set('q', searchValue);
      if (filters?.exhibitions) params.set('exposities', '1');
      if (filters?.free) params.set('gratis', '1');
      return params.toString();
    },
    []
  );

  const expositiesHref = useMemo(() => {
    const params = buildQueryParams(query, { ...activeFilters, exhibitions: true });
    return params ? `/?${params}` : '/';
  }, [activeFilters, buildQueryParams, query]);

  useEffect(() => {
    if (!router.isReady) return;
    const params = buildQueryParams(query, {
      free: activeFilters.free,
      exhibitions: activeFilters.exhibitions,
    });
    const nextQuery = {};
    if (params) {
      const searchParams = new URLSearchParams(params);
      searchParams.forEach((value, key) => {
        nextQuery[key] = value;
      });
    }

    const currentQuery = router.query || {};
    const normalizedCurrent = Object.keys(currentQuery).reduce((acc, key) => {
      const value = currentQuery[key];
      acc[key] = Array.isArray(value) ? value[0] : value;
      return acc;
    }, {});

    const keys = new Set([...Object.keys(normalizedCurrent), ...Object.keys(nextQuery)]);
    let hasDiff = false;
    keys.forEach((key) => {
      if (!hasDiff && normalizedCurrent[key] !== nextQuery[key]) {
        hasDiff = true;
      }
    });

    if (!hasDiff) return;

    router.replace(
      {
        pathname: router.pathname,
        query: nextQuery,
      },
      undefined,
      { shallow: true, scroll: false }
    );
  }, [router, buildQueryParams, query, activeFilters.free, activeFilters.exhibitions]);

  useEffect(() => {
    if (filtersSheetOpen) {
      setSheetFilters(activeFilters);
    }
  }, [filtersSheetOpen, activeFilters]);

  useEffect(() => {
    if (!router.isReady) return;

    const usingDefaultFilters = !query && !activeFilters.free && !activeFilters.exhibitions;

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
        const buildQuery = (columns, expositionIds) => {
          let db = supabaseClient.from('musea').select(columns).order('naam', { ascending: true });
          if (query) db = db.ilike('naam', `%${query}%`);
          if (activeFilters.free) db = db.eq('gratis_toegankelijk', true);
          if (Array.isArray(expositionIds) && expositionIds.length > 0) {
            db = db.in('id', expositionIds);
          }
          return db;
        };

        let expositionIds = null;

        if (activeFilters.exhibitions) {
          const today = todayYMD('Europe/Amsterdam');
          const { data: exRows, error: exError } = await supabaseClient
            .from('exposities')
            .select('museum_id')
            .or(`eind_datum.gte.${today},eind_datum.is.null`);

          if (exError) {
            if (!isCancelled) setError('queryFailed');
            return;
          }

          const ids = [...new Set((exRows || []).map((e) => e.museum_id))];
          if (ids.length === 0) {
            if (!isCancelled) {
              setResults([]);
              setError(null);
            }
            return;
          }
          expositionIds = ids;
        }

        const columnsWithOptional = `${BASE_MUSEUM_COLUMNS}, ${OPTIONAL_MUSEUM_COLUMNS}`;

        let { data, error: queryError } = await buildQuery(columnsWithOptional, expositionIds);

        if (
          queryError &&
          queryError.message &&
          /column|identifier|relationship/i.test(queryError.message)
        ) {
          ({ data, error: queryError } = await buildQuery(BASE_MUSEUM_COLUMNS, expositionIds));
        }

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

    const delay = query || activeFilters.free || activeFilters.exhibitions ? 200 : 0;
    const timer = setTimeout(run, delay);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    router.isReady,
    query,
    activeFilters.free,
    activeFilters.exhibitions,
    initialMuseumsSorted,
    initialError,
  ]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!query && !activeFilters.free && !activeFilters.exhibitions && initialMuseumsSorted.length > 0) {
      setResults(initialMuseumsSorted);
      setError(initialError ?? null);
    }
  }, [
    router.isReady,
    query,
    activeFilters.free,
    activeFilters.exhibitions,
    initialMuseumsSorted,
    initialError,
  ]);

  const handleFilterChange = useCallback((name, value) => {
    setSheetFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    setActiveFilters({ ...DEFAULT_FILTERS, ...sheetFilters });
    setFiltersSheetOpen(false);
  }, [sheetFilters]);

  const handleResetFilters = useCallback(() => {
    const nextFilters = { ...DEFAULT_FILTERS };
    setSheetFilters(nextFilters);
    setActiveFilters(nextFilters);
    setFiltersSheetOpen(false);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setFiltersSheetOpen(false);
    setSheetFilters({ ...DEFAULT_FILTERS, ...activeFilters });
  }, [activeFilters]);

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
      <FiltersSheet
        open={filtersSheetOpen}
        filters={sheetFilters}
        onChange={handleFilterChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onClose={handleCloseSheet}
        labels={{
          title: t('filtersTitle'),
          description: t('filtersDescription'),
          availability: t('filtersAvailability'),
          future: t('filtersFuture'),
          free: t('filtersFree'),
          exhibitions: t('filtersExhibitions'),
          kidFriendly: t('filtersKidFriendly'),
          distance: t('filtersDistance'),
          comingSoon: t('filtersComingSoon'),
          apply: t('filtersApply'),
          reset: t('filtersReset'),
          close: t('filtersClose'),
          todo: t('filtersTodo'),
        }}
      />
      <section className="hero">
        <div className="hero-content">
          <span className="hero-tagline">{t('heroTagline')}</span>
          <h1 className="hero-title">{t('heroTitle')}</h1>
          <p className="hero-subtext">{t('heroSubtitle')}</p>
        </div>
        <form className="hero-card hero-search" onSubmit={(e) => e.preventDefault()}>
          <input
            type="search"
            className="input hero-input"
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t('searchPlaceholder')}
          />
          <div className="hero-actions">
            <button
              type="button"
              className="hero-quick-link hero-quick-link--ghost hero-quick-link--filters"
              onClick={() => setFiltersSheetOpen(true)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 4h16" />
                <path d="M7 12h10" />
                <path d="M10 20h4" />
              </svg>
              <span>{t('filtersButton')}</span>
            </button>
            <a href={expositiesHref} className="hero-quick-link hero-quick-link--primary">
              {t('expositions')}
            </a>
            {(query || activeFilters.free || activeFilters.exhibitions) && (
              <a href="/" className="hero-quick-link hero-quick-link--ghost">
                {t('reset')}
              </a>
            )}
          </div>
        </form>
      </section>

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
    const columnsWithOptional = `${BASE_MUSEUM_COLUMNS}, ${OPTIONAL_MUSEUM_COLUMNS}`;

    let { data, error } = await supabaseClient
      .from('musea')
      .select(columnsWithOptional)
      .order('naam', { ascending: true });

    if (error && error.message && /column|identifier|relationship/i.test(error.message)) {
      ({ data, error } = await supabaseClient
        .from('musea')
        .select(BASE_MUSEUM_COLUMNS)
        .order('naam', { ascending: true }));
    }

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
