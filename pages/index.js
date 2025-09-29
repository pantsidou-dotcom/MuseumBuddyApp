import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import MuseumCard from '../components/MuseumCard';
import SkeletonMuseumCard from '../components/SkeletonMuseumCard';
import museumImages from '../lib/museumImages';
import museumNames from '../lib/museumNames';
import museumImageCredits from '../lib/museumImageCredits';
import museumTicketUrls from '../lib/museumTicketUrls';
import { useLanguage } from '../components/LanguageContext';
import HomeValueProps from '../components/HomeValueProps';
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
  'id, naam, stad, provincie, slug, gratis_toegankelijk, ticket_affiliate_url, website_url, kindvriendelijk';
const DISTANCE_COLUMN = 'afstand_meter';
const NEARBY_DISTANCE_THRESHOLD_METERS = 2500; // 2.5 km radius for the nearby filter.

function resolveBooleanFlag(...values) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (!normalized) continue;
      if (['1', 'true', 'yes', 'ja', 'waar', 'y'].includes(normalized)) return true;
      if (['0', 'false', 'nee', 'no', 'n'].includes(normalized)) return false;
      return true;
    }
  }
  return undefined;
}

function isKidFriendly(museum) {
  return resolveBooleanFlag(
    museum?.kindvriendelijk,
    museum?.kindFriendly,
    museum?.familievriendelijk,
    museum?.childFriendly
  ) === true;
}

