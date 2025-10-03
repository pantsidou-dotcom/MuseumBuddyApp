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
import resolveMuseumSlug from '../lib/resolveMuseumSlug';
import museumTicketUrls from '../lib/museumTicketUrls';

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
      const linkSlug =
        expo?.museumSlug ||
        expo?.canonicalMuseumSlug ||
        resolveMuseumSlug(expo?.museumSlug, expo?.museumName);
      if (linkSlug && !prefetched.has(linkSlug)) {
        prefetched.add(linkSlug);
        router.prefetch(`/museum/${linkSlug}`);
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
      <header
        className="home-hero home-hero--exhibitions"
        aria-labelledby="exhibitions-page-heading"
      >
        <div className="home-hero__inner">
          <div className="home-hero__copy">
            <span className="home-hero__eyebrow">{t('exhibitionsEyebrow')}</span>
            <h1 id="exhibitions-page-heading" className="home-hero__title">
              {t('exhibitionsTitle')}
            </h1>
            <p className="home-hero__subtitle">{t('exhibitionsPageSubtitle')}</p>
            {!supabaseAvailable && (
              <p className="exhibitions-hero__note" role="status">
                {t('exhibitionsFallbackMessage')}
              </p>
            )}
            <div className="home-hero__cta-row">
              <a
                href="#exhibitions-result-list"
                className="home-hero__cta home-hero__cta--primary"
              >
                {t('exhibitionsPrimaryCta')}
              </a>
              <Link href="/" className="home-hero__cta home-hero__cta--secondary">
                {t('exhibitionsSecondaryCta')}
              </Link>
            </div>
          </div>
          <div
            className="home-hero__form exhibitions-hero__form"
            role="group"
            aria-label={t('exhibitionFiltersTitle')}
          >
            <span className="exhibitions-hero__filters-label">
              {t('exhibitionFiltersDescription')}
            </span>
            <div className="home-hero__quick-actions exhibitions-hero__quick-actions">
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
                    className={`home-hero__toggle exhibitions-hero__toggle${
                      isActive ? ' is-active' : ''
                    }`}
                    onClick={() => handleToggleFilter(key)}
                    aria-pressed={isActive}
                  >
                    {t(labelKey)}
                  </button>
                );
              })}
            </div>
            {hasFiltersApplied && (
              <button
                type="button"
                className="home-hero__reset exhibitions-hero__reset"
                onClick={handleResetFilters}
              >
                {t('reset')}
              </button>
            )}
          </div>
        </div>
      </header>

      <section
        id="exhibitions-result-list"
        className="home-results exhibitions-results"
        aria-live="polite"
      >
        <div className="home-results__meta exhibitions-results__meta">
          <p className="count">{countLabel}</p>
          {hasFiltersApplied && (
            <button
              type="button"
              className="exhibitions-results__reset"
              onClick={handleResetFilters}
            >
              {t('reset')}
            </button>
          )}
        </div>
        {filteredExhibitions.length === 0 ? (
          <p className="exhibitions-results__empty">{emptyMessage}</p>
        ) : (
          <ul className="grid exhibitions-results__list">
            {filteredExhibitions.map((expo) => {
              const canonicalSlug =
                expo.canonicalMuseumSlug || resolveMuseumSlug(expo.museumSlug, expo.museumName);
              const linkSlug = expo.museumSlug || canonicalSlug;
              const ticketLookupSlug = canonicalSlug || linkSlug;
              const affiliateLink =
                expo.ticketAffiliateUrl ||
                expo.museumTicketAffiliateUrl ||
                (ticketLookupSlug ? museumTicketUrls[ticketLookupSlug] : null);
              const ticketLink =
                expo.ticketUrl ||
                expo.museumTicketUrl ||
                (ticketLookupSlug ? museumTicketUrls[ticketLookupSlug] : null);

              return (
                <li key={expo.id} className="exhibitions-results__item">
                  <ExpositionCard
                    exposition={expo}
                    affiliateUrl={affiliateLink}
                    ticketUrl={ticketLink}
                    museumSlug={linkSlug}
                    canonicalMuseumSlug={canonicalSlug}
                    tags={expo.tags}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
