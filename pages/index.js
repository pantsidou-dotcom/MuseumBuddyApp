import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import MuseumCard from '../components/MuseumCard';
import SkeletonMuseumCard from '../components/SkeletonMuseumCard';
import museumImages from '../lib/museumImages';
import museumNames from '../lib/museumNames';
import museumImageCredits from '../lib/museumImageCredits';
import museumTicketUrls from '../lib/museumTicketUrls';
import { useLanguage } from '../components/LanguageContext';
import { supabase as supabaseClient } from '../lib/supabase';
import SEO from '../components/SEO';
import FiltersSheet from '../components/FiltersSheet';
import { filterMuseumsForDisplay } from '../lib/museumFilters';
import {
  CATEGORY_ORDER,
  CATEGORY_TRANSLATION_KEYS,
  getMuseumCategories,
} from '../lib/museumCategories';
import { parseMuseumSearchQuery } from '../lib/museumSearch';
import Button from '../components/ui/Button';
import parseBooleanParam from '../lib/parseBooleanParam.js';
import { DEFAULT_TIME_ZONE } from '../lib/openingHours.js';

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

function sortMuseumsByDistance(museums) {
  return [...museums].sort((a, b) => {
    const aDistance = typeof a?.afstand_meter === 'number' ? a.afstand_meter : Number.POSITIVE_INFINITY;
    const bDistance = typeof b?.afstand_meter === 'number' ? b.afstand_meter : Number.POSITIVE_INFINITY;

    if (aDistance === bDistance) {
      return a.naam.localeCompare(b.naam);
    }

    return aDistance - bDistance;
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

const ORDERED_TYPE_CATEGORIES = CATEGORY_ORDER.filter(
  (category) => category !== 'exhibition' && CATEGORY_TRANSLATION_KEYS[category]
);
const REMAINING_TYPE_CATEGORIES = Object.keys(CATEGORY_TRANSLATION_KEYS).filter(
  (category) =>
    category !== 'exhibition' && !ORDERED_TYPE_CATEGORIES.includes(category)
);
const TYPE_CATEGORY_KEYS = [...ORDERED_TYPE_CATEGORIES, ...REMAINING_TYPE_CATEGORIES];

const TYPE_FILTERS = Object.freeze(
  TYPE_CATEGORY_KEYS.map((category) => ({
    id: category,
    paramValue: category,
    stateKey: `type:${category}`,
    labelKey: CATEGORY_TRANSLATION_KEYS[category],
    category,
  }))
);

const DEFAULT_FILTERS = Object.freeze({
  exhibitions: false,
  nearby: false,
  openNow: false,
  ...TYPE_FILTERS.reduce((acc, type) => {
    acc[type.stateKey] = false;
    return acc;
  }, {}),
});

function getSelectedTypeIds(filters) {
  if (!filters) return [];
  return TYPE_FILTERS.filter((type) => filters[type.stateKey]).map((type) => type.paramValue);
}

function hasActiveTypeFilters(filters) {
  return getSelectedTypeIds(filters).length > 0;
}

const BASE_MUSEUM_COLUMNS =
  'id, naam, stad, provincie, slug, gratis_toegankelijk, ticket_affiliate_url, website_url';
const OPTIONAL_MUSEUM_COLUMNS = 'afstand_meter';
const NEARBY_RPC_NAME = 'musea_within_radius';
const NEARBY_RADIUS_METERS = 5000;

export default function Home({ initialMuseums = [], initialError = null }) {
  const { t } = useLanguage();
  const router = useRouter();

  const qFromUrl = useMemo(() => {
    const q = router.query?.q;
    return typeof q === 'string' ? q.trim() : '';
  }, [router.query]);

  const filtersFromUrl = useMemo(() => {
    const queryFilters = router.query || {};
    const rawTypes = queryFilters.types;
    const typeValue = Array.isArray(rawTypes) ? rawTypes[0] : rawTypes;
    const parsedTypes = typeof typeValue === 'string'
      ? typeValue
          .split(',')
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean)
      : [];

    const typeFiltersFromQuery = TYPE_FILTERS.reduce((acc, type) => {
      acc[type.stateKey] = parsedTypes.includes(type.paramValue);
      return acc;
    }, {});

    return {
      ...DEFAULT_FILTERS,
      ...typeFiltersFromQuery,
      exhibitions: parseBooleanParam(queryFilters.exposities),
      nearby: parseBooleanParam(
        queryFilters.dichtbij ?? queryFilters.nearby ?? queryFilters.distance
      ),
      openNow: parseBooleanParam(
        queryFilters.open_now ?? queryFilters.openNow ?? queryFilters.open
      ),
    };
  }, [router.query]);

  const initialSortedMuseums = useMemo(() => sortMuseums(initialMuseums || []), [initialMuseums]);
  const initialMuseumsWithCategories = useMemo(
    () =>
      initialSortedMuseums.map((museum) => ({
        ...museum,
        categories: getMuseumCategories(museum.slug),
      })),
    [initialSortedMuseums]
  );
  const shouldUseInitialData =
    !qFromUrl &&
    !filtersFromUrl.exhibitions &&
    !filtersFromUrl.nearby &&
    !filtersFromUrl.openNow &&
    !hasActiveTypeFilters(filtersFromUrl) &&
    initialMuseumsWithCategories.length > 0;

  const [query, setQuery] = useState('');
  const { textQuery, categoryFilters } = useMemo(() => parseMuseumSearchQuery(query), [query]);
  const categoryFiltersKey = categoryFilters.join('|');
  const categoryLabelFromKey = useCallback(
    (categoryKey) => {
      if (!categoryKey) return '';
      const translationKey = CATEGORY_TRANSLATION_KEYS[categoryKey];
      const translation = translationKey ? t(translationKey) : categoryKey;
      if (typeof translation !== 'string') return '';
      return translation.trim().toLowerCase();
    },
    [t]
  );
  const handleCategoryFilterClick = useCallback(
    (categoryKey) => {
      if (!categoryKey) return;
      const nextCategories = new Set(categoryFilters);
      nextCategories.add(categoryKey);
      const searchTerms = [];
      const trimmedText = textQuery.trim();
      if (trimmedText) {
        searchTerms.push(trimmedText);
      }
      nextCategories.forEach((key) => {
        const term = categoryLabelFromKey(key);
        if (term) {
          searchTerms.push(term);
        }
      });
      const nextQueryValue = searchTerms.join(' ').trim();
      if (nextQueryValue !== query) {
        setQuery(nextQueryValue);
      }
    },
    [categoryFilters, categoryLabelFromKey, query, textQuery]
  );
  const [results, setResults] = useState(() =>
    shouldUseInitialData ? initialMuseumsWithCategories : []
  );
  const [error, setError] = useState(() => (shouldUseInitialData ? initialError : null));
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(filtersFromUrl);
  const [sheetFilters, setSheetFilters] = useState(filtersFromUrl);
  const [isLoading, setIsLoading] = useState(false);
  const resultsRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const skipNextUrlSync = useRef(false);
  const activeTypeFilterKey = useMemo(
    () => getSelectedTypeIds(activeFilters).join('|'),
    [activeFilters]
  );
  const hasSelectedTypeFilters = activeTypeFilterKey.length > 0;

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

  const requestUserLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator?.geolocation) {
      return Promise.reject(new Error('geolocationUnavailable'));
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position?.coords?.latitude;
          const longitude = position?.coords?.longitude;

          if (typeof latitude === 'number' && typeof longitude === 'number') {
            resolve({ latitude, longitude });
            return;
          }

          reject(new Error('invalidCoordinates'));
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true }
      );
    });
  }, []);

  const buildQueryParams = useCallback((searchValue, filters) => {
    const params = new URLSearchParams();
    if (searchValue) params.set('q', searchValue);
    if (filters?.exhibitions) params.set('exposities', '1');
    if (filters?.nearby) params.set('nearby', '1');
    if (filters?.openNow) params.set('open_now', '1');
    const selectedTypes = getSelectedTypeIds(filters);
    if (selectedTypes.length > 0) {
      params.set('types', selectedTypes.join(','));
    }
    return params.toString();
  }, []);

  const handleQuickShowExhibitions = useCallback(() => {
    skipNextUrlSync.current = true;
    setActiveFilters((prev) => ({ ...DEFAULT_FILTERS, ...prev, exhibitions: true }));
    setSheetFilters((prev) => ({ ...DEFAULT_FILTERS, ...prev, exhibitions: true }));
    setFiltersSheetOpen(false);
  }, [setActiveFilters, setSheetFilters, setFiltersSheetOpen]);

  useEffect(() => {
    if (!activeFilters.nearby) return;
    if (userLocation) return;

    let cancelled = false;

    requestUserLocation()
      .then((coords) => {
        if (cancelled) return;
        setUserLocation(coords);
        setSheetFilters((prev) => ({ ...prev, nearby: true }));
      })
      .catch(() => {
        if (cancelled) return;
        skipNextUrlSync.current = true;
        setActiveFilters((prev) => ({ ...prev, nearby: false }));
        setSheetFilters((prev) => ({ ...prev, nearby: false }));
      });

    return () => {
      cancelled = true;
    };
  }, [activeFilters.nearby, requestUserLocation, setActiveFilters, setSheetFilters, userLocation]);

  useEffect(() => {
    if (!router.isReady) return;
    const params = buildQueryParams(query, activeFilters);
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
    activeFilters.exhibitions,
    activeFilters.nearby,
    activeFilters.openNow,
    activeTypeFilterKey,
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
      !activeFilters.exhibitions &&
      !activeFilters.nearby &&
      !activeFilters.openNow &&
      !hasSelectedTypeFilters;

    if (usingDefaultFilters && initialMuseumsWithCategories.length > 0) {
      setResults(initialMuseumsWithCategories);
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
    const requiresLocation = activeFilters.nearby;
    const hasLocation =
      userLocation &&
      typeof userLocation.latitude === 'number' &&
      typeof userLocation.longitude === 'number';

    if (requiresLocation && !hasLocation) {
      setIsLoading(true);
      setResults([]);
      return () => {
        isCancelled = true;
      };
    }

    setIsLoading(true);
    setResults([]);

    const run = async () => {
      try {
        const createBaseQuery = (columns, expositionIds) => {
          let db = supabaseClient.from('musea').select(columns).order('naam', { ascending: true });
          if (textQuery) db = db.ilike('naam', `%${textQuery}%`);
          if (Array.isArray(expositionIds) && expositionIds.length > 0) {
            db = db.in('id', expositionIds);
          }
          return db;
        };

        const createNearbyQuery = (expositionIds) => {
          const latitude = userLocation?.latitude;
          const longitude = userLocation?.longitude;
          let db = supabaseClient.rpc(NEARBY_RPC_NAME, {
            lat: latitude,
            lng: longitude,
            radius_meters: NEARBY_RADIUS_METERS,
          });
          if (textQuery) db = db.ilike('naam', `%${textQuery}%`);
          if (Array.isArray(expositionIds) && expositionIds.length > 0) {
            db = db.in('id', expositionIds);
          }
          return db;
        };

        const runQuery = async (columns, expositionIds) => {
          let nearbyError = null;

          if (activeFilters.nearby) {
            const nearbyResult = await createNearbyQuery(expositionIds);
            if (!nearbyResult.error) {
              return {
                data: nearbyResult.data,
                error: nearbyResult.error,
                usedNearbyResults: true,
                nearbyError: null,
              };
            }

            nearbyError = nearbyResult.error;
          }

          const baseResult = await createBaseQuery(columns, expositionIds);

          return {
            data: baseResult.data,
            error: baseResult.error,
            usedNearbyResults: false,
            nearbyError,
          };
        };

        const executeWithColumnFallback = async (columns, expositionIds) => {
          const primaryAttempt = await runQuery(columns, expositionIds);
          const { error: primaryError, nearbyError } = primaryAttempt;

          if (
            columns === BASE_MUSEUM_COLUMNS ||
            (!primaryError && !nearbyError) ||
            !(
              (primaryError?.message && /column|identifier|relationship/i.test(primaryError.message)) ||
              (nearbyError?.message && /column|identifier|relationship/i.test(nearbyError.message))
            )
          ) {
            return primaryAttempt;
          }

          return runQuery(BASE_MUSEUM_COLUMNS, expositionIds);
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

        const columnsWithOptional = `${BASE_MUSEUM_COLUMNS}, ${OPTIONAL_MUSEUM_COLUMNS}`;

        let {
          data,
          error: queryError,
          usedNearbyResults,
        } = await executeWithColumnFallback(columnsWithOptional, expositionIds);

        if (queryError && /column|identifier|relationship/i.test(queryError.message || '')) {
          ({ data, error: queryError, usedNearbyResults } = await executeWithColumnFallback(
            BASE_MUSEUM_COLUMNS,
            expositionIds
          ));
        }

        if (queryError) {
          if (!isCancelled) {
            setError('queryFailed');
            setIsLoading(false);
          }
          return;
        }

        const filtered = filterMuseumsForDisplay(data || [], {
          excludeSlugs: ['amsterdam-tulip-museum-amsterdam'],
          isNearbyActive: activeFilters.nearby && usedNearbyResults,
          onlyOpenNow: activeFilters.openNow,
          openNowTimeZone: DEFAULT_TIME_ZONE,
        });
        const preparedWithCategories = filtered.map((museum) => ({
          ...museum,
          categories: getMuseumCategories(museum.slug),
        }));

        const categoryFilteredResults =
          categoryFilters.length > 0
            ? preparedWithCategories.filter((museum) =>
                categoryFilters.every((category) => museum.categories.includes(category))
              )
            : preparedWithCategories;

        const activeTypeFiltersList = TYPE_FILTERS.filter(
          (type) => activeFilters[type.stateKey]
        );
        const activeTypeCategories =
          activeTypeFiltersList.length > 0
            ? new Set(activeTypeFiltersList.map((type) => type.category))
            : null;
        const typeFilteredResults =
          activeTypeCategories && activeTypeCategories.size > 0
            ? categoryFilteredResults.filter((museum) => {
                const museumCategories = Array.isArray(museum.categories)
                  ? museum.categories
                  : [];
                return museumCategories.some((category) =>
                  activeTypeCategories.has(category)
                );
              })
            : categoryFilteredResults;

        const sortedResults =
          activeFilters.nearby && usedNearbyResults
            ? sortMuseumsByDistance(typeFilteredResults)
            : sortMuseums(typeFilteredResults);

        if (!isCancelled) {
          setResults(sortedResults);
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
      activeFilters.exhibitions ||
      activeFilters.nearby ||
      activeFilters.openNow ||
      hasSelectedTypeFilters
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
    textQuery,
    categoryFiltersKey,
    activeFilters.exhibitions,
    activeFilters.nearby,
    activeFilters.openNow,
    activeTypeFilterKey,
    hasSelectedTypeFilters,
    userLocation,
    initialMuseumsWithCategories,
    initialError,
  ]);

  useEffect(() => {
    if (!router.isReady) return;
    if (
      !query &&
      !activeFilters.exhibitions &&
      !activeFilters.nearby &&
      !activeFilters.openNow &&
      !hasSelectedTypeFilters &&
      initialMuseumsWithCategories.length > 0
    ) {
      setResults(initialMuseumsWithCategories);
      setError(initialError ?? null);
      setIsLoading(false);
    }
  }, [
    router.isReady,
    query,
    activeFilters.exhibitions,
    activeFilters.nearby,
    activeFilters.openNow,
    hasSelectedTypeFilters,
    initialMuseumsWithCategories,
    initialError,
  ]);

  const handleFilterChange = useCallback(
    (name, value) => {
      if (name === 'nearby') {
        if (!value) {
          setSheetFilters((prev) => ({
            ...prev,
            nearby: false,
          }));
          return;
        }

        if (userLocation) {
          setSheetFilters((prev) => ({
            ...prev,
            nearby: true,
          }));
          return;
        }

        requestUserLocation()
          .then((coords) => {
            setUserLocation(coords);
            setSheetFilters((prev) => ({
              ...prev,
              nearby: true,
            }));
          })
          .catch(() => {
            setSheetFilters((prev) => ({
              ...prev,
              nearby: false,
            }));
          });

        return;
      }

      setSheetFilters((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    [requestUserLocation, userLocation]
  );

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

  const handleScrollToResults = useCallback(() => {
    const node = resultsRef.current;
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (typeof window !== 'undefined') {
      window.location.hash = '#museum-results';
    }
  }, []);

  const filterSections = useMemo(
    () => [
      {
        id: 'availability',
        title: t('filtersAvailability'),
        options: [
          { name: 'openNow', label: t('filtersOpenNow') },
          { name: 'exhibitions', label: t('filtersExhibitions') },
          { name: 'nearby', label: t('filtersDistance'), hidden: true },
        ],
      },
      {
        id: 'types',
        title: t('filtersTypeTitle'),
        options: TYPE_FILTERS.map((type) => ({
          name: type.stateKey,
          label: t(type.labelKey),
        })),
      },
    ],
    [t]
  );

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
        sections={filterSections}
        labels={{
          title: t('filtersTitle'),
          description: t('filtersDescription'),
          availability: t('filtersAvailability'),
          exhibitions: t('filtersExhibitions'),
          distance: t('filtersDistance'),
          openNow: t('filtersOpenNow'),
          typeTitle: t('filtersTypeTitle'),
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
          <div className="hero-ctas">
            <Button
              type="button"
              size="lg"
              variant="primary"
              className="hero-cta-button"
              onClick={handleScrollToResults}
              aria-controls="museum-results"
            >
              {t('heroDiscoverMuseums')}
            </Button>
            <Button
              href="/tentoonstellingen"
              size="lg"
              variant="secondary"
              className="hero-cta-button hero-cta-button--secondary"
              prefetch
            >
              {t('heroViewExhibitions')}
            </Button>
          </div>
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
            {(query ||
              activeFilters.exhibitions ||
              activeFilters.nearby ||
              activeFilters.openNow ||
              hasSelectedTypeFilters) && (
              <a href="/" className="hero-quick-link hero-quick-link--ghost">
                {t('reset')}
              </a>
            )}
          </div>
        </form>
      </section>

      <section className="secondary-hero" aria-labelledby="museumnacht-hero-heading">
        <Image
          src="/images/Museumnacht.jpg"
          alt="Museumnacht Amsterdam visitors enjoying exhibitions"
          fill
          className="secondary-hero__image"
          sizes="(min-width: 768px) 80vw, 100vw"
          priority={false}
        />
        <div className="secondary-hero__overlay" aria-hidden="true" />
        <div className="secondary-hero__content">
          <p className="secondary-hero__tag">{t('museumnachtTag')}</p>
          <h2 id="museumnacht-hero-heading" className="secondary-hero__title">
            {t('museumnachtHeading')}
          </h2>
          <p className="secondary-hero__subtitle">{t('museumnachtSubtitle')}</p>
          <a
            className="ticket-button secondary-hero__cta"
            href="https://museumnacht.amsterdam/tickets"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('buyTickets')}
          </a>
        </div>
      </section>

      <section id="museum-results" ref={resultsRef} className="results-section">
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
            {results.map((m, index) => {
              const ticketAffiliateUrl = m.ticket_affiliate_url || museumTicketUrls[m.slug] || null;
              const ticketUrl = ticketAffiliateUrl || m.website_url || null;

              return (
                <li key={m.id}>
                  <MuseumCard
                    museum={{
                      id: m.id,
                      slug: m.slug,
                      title: museumNames[m.slug] || m.naam,
                      city: m.stad,
                      province: m.provincie,
                      free: m.gratis_toegankelijk,
                      categories: Array.isArray(m.categories)
                        ? m.categories
                        : getMuseumCategories(m.slug),
                      image: museumImages[m.slug] || m.afbeelding_url || m.image_url || null,
                      imageCredit: museumImageCredits[m.slug],
                      ticketUrl,
                      ticketAffiliateUrl,
                    }}
                    priority={index < 6}
                    onCategoryClick={handleCategoryFilterClick}
                    highlightOpenNow={activeFilters.openNow}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
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