function parseDistanceMeters(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function getMuseumSelectColumns({ includeDistance } = {}) {
  if (includeDistance) {
    return `${BASE_MUSEUM_COLUMNS}, ${DISTANCE_COLUMN}`;
  }
  return BASE_MUSEUM_COLUMNS;
}

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
      kidFriendly: parseBooleanParam(queryFilters.kindvriendelijk),
      nearby: parseBooleanParam(queryFilters.dichtbij),
    };
  }, [router.query]);

  const initialMuseumsSorted = useMemo(() => sortMuseums(initialMuseums || []), [initialMuseums]);
  const shouldUseInitialData =
    !qFromUrl &&
    !filtersFromUrl.free &&
    !filtersFromUrl.exhibitions &&
    !filtersFromUrl.kidFriendly &&
    !filtersFromUrl.nearby &&
    initialMuseumsSorted.length > 0;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState(() => (shouldUseInitialData ? initialMuseumsSorted : []));
  const [error, setError] = useState(() => (shouldUseInitialData ? initialError : null));
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(filtersFromUrl);
  const [sheetFilters, setSheetFilters] = useState(filtersFromUrl);
  const [isLoading, setIsLoading] = useState(false);
  const skipNextUrlSync = useRef(false);

  useEffect(() => {
    if (!router.isReady) return;
    setQuery(qFromUrl);
  }, [router.isReady, qFromUrl]);

  useEffect(() => {
    if (!router.isReady) return;

    if (skipNextUrlSync.current) {
      if (!filtersSheetOpen) {
        skipNextUrlSync.current = false;
      }
      return;
    }

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
      if (filters?.kidFriendly) params.set('kindvriendelijk', '1');
      if (filters?.nearby) params.set('dichtbij', '1');
      return params.toString();
    },
    []
  );

  const handleQuickShowExhibitions = useCallback(() => {
    skipNextUrlSync.current = true;
    setActiveFilters((prev) => ({ ...DEFAULT_FILTERS, ...prev, exhibitions: true }));
    setSheetFilters((prev) => ({ ...DEFAULT_FILTERS, ...prev, exhibitions: true }));
    setFiltersSheetOpen(false);
  }, [setActiveFilters, setSheetFilters, setFiltersSheetOpen]);

  useEffect(() => {
    if (!router.isReady) return;
    const params = buildQueryParams(query, {
      free: activeFilters.free,
      exhibitions: activeFilters.exhibitions,
      kidFriendly: activeFilters.kidFriendly,
      nearby: activeFilters.nearby,
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
  }, [
    router,
    buildQueryParams,
    query,
    activeFilters.free,
    activeFilters.exhibitions,
    activeFilters.kidFriendly,
    activeFilters.nearby,
  ]);

  useEffect(() => {
    if (filtersSheetOpen) {
      setSheetFilters(activeFilters);
    }
  }, [filtersSheetOpen, activeFilters]);

  useEffect(() => {
    if (!router.isReady) return;

    const usingDefaultFilters =
      !query &&
      !activeFilters.free &&
      !activeFilters.exhibitions &&
      !activeFilters.kidFriendly &&
      !activeFilters.nearby;

    if (usingDefaultFilters && initialMuseumsSorted.length > 0) {
      setResults(initialMuseumsSorted);
      setError(initialError ?? null);
      setIsLoading(false);
      return;
    }

    if (!supabaseClient) {
      setResults([]);
      setError('missingSupabase');
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setResults([]);

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
            if (!isCancelled) {
              setError('queryFailed');
              setIsLoading(false);
            }
            return;
          }

          const ids = [...new Set((exRows || []).map((e) => e.museum_id))];
          if (ids.length === 0) {
            if (!isCancelled) {
              setResults([]);
              setError(null);
              setIsLoading(false);
            }
            return;
          }
          expositionIds = ids;
        }

        const columnsWithOptional = getMuseumSelectColumns({ includeDistance: activeFilters.nearby });

        let { data, error: queryError } = await buildQuery(columnsWithOptional, expositionIds);

        if (
          queryError &&
          queryError.message &&
          /column|identifier|relationship/i.test(queryError.message)
        ) {
          ({ data, error: queryError } = await buildQuery(BASE_MUSEUM_COLUMNS, expositionIds));
        }

        if (queryError) {
          if (!isCancelled) {
            setError('queryFailed');
            setIsLoading(false);
          }
          return;
        }

        const filtered = (data || [])
          .filter((m) => m.slug !== 'amsterdam-tulip-museum-amsterdam')
          .filter((m) => (activeFilters.kidFriendly ? isKidFriendly(m) : true))
          .filter((m) => {
            if (!activeFilters.nearby) return true;
            const distanceValue = parseDistanceMeters(m?.[DISTANCE_COLUMN]);
            if (distanceValue === null) return false;
            return distanceValue <= NEARBY_DISTANCE_THRESHOLD_METERS;
          });

        if (!isCancelled) {
          setResults(sortMuseums(filtered));
          setError(null);
          setIsLoading(false);
        }
      } catch {
        if (!isCancelled) {
          setError('unknown');
          setIsLoading(false);
        }
      }
    };

    const delay =
      query ||
      activeFilters.free ||
      activeFilters.exhibitions ||
      activeFilters.kidFriendly ||
      activeFilters.nearby
        ? 200
        : 0;
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
    activeFilters.kidFriendly,
    activeFilters.nearby,
    initialMuseumsSorted,
    initialError,
  ]);

  useEffect(() => {
    if (!router.isReady) return;
    if (
      !query &&
      !activeFilters.free &&
      !activeFilters.exhibitions &&
      !activeFilters.kidFriendly &&
      !activeFilters.nearby &&
      initialMuseumsSorted.length > 0
    ) {
      setResults(initialMuseumsSorted);
      setError(initialError ?? null);
      setIsLoading(false);
    }
  }, [
    router.isReady,
    query,
    activeFilters.free,
    activeFilters.exhibitions,
    activeFilters.kidFriendly,
    activeFilters.nearby,
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
    skipNextUrlSync.current = true;
    setActiveFilters({ ...DEFAULT_FILTERS, ...sheetFilters });
    setFiltersSheetOpen(false);
  }, [sheetFilters]);

  const handleResetFilters = useCallback(() => {
    const nextFilters = { ...DEFAULT_FILTERS };
    setSheetFilters(nextFilters);
    skipNextUrlSync.current = true;
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
          apply: t('filtersApply'),
          reset: t('filtersReset'),
          close: t('filtersClose'),
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
            <button
              type="button"
              className="hero-quick-link hero-quick-link--primary"
              onClick={handleQuickShowExhibitions}
              aria-pressed={activeFilters.exhibitions}
            >
              {t('exhibitions')}
            </button>
            {(query || activeFilters.free || activeFilters.exhibitions) && (
              <a href="/" className="hero-quick-link hero-quick-link--ghost">
                {t('reset')}
              </a>
            )}
          </div>
        </form>
      </section>

      <HomeValueProps />

      <p className="count">{results.length} {t('results')}</p>

      {isLoading ? (
        <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <li key={`skeleton-${index}`}>
              <SkeletonMuseumCard />
            </li>
          ))}
        </ul>
      ) : results.length === 0 ? (
        <p>{t('noResults')}</p>
      ) : (
        <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {results.map((m, index) => (
            <li key={m.id}>
              <MuseumCard
                museum={{
                  id: m.id,
                  slug: m.slug,
                  title: museumNames[m.slug] || m.naam,
                  city: m.stad,
                  province: m.provincie,
                  free: m.gratis_toegankelijk,
                  image: museumImages[m.slug] || m.afbeelding_url || m.image_url || null,
                  imageCredit: museumImageCredits[m.slug],
                  ticketUrl: m.ticket_affiliate_url || museumTicketUrls[m.slug] || m.website_url,
                }}
                priority={index < 6}
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
    const columnsWithOptional = getMuseumSelectColumns({ includeDistance: false });

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
