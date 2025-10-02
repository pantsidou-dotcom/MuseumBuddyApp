"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import MuseumCard from './MuseumCard';
import SkeletonMuseumCard from './SkeletonMuseumCard';
import museumImages from '../lib/museumImages';
import museumNames from '../lib/museumNames';
import museumImageCredits from '../lib/museumImageCredits';
import museumTicketUrls from '../lib/museumTicketUrls';
import kidFriendlyMuseums, { isKidFriendly as resolveKidFriendly } from '../lib/kidFriendlyMuseums';
import { useLanguage } from './LanguageContext';
import { supabase as supabaseClient } from '../lib/supabase';
import FiltersSheet, { FILTERS_SHEET_ID } from './FiltersSheet';
import { filterMuseumsForDisplay } from '../lib/museumFilters';
import { CATEGORY_TRANSLATION_KEYS, getMuseumCategories } from '../lib/museumCategories';
import { parseMuseumSearchQuery } from '../lib/museumSearch';
import {
  BASE_MUSEUM_COLUMNS,
  DEFAULT_FILTERS,
  FILTERS_EVENT,
  NEARBY_RADIUS_METERS,
  NEARBY_RPC_NAME,
  OPTIONAL_MUSEUM_COLUMNS,
  sortMuseums,
  sortMuseumsByDistance,
  todayYMD,
} from '../lib/homepageConfig';
import { resolveAvailability, isOpenForDatePreference } from '../lib/openingHoursUtils';
import { resolveImageUrl } from '../lib/resolveImageSource';

const KID_FRIENDLY_SLUG_SET = new Set(kidFriendlyMuseums.map((slug) => slug.toLowerCase()));

