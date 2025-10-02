"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ExpositionCard from './ExpositionCard';
import { useLanguage } from './LanguageContext';
import {
  DEFAULT_EXPOSITION_FILTERS,
  EXPOSITION_FILTER_QUERY_MAP,
  buildSearchParamsWithExpositionFilters,
  hasActiveExpositionFilters,
  parseExpositionFiltersFromSearchParams,
} from '../lib/expositionsUtils';

const FILTER_KEYS = Object.keys(EXPOSITION_FILTER_QUERY_MAP);

export default function ExhibitionsPageClient({ initialExhibitions = [], supabaseAvailable = true }) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState(() =>
    parseExpositionFiltersFromSearchParams(searchParams)
  );

  useEffect(() => {
    const parsed = parseExpositionFiltersFromSearchParams(searchParams);
    setFilters(parsed);
  }, [searchParams]);

  useEffect(() => {
    if (typeof router?.prefetch !== 'function') {
      return undefined;
    }
    const prefetched = new Set();
    initialExhibitions.slice(0, 12).forEach((expo) => {
      if (expo?.museumSlug && !prefetched.has(expo.museumSlug)) {
        prefetched.add(expo.museumSlug);
        router.prefetch(`/museum/${expo.museumSlug}`);
      }
    });
    return () => {
      prefetched.clear();
    };
  }, [initialExhibitions, router]);

  const updateUrl = useCallback(
    (nextFilters) => {
      const params = buildSearchParamsWithExpositionFilters(searchParams, nextFilters);
      const query = params.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      router.replace(href, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleToggleFilter = useCallback(
    (key) => {
      if (!FILTER_KEYS.includes(key)) return;
      setFilters((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        updateUrl(next);
        return next;
      });
    },
    [updateUrl]
  );

  const handleResetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_EXPOSITION_FILTERS });
    updateUrl(DEFAULT_EXPOSITION_FILTERS);
  }, [updateUrl]);

  const filteredExhibitions = useMemo(() => {
    return initialExhibitions.filter((expo) => {
      if (!expo) return false;
      if (filters.free && expo.free !== true) return false;
      if (filters.childFriendly && expo.childFriendly !== true) return false;
      if (filters.temporary && expo.temporary !== true) return false;
      return true;
    });
  }, [filters.childFriendly, filters.free, filters.temporary, initialExhibitions]);

  const hasFiltersApplied = hasActiveExpositionFilters(filters);
  const countLabel = `${filteredExhibitions.length} ${t('results')}`;
  const emptyMessage = hasFiltersApplied ? t('noFilteredExhibitions') : t('noExhibitions');

  return (
    <div className="exhibitions-page">
      <section className="exhibitions-hero" aria-labelledby="exhibitions-page-heading">
        <div className="exhibitions-hero__content">
          <h1 id="exhibitions-page-heading" className="exhibitions-hero__title">
            {t('exhibitionsTitle')}
          </h1>
          <p className="exhibitions-hero__subtitle">{t('exhibitionsPageSubtitle')}</p>
          {!supabaseAvailable && (
            <p className="exhibitions-hero__note" role="status">
              {t('exhibitionsFallbackMessage')}
            </p>
          )}
        </div>
        <div className="exhibitions-hero__filters" role="group" aria-label={t('exhibitionFiltersTitle')}>
          <span className="exhibitions-hero__filters-label">{t('exhibitionFiltersDescription')}</span>
          <div className="museum-expositions-chips exhibitions-hero__chips">
            {FILTER_KEYS.map((key) => {
              const isActive = Boolean(filters[key]);
              const labelKey =
                key === 'free'
                  ? 'tagFree'
                  : key === 'childFriendly'
                  ? 'tagChildFriendly'
                  : 'tagTemporary';
              return (
                <button
                  key={key}
                  type="button"
                  className={`museum-expositions-chip${isActive ? ' is-active' : ''}`}
                  onClick={() => handleToggleFilter(key)}
                  aria-pressed={isActive}
                >
                  {t(labelKey)}
                </button>
              );
            })}
          </div>
          {hasFiltersApplied && (
            <button type="button" className="exhibitions-hero__reset" onClick={handleResetFilters}>
              {t('reset')}
            </button>
          )}
        </div>
      </section>

      <section className="exhibitions-results" aria-live="polite">
        <header className="exhibitions-results__header">
          <p className="exhibitions-results__count">{countLabel}</p>
          {hasFiltersApplied && (
            <button type="button" className="exhibitions-results__reset" onClick={handleResetFilters}>
              {t('reset')}
            </button>
          )}
        </header>
        {filteredExhibitions.length === 0 ? (
          <p className="exhibitions-results__empty">{emptyMessage}</p>
        ) : (
          <ul className="exhibitions-results__list">
            {filteredExhibitions.map((expo) => (
              <li key={expo.id} className="exhibitions-results__item">
                <div className="exhibitions-results__card">
                  {expo.museumName && (
                    <p className="exhibitions-results__museum">
                      {expo.museumSlug ? (
                        <Link href={`/museum/${expo.museumSlug}`} prefetch>
                          {t('exhibitionsHostedBy', { museum: expo.museumName })}
                        </Link>
                      ) : (
                        <span>{t('exhibitionsHostedBy', { museum: expo.museumName })}</span>
                      )}
                    </p>
                  )}
                  <ExpositionCard
                    exposition={expo}
                    affiliateUrl={expo.ticketAffiliateUrl || expo.museumTicketAffiliateUrl}
                    ticketUrl={expo.ticketUrl || expo.museumTicketUrl}
                    museumSlug={expo.museumSlug}
                    tags={expo.tags}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