function isKidFriendly(museum) {
  if (!museum) return false;
  return resolveKidFriendly(museum, KID_FRIENDLY_SLUG_SET);
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

export default function HomePageClient({ initialMuseums = [], initialError = null }) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsString = searchParams?.toString() ?? '';
  const hasSupabaseClient = Boolean(supabaseClient);

  const qFromUrl = useMemo(() => {
    if (!searchParams) return '';
    const value = searchParams.get('q');
    return typeof value === 'string' ? value.trim() : '';
  }, [searchParams, searchParamsString]);

  const filtersFromUrl = useMemo(() => {
    if (!searchParams) return DEFAULT_FILTERS;
    const dateParam = searchParams.get('date');
    const normalizedDate = dateParam === 'weekend' ? 'weekend' : DEFAULT_FILTERS.date;

    return {
      ...DEFAULT_FILTERS,
      free: parseBooleanParam(searchParams.get('gratis')),
      exhibitions: parseBooleanParam(searchParams.get('exposities')),
      kidFriendly: parseBooleanParam(
        searchParams.get('kindvriendelijk') ??
          searchParams.get('kidFriendly') ??
          searchParams.get('kidfriendly')
      ),
      nearby: parseBooleanParam(
        searchParams.get('dichtbij') ?? searchParams.get('nearby') ?? searchParams.get('distance')
      ),
      date: normalizedDate,
      openNow: parseBooleanParam(searchParams.get('open') ?? searchParams.get('openNow')),
    };
  }, [searchParams, searchParamsString]);

  const initialSortedMuseums = useMemo(() => sortMuseums(initialMuseums || []), [initialMuseums]);
  const initialMuseumsWithCategories = useMemo(
    () =>
      initialSortedMuseums.map((museum) => ({
        ...museum,
        categories: getMuseumCategories(museum.slug),
        availability: resolveAvailability(
          museum.slug,
          museum.opening_hours || museum.openingstijden
        ),
      })),
    [initialSortedMuseums]
  );
  const shouldUseInitialData =
    !qFromUrl &&
    !filtersFromUrl.free &&
    !filtersFromUrl.exhibitions &&
    !filtersFromUrl.kidFriendly &&
    !filtersFromUrl.nearby &&
    filtersFromUrl.date === DEFAULT_FILTERS.date &&
    !filtersFromUrl.openNow &&
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
  const handleDateSelect = useCallback(
    (value) => {
      if (!value) return;
      skipNextUrlSync.current = true;
      setActiveFilters((prev) => ({ ...prev, date: value }));
      setSheetFilters((prev) => ({ ...prev, date: value }));
    },
    []
  );
  const handleToggleOpenNow = useCallback(() => {
    skipNextUrlSync.current = true;
    setActiveFilters((prev) => ({ ...prev, openNow: !prev.openNow }));
    setSheetFilters((prev) => ({ ...prev, openNow: !prev.openNow }));
  }, []);
  const handleQuickReset = useCallback(() => {
    skipNextUrlSync.current = true;
    setQuery('');
    const nextFilters = { ...DEFAULT_FILTERS };
    setActiveFilters(nextFilters);
    setSheetFilters(nextFilters);
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);
  const [results, setResults] = useState(() =>
    shouldUseInitialData ? initialMuseumsWithCategories : []
  );
  const [error, setError] = useState(() => (shouldUseInitialData ? initialError : null));
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(filtersFromUrl);
  const [sheetFilters, setSheetFilters] = useState(filtersFromUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const skipNextUrlSync = useRef(false);
  const dateChoices = useMemo(
    () => [
      { value: 'today', label: t('homeDateToday') },
      { value: 'weekend', label: t('homeDateWeekend') },
    ],
    [t]
  );
  const hasActiveFiltersApplied =
    Boolean(query) ||
    activeFilters.free ||
    activeFilters.exhibitions ||
    activeFilters.kidFriendly ||
    activeFilters.nearby ||
    activeFilters.date !== DEFAULT_FILTERS.date ||
    activeFilters.openNow;

  useEffect(() => {
    setQuery(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
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
  }, [filtersFromUrl, filtersSheetOpen]);

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

  const buildQueryParams = useCallback(
    (searchValue, filters) => {
      const params = new URLSearchParams();
      if (searchValue) params.set('q', searchValue);
      if (filters?.exhibitions) params.set('exposities', '1');
      if (filters?.free) params.set('gratis', '1');
      if (filters?.kidFriendly) params.set('kindvriendelijk', '1');
      if (filters?.nearby) params.set('nearby', '1');
      if (filters?.date && filters.date !== DEFAULT_FILTERS.date) {
        params.set('date', filters.date);
      }
      if (filters?.openNow) params.set('open', '1');
      return params.toString();
    },
    []
  );

  const handleQuickShowExhibitions = useCallback(() => {
    skipNextUrlSync.current = true;
    setActiveFilters((prev) => ({ ...prev, exhibitions: true }));
    setSheetFilters((prev) => ({ ...prev, exhibitions: true }));
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
    if (hasSupabaseClient) return;
    if (!activeFilters.nearby) return;
    skipNextUrlSync.current = true;
    setActiveFilters((prev) => ({ ...prev, nearby: false }));
    setSheetFilters((prev) => ({ ...prev, nearby: false }));
  }, [hasSupabaseClient, activeFilters.nearby]);

  useEffect(() => {
    const params = buildQueryParams(query, {
      free: activeFilters.free,
      exhibitions: activeFilters.exhibitions,
      kidFriendly: activeFilters.kidFriendly,
      nearby: activeFilters.nearby,
      date: activeFilters.date,
      openNow: activeFilters.openNow,
    });

    const target = params ? `${pathname}?${params}` : pathname;
    const current = searchParamsString ? `${pathname}?${searchParamsString}` : pathname;

    if (target === current) {
      return;
    }

    router.replace(target, { scroll: false });
  }, [
    router,
    pathname,
    searchParamsString,
    buildQueryParams,
    query,
    activeFilters.free,
    activeFilters.exhibitions,
    activeFilters.kidFriendly,
    activeFilters.nearby,
    activeFilters.date,
    activeFilters.openNow,
  ]);

  useEffect(() => {
    if (filtersSheetOpen) {
      setSheetFilters(activeFilters);
    }
  }, [filtersSheetOpen, activeFilters]);

  const locallyFilterMuseums = useCallback(() => {
    const excluded = filterMuseumsForDisplay(initialMuseumsWithCategories, {
      excludeSlugs: ['amsterdam-tulip-museum-amsterdam'],
      onlyKidFriendly: activeFilters.kidFriendly,
      isKidFriendlyCheck: (museum) => isKidFriendly(museum),
    });

    const normalizedQuery = textQuery.trim().toLowerCase();
    const queryFiltered = normalizedQuery
      ? excluded.filter((museum) => {
          const name = (museum.naam || museum.name || '').toLowerCase();
          const slug = (museum.slug || '').toLowerCase();
          return name.includes(normalizedQuery) || slug.includes(normalizedQuery);
        })
      : excluded;

    const freeFiltered = activeFilters.free
      ? queryFiltered.filter((museum) => museum.gratis_toegankelijk)
      : queryFiltered;

    const exhibitionsFiltered = activeFilters.exhibitions
      ? freeFiltered.filter((museum) => museum.has_active_exhibitions !== false)
      : freeFiltered;

    const categoryFiltered =
      categoryFilters.length > 0
        ? exhibitionsFiltered.filter((museum) =>
            Array.isArray(museum.categories)
              ? categoryFilters.every((category) => museum.categories.includes(category))
              : false
          )
        : exhibitionsFiltered;

    const availabilityFiltered = categoryFiltered.filter((museum) => {
      if (!isOpenForDatePreference(museum.availability, activeFilters.date)) {
        return false;
      }
      if (activeFilters.openNow) {
        return museum.availability?.openNow === true;
      }
      return true;
    });

    return sortMuseums(availabilityFiltered);
  }, [
    initialMuseumsWithCategories,
    activeFilters.kidFriendly,
    activeFilters.free,
    activeFilters.exhibitions,
    activeFilters.date,
    activeFilters.openNow,
    categoryFiltersKey,
    textQuery,
  ]);

  useEffect(() => {
    const usingDefaultFilters =
      !query &&
      !activeFilters.free &&
      !activeFilters.exhibitions &&
      !activeFilters.kidFriendly &&
      !activeFilters.nearby &&
      activeFilters.date === DEFAULT_FILTERS.date &&
      !activeFilters.openNow;

    if (usingDefaultFilters && initialMuseumsWithCategories.length > 0) {
      setResults(initialMuseumsWithCategories);
      setError(initialError ?? null);
      setIsLoading(false);
      return;
    }

    if (!hasSupabaseClient) {
      setIsLoading(false);
      setResults(locallyFilterMuseums());
      setError(null);
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
          if (activeFilters.free) db = db.eq('gratis_toegankelijk', true);
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
          if (activeFilters.free) db = db.eq('gratis_toegankelijk', true);
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
          onlyKidFriendly: activeFilters.kidFriendly,
          isNearbyActive: activeFilters.nearby && usedNearbyResults,
          isKidFriendlyCheck: (museum) => isKidFriendly(museum),
        });
        const preparedWithCategories = filtered.map((museum) => ({
          ...museum,
          categories: getMuseumCategories(museum.slug),
          availability: resolveAvailability(
            museum.slug,
            museum.opening_hours || museum.openingstijden
          ),
        }));

        const categoryFilteredResults =
          categoryFilters.length > 0
            ? preparedWithCategories.filter((museum) =>
                categoryFilters.every((category) => museum.categories.includes(category))
              )
            : preparedWithCategories;

        const availabilityFilteredResults = categoryFilteredResults.filter((museum) => {
          if (!isOpenForDatePreference(museum.availability, activeFilters.date)) {
            return false;
          }
          if (activeFilters.openNow) {
            return museum.availability?.openNow === true;
          }
          return true;
        });

        const sortedResults =
          activeFilters.nearby && usedNearbyResults
            ? sortMuseumsByDistance(availabilityFilteredResults)
            : sortMuseums(availabilityFilteredResults);

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
      activeFilters.free ||
      activeFilters.exhibitions ||
      activeFilters.kidFriendly ||
      activeFilters.nearby ||
      activeFilters.date !== DEFAULT_FILTERS.date ||
      activeFilters.openNow
        ? 200
        : 0;
    const timer = setTimeout(run, delay);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    query,
    textQuery,
    categoryFiltersKey,
    activeFilters.free,
    activeFilters.exhibitions,
    activeFilters.kidFriendly,
    activeFilters.nearby,
    activeFilters.date,
    activeFilters.openNow,
    userLocation,
    initialMuseumsWithCategories,
    initialError,
    hasSupabaseClient,
    locallyFilterMuseums,
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

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const firstTwelve = results.slice(0, 12);
    const prefetchedSlugs = new Set();
    const prefetchedImages = new Set();

    firstTwelve.forEach((museum) => {
      if (!museum) return;
      if (museum.slug && !prefetchedSlugs.has(museum.slug)) {
        prefetchedSlugs.add(museum.slug);
        router.prefetch(`/museum/${museum.slug}`);
      }

      const resolvedImage = resolveImageUrl(
        museumImages[museum.slug] || museum.afbeelding_url || museum.image_url || museum.image
      );
      if (resolvedImage && !prefetchedImages.has(resolvedImage)) {
        prefetchedImages.add(resolvedImage);
        const img = new window.Image();
        img.src = resolvedImage;
      }
    });

    return () => {
      prefetchedSlugs.clear();
      prefetchedImages.clear();
    };
  }, [results, router]);

  if (error) {
    return (
      <main className="container" style={{ maxWidth: 800 }}>
        <p>{t('somethingWrong')}</p>
      </main>
    );
  }

  return (
    <>
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
          free: t('filtersFree'),
          exhibitions: t('filtersExhibitions'),
          kidFriendly: t('filtersKidFriendly'),
          distance: t('filtersDistance'),
          apply: t('filtersApply'),
          reset: t('filtersReset'),
          close: t('filtersClose'),
        }}
      />
      <header className="home-hero" aria-labelledby="home-hero-heading">
        <div className="home-hero__inner">
          <div className="home-hero__copy">
            <span className="home-hero__eyebrow">{t('heroTagline')}</span>
            <h1 id="home-hero-heading" className="home-hero__title">
              {t('heroTitle')}
            </h1>
            <p className="home-hero__subtitle">{t('heroSubtitle')}</p>
            <div className="home-hero__cta-row">
              <a href="#museum-result-list" className="home-hero__cta home-hero__cta--primary">
                {t('homePrimaryCta')}
              </a>
              <button
                type="button"
                className={`home-hero__cta home-hero__cta--secondary${
                  activeFilters.exhibitions ? ' is-active' : ''
                }`}
                onClick={handleQuickShowExhibitions}
                aria-pressed={activeFilters.exhibitions}
              >
                {t('homeSecondaryCta')}
              </button>
            </div>
          </div>
          <form className="home-hero__form" onSubmit={(e) => e.preventDefault()}>
            <label className="sr-only" htmlFor="home-search-input">
              {t('searchPlaceholder')}
            </label>
            <input
              id="home-search-input"
              type="search"
              className="input home-hero__input"
              placeholder={t('searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t('searchPlaceholder')}
            />
            <div className="home-hero__filters">
              <fieldset className="home-hero__date">
                <legend className="home-hero__legend">{t('homeDateLegend')}</legend>
                <div className="home-hero__date-options">
                  {dateChoices.map((choice) => (
                    <label
                      key={choice.value}
                      className={`home-hero__date-option${
                        activeFilters.date === choice.value ? ' is-active' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="home-date"
                        value={choice.value}
                        checked={activeFilters.date === choice.value}
                        onChange={() => handleDateSelect(choice.value)}
                      />
                      <span>{choice.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="home-hero__quick-actions">
                <button
                  type="button"
                  className={`home-hero__toggle${activeFilters.openNow ? ' is-active' : ''}`}
                  onClick={handleToggleOpenNow}
                  aria-pressed={activeFilters.openNow}
                >
                  {t('homeOpenNow')}
                </button>
                <button
                  type="button"
                  className="home-hero__toggle home-hero__toggle--ghost"
                  onClick={() => setFiltersSheetOpen(true)}
                  aria-controls={FILTERS_SHEET_ID}
                  aria-haspopup="dialog"
                >
                  {t('filtersButton')}
                </button>
                {hasActiveFiltersApplied && (
                  <button type="button" className="home-hero__reset" onClick={handleQuickReset}>
                    {t('reset')}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </header>

      <section className="secondary-hero" aria-labelledby="museumnacht-hero-heading">
        <img
          src="/images/Museumnacht.jpg"
          alt="Museumnacht Amsterdam visitors enjoying exhibitions"
          className="secondary-hero__image"
          loading="lazy"
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

      <section id="museum-result-list" className="home-results" aria-live="polite">
        <div className="home-results__meta">
          <p className="count">{results.length} {t('results')}</p>
        </div>
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
                    categories: Array.isArray(m.categories)
                      ? m.categories
                      : getMuseumCategories(m.slug),
                    image: museumImages[m.slug] || m.afbeelding_url || m.image_url || null,
                    imageCredit: museumImageCredits[m.slug],
                    ticketUrl: m.ticket_affiliate_url || museumTicketUrls[m.slug] || m.website_url,
                  }}
                  priority={index < 6}
                  onCategoryClick={handleCategoryFilterClick}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
