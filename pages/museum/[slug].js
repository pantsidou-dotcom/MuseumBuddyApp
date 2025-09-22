import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SEO from '../../components/SEO';
import ExpositionCard from '../../components/ExpositionCard';
import ExpositionCarousel from '../../components/ExpositionCarousel';
import { useLanguage } from '../../components/LanguageContext';
import { useFavorites } from '../../components/FavoritesContext';
import FiltersSheet from '../../components/FiltersSheet';
import FiltersPopover from '../../components/FiltersPopover';
import TicketButtonNote from '../../components/TicketButtonNote';
import museumImages from '../../lib/museumImages';
import museumImageCredits from '../../lib/museumImageCredits';
import museumSummaries from '../../lib/museumSummaries';
import museumOpeningHours from '../../lib/museumOpeningHours';
import museumTicketUrls from '../../lib/museumTicketUrls';
import formatImageCredit from '../../lib/formatImageCredit';
import { supabase as supabaseClient } from '../../lib/supabase';
import { shouldShowAffiliateNote } from '../../lib/nonAffiliateMuseums';

function todayYMD(tz = 'Europe/Amsterdam') {
  try {
    const fmt = new Intl.DateTimeFormat('sv-SE', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fmt.format(new Date());
  } catch (err) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}

function normaliseMuseumRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.naam,
    city: row.stad || row.city || null,
    province: row.provincie || row.province || null,
    free: Boolean(row.gratis_toegankelijk),
    websiteUrl: row.website_url || row.website || null,
    ticketAffiliateUrl: row.ticket_affiliate_url || null,
    ticketUrl: row.ticket_url || null,
    address: row.adres || row.address || null,
    addressExtra: row.adres_toevoeging || row.address_extra || null,
    postalCode: row.postcode || row.postal_code || null,
    phone: row.telefoonnummer || row.telefoon || row.phone || null,
    email: row.email || null,
    instagram: row.instagram || null,
    facebook: row.facebook || null,
    twitter: row.twitter || row.x || null,
    description:
      row.samenvatting ||
      row.korte_beschrijving ||
      row.beschrijving ||
      row.omschrijving ||
      row.description ||
      null,
    openingHours: row.openingstijden || row.opening_hours || null,
    raw: row,
  };
}

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

function normaliseExpositionRow(row, museumSlug) {
  if (!row) return null;
  const freeFlag = resolveBooleanFlag(row.gratis, row.free, row.kosteloos, row.freeEntry);
  const childFriendlyFlag = resolveBooleanFlag(
    row.kindvriendelijk,
    row.childFriendly,
    row.familievriendelijk,
    row.familyFriendly
  );
  let temporaryFlag = resolveBooleanFlag(
    row.tijdelijk,
    row.temporary,
    row.tijdelijkeTentoonstelling,
    row.temporaryExhibition
  );
  if (temporaryFlag === undefined && row.start_datum && row.eind_datum) {
    temporaryFlag = true;
  }
  const tags = {
    free: freeFlag === true,
    childFriendly: childFriendlyFlag === true,
    temporary: temporaryFlag === true,
  };
  return {
    id: row.id,
    titel: row.titel,
    start_datum: row.start_datum,
    eind_datum: row.eind_datum,
    bron_url: row.bron_url,
    ticketAffiliateUrl: row.ticket_affiliate_url || null,
    ticketUrl: row.ticket_url || null,
    museumSlug,
    description: row.beschrijving || row.omschrijving || null,
    tags,
    free: tags.free,
    childFriendly: tags.childFriendly,
    temporary: tags.temporary,
  };
}

function getLocationLines(museum) {
  if (!museum) return [];
  const lines = [];
  const addressLine = [museum.address, museum.addressExtra].filter(Boolean).join(' ');
  if (addressLine) lines.push(addressLine.trim());
  const cityLine = [museum.postalCode, museum.city].filter(Boolean).join(' ').trim();
  if (cityLine) lines.push(cityLine);
  if (museum.province && museum.province !== museum.city) {
    lines.push(museum.province);
  }
  if (!lines.length) {
    const fallback = [museum.city, museum.province].filter(Boolean).join(', ');
    if (fallback) lines.push(fallback);
  }
  return lines;
}

function ShareButton({ onShare, label }) {
  return (
    <button type="button" className="icon-button large" aria-label={label} onClick={onShare}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
        <path d="M16 6l-4-4-4 4" />
        <path d="M12 2v14" />
      </svg>
    </button>
  );
}

function FavoriteButton({ active, onToggle, label }) {
  return (
    <button
      type="button"
      className={`icon-button large${active ? ' favorited' : ''}`}
      aria-label={label}
      aria-pressed={active}
      onClick={onToggle}
    >
      <svg
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 8.25c0 4.556-9 11.25-9 11.25S3 12.806 3 8.25a5.25 5.25 0 0 1 9-3.676A5.25 5.25 0 0 1 21 8.25Z" />
      </svg>
    </button>
  );
}

const DEFAULT_EXPOSITION_FILTERS = Object.freeze({
  free: false,
  childFriendly: false,
  temporary: false,
});

const EXPOSITION_FILTER_QUERY_MAP = Object.freeze({
  free: 'expoGratis',
  childFriendly: 'expoKindvriendelijk',
  temporary: 'expoTijdelijk',
});

const DEFAULT_TAB = 'overview';
const TAB_IDS = ['overview', 'exhibitions', 'info', 'map'];
const TAB_HASHES = {
  overview: 'overzicht',
  exhibitions: 'tentoonstellingen',
  info: 'bezoekersinfo',
  map: 'kaart',
};
const TAB_LABEL_KEYS = {
  overview: 'tabOverview',
  exhibitions: 'tabExhibitions',
  info: 'tabVisitorInfo',
  map: 'tabMap',
};
const TAB_TITLE_KEYS = {
  overview: 'tabTitleOverview',
  exhibitions: 'tabTitleExhibitions',
  info: 'tabTitleVisitorInfo',
  map: 'tabTitleMap',
};
const HASH_TO_TAB = Object.entries(TAB_HASHES).reduce((acc, [id, hash]) => {
  acc[hash] = id;
  return acc;
}, {});

const DEFAULT_LANDING_MUSEUM_SLUG = 'van-gogh-museum-amsterdam';
const CONFIGURED_LANDING_SLUG =
  typeof process.env.NEXT_PUBLIC_LANDING_MUSEUM_SLUG === 'string'
    ? process.env.NEXT_PUBLIC_LANDING_MUSEUM_SLUG.trim().toLowerCase()
    : '';
const LANDING_MUSEUM_SLUG = CONFIGURED_LANDING_SLUG || DEFAULT_LANDING_MUSEUM_SLUG;

function formatLinkLabel(url) {
  if (!url) return '';
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, '');
  } catch (err) {
    return url.replace(/^https?:\/\//, '');
  }
}

function parseBooleanQueryParam(value) {
  if (Array.isArray(value)) {
    return value.some((item) => parseBooleanQueryParam(item));
  }
  if (value === undefined || value === null) return false;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return true;
    if (['1', 'true', 'yes', 'ja', 'waar'].includes(normalized)) return true;
    return false;
  }
  return Boolean(value);
}

function parseExpositionFiltersFromQuery(query = {}) {
  const filters = { ...DEFAULT_EXPOSITION_FILTERS };
  Object.entries(EXPOSITION_FILTER_QUERY_MAP).forEach(([key, param]) => {
    if (query[param] !== undefined) {
      filters[key] = parseBooleanQueryParam(query[param]);
    }
  });
  return filters;
}

function buildQueryString(query) {
  const params = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          params.append(key, String(item));
        }
      });
      return;
    }
    params.set(key, String(value));
  });
  return params.toString();
}

function buildQueryWithFilters(baseQuery, filters) {
  const nextQuery = { ...(baseQuery || {}) };
  Object.values(EXPOSITION_FILTER_QUERY_MAP).forEach((param) => {
    delete nextQuery[param];
  });
  Object.entries(EXPOSITION_FILTER_QUERY_MAP).forEach(([key, param]) => {
    if (filters?.[key]) {
      nextQuery[param] = '1';
    }
  });
  return nextQuery;
}

function areFilterStatesEqual(a, b) {
  const keys = Object.keys(EXPOSITION_FILTER_QUERY_MAP);
  return keys.every((key) => Boolean(a?.[key]) === Boolean(b?.[key]));
}

function hasActiveExpositionFilters(filters) {
  return Object.keys(EXPOSITION_FILTER_QUERY_MAP).some((key) => Boolean(filters?.[key]));
}

export default function MuseumDetailPage({ museum, expositions, error }) {
  const { lang, t } = useLanguage();
  const { favorites, toggleFavorite } = useFavorites();
  const router = useRouter();

  const resolvedMuseum = useMemo(() => (museum ? { ...museum } : null), [museum]);

  if (error) {
    return (
      <section className="museum-detail">
        <SEO title="MuseumBuddy" description={t('somethingWrong')} />
        <div className="museum-detail-container">
          <p>{t('somethingWrong')}</p>
        </div>
      </section>
    );
  }

  if (!resolvedMuseum) {
    return (
      <section className="museum-detail">
        <SEO title="MuseumBuddy" description={t('somethingWrong')} />
        <div className="museum-detail-container">
          <p>{t('somethingWrong')}</p>
        </div>
      </section>
    );
  }

  const slug = resolvedMuseum.slug;
  const isLandingMuseum = typeof slug === 'string' && slug.toLowerCase() === LANDING_MUSEUM_SLUG;
  const displayName = resolvedMuseum.name;
  const rawImage =
    museumImages[slug] ||
    resolvedMuseum.raw?.afbeelding_url ||
    resolvedMuseum.raw?.image_url ||
    null;
  const imageCredit = museumImageCredits[slug];
  const isPublicDomainImage = Boolean(imageCredit?.isPublicDomain);
  const formattedCredit = useMemo(
    () => (isPublicDomainImage ? null : formatImageCredit(imageCredit, t)),
    [imageCredit, isPublicDomainImage, t]
  );
  const creditSegments = formattedCredit?.segments || [];
  const hasCreditSegments = creditSegments.length > 0;
  const creditFullText = creditSegments.map((segment) => segment.label).join(' • ');
  const summary =
    museumSummaries[slug]?.[lang] ||
    resolvedMuseum.description ||
    resolvedMuseum.raw?.samenvatting ||
    resolvedMuseum.raw?.beschrijving ||
    resolvedMuseum.raw?.omschrijving ||
    null;
  const openingHours =
    museumOpeningHours[slug]?.[lang] ||
    resolvedMuseum.openingHours ||
    resolvedMuseum.raw?.openingstijden ||
    null;
  const affiliateTicketUrl = resolvedMuseum.ticketAffiliateUrl || museumTicketUrls[slug] || null;
  const directTicketUrl = resolvedMuseum.ticketUrl || resolvedMuseum.websiteUrl || null;
  const ticketUrl = affiliateTicketUrl || directTicketUrl;
  const showAffiliateNote = Boolean(affiliateTicketUrl) && shouldShowAffiliateNote(slug);
  const ticketContext = t(showAffiliateNote ? 'ticketsViaPartner' : 'ticketsViaOfficialSite');
  const primaryTicketNoteId = useId();
  const overviewTicketNoteId = useId();
  const mobileTicketNoteId = useId();
  const mobileActionSheetId = useId();
  const mobileActionSheetTitleId = useId();
  const locationLines = getLocationLines(resolvedMuseum);
  const locationLabel = [resolvedMuseum.city, resolvedMuseum.province].filter(Boolean).join(', ');
  const hasWebsite = Boolean(resolvedMuseum.websiteUrl);
  const hasTicketLink = Boolean(ticketUrl);

  const filtersTriggerRef = useRef(null);
  const skipNextFilterSyncRef = useRef(false);
  const expositionFiltersRef = useRef(DEFAULT_EXPOSITION_FILTERS);
  const [expositionFilters, setExpositionFilters] = useState(DEFAULT_EXPOSITION_FILTERS);
  const [pendingExpositionFilters, setPendingExpositionFilters] = useState(
    DEFAULT_EXPOSITION_FILTERS
  );
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [filtersPopoverOpen, setFiltersPopoverOpen] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);

  const syncExpositionFiltersToUrl = useCallback(
    (nextFilters) => {
      if (!router || !router.isReady) return;
      const currentQuery = router.query || {};
      const baseQuery = Object.keys(currentQuery).reduce((acc, key) => {
        if (key === 'slug') return acc;
        acc[key] = currentQuery[key];
        return acc;
      }, {});
      const currentFilters = parseExpositionFiltersFromQuery(currentQuery);
      const normalizedCurrentQuery = buildQueryWithFilters(baseQuery, currentFilters);
      const nextQuery = buildQueryWithFilters(baseQuery, nextFilters);
      const currentQueryString = buildQueryString(normalizedCurrentQuery);
      const nextQueryString = buildQueryString(nextQuery);
      if (currentQueryString === nextQueryString) return;
      skipNextFilterSyncRef.current = true;
      router.replace(
        {
          pathname: `/museum/${slug}`,
          query: nextQuery,
        },
        undefined,
        { shallow: true, scroll: false }
      );
    },
    [router, slug]
  );

  const heroImage = useMemo(() => {
    if (!rawImage) return null;
    if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) return rawImage;
    if (rawImage.startsWith('/')) return rawImage;
    return `/${rawImage}`;
  }, [rawImage]);

  const favoritePayload = useMemo(
    () => ({
      id: resolvedMuseum.id,
      slug,
      title: displayName,
      city: resolvedMuseum.city,
      province: resolvedMuseum.province,
      free: resolvedMuseum.free,
      image: heroImage || rawImage,
      imageCredit,
      ticketUrl,
      type: 'museum',
    }),
    [
      resolvedMuseum.id,
      slug,
      displayName,
      resolvedMuseum.city,
      resolvedMuseum.province,
      resolvedMuseum.free,
      heroImage,
      rawImage,
      imageCredit,
      ticketUrl,
    ]
  );

  const triggerHapticFeedback = useCallback(
    async (intensity = 'medium') => {
      if (typeof window === 'undefined') return;
      try {
        if (Capacitor?.isNativePlatform?.()) {
          const haptics = Capacitor.Plugins?.Haptics;
          if (haptics?.impact) {
            const style =
              intensity === 'heavy'
                ? 'HEAVY'
                : intensity === 'light'
                ? 'LIGHT'
                : 'MEDIUM';
            await haptics.impact({ style });
            return;
          }
        }
        if (window.navigator?.vibrate) {
          window.navigator.vibrate(intensity === 'light' ? 18 : 32);
        }
      } catch (err) {
        if (window.navigator?.vibrate) {
          window.navigator.vibrate(20);
        }
      }
    },
    []
  );

  const openExternalLink = useCallback(
    async (url, event, { preferApp = false } = {}) => {
      if (!url || typeof window === 'undefined') return false;
      try {
        if (Capacitor?.isNativePlatform?.()) {
          event?.preventDefault();
          event?.stopPropagation();
          const plugins = Capacitor.Plugins || {};
          if (preferApp && plugins.App?.openUrl) {
            try {
              await plugins.App.openUrl({ url });
              return true;
            } catch (appError) {
              // fall through to browser fallback
            }
          }
          if (plugins.Browser?.open) {
            await plugins.Browser.open({ url, presentationStyle: 'fullscreen' });
            return true;
          }
        }
      } catch (err) {
        // ignore and fall back to default navigation
      }

      if (!event) {
        try {
          window.open(url, '_blank', 'noopener');
        } catch (err) {
          window.location.href = url;
        }
        return true;
      }

      return false;
    },
    []
  );

  const isFavorite = favorites.some((fav) => fav.id === resolvedMuseum.id && fav.type === 'museum');

  const handleFavorite = useCallback(() => {
    toggleFavorite(favoritePayload);
    triggerHapticFeedback(isFavorite ? 'light' : 'medium');
  }, [favoritePayload, isFavorite, toggleFavorite, triggerHapticFeedback]);

  const handleShare = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/museum/${slug}`;
    const shareData = {
      title: displayName,
      text: `${t('view')} ${displayName}`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // ignore and fall back
      }
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        alert(t('linkCopied'));
        return;
      } catch (err) {
        // ignore and fall back
      }
    }

    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      window.prompt(t('copyThisLink'), url);
    }
  }, [displayName, slug, t]);

  const handleShareFromSheet = useCallback(() => {
    setMobileActionsOpen(false);
    handleShare();
  }, [handleShare]);

  const handleTicketLinkClick = useCallback(
    (event) => {
      if (!ticketUrl) return;
      openExternalLink(ticketUrl, event);
    },
    [openExternalLink, ticketUrl]
  );

  const handleWebsiteLinkClick = useCallback(
    (event) => {
      if (!resolvedMuseum.websiteUrl) return;
      openExternalLink(resolvedMuseum.websiteUrl, event);
    },
    [openExternalLink, resolvedMuseum.websiteUrl]
  );

  const hasMobilePrimaryActions = hasTicketLink || hasWebsite;

  const handleToggleMobileActions = useCallback(() => {
    setMobileActionsOpen((prev) => !prev);
  }, []);

  const handleCloseMobileActions = useCallback(() => {
    setMobileActionsOpen(false);
  }, []);

  const handleMobileTicketAction = useCallback(async () => {
    setMobileActionsOpen(false);
    if (!ticketUrl) return;
    await openExternalLink(ticketUrl);
  }, [openExternalLink, ticketUrl]);

  const handleMobileWebsiteAction = useCallback(async () => {
    setMobileActionsOpen(false);
    if (!resolvedMuseum.websiteUrl) return;
    await openExternalLink(resolvedMuseum.websiteUrl);
  }, [openExternalLink, resolvedMuseum.websiteUrl]);

  useEffect(() => {
    if (!hasMobilePrimaryActions) {
      setMobileActionsOpen(false);
    }
  }, [hasMobilePrimaryActions]);

  useEffect(() => {
    if (!mobileActionsOpen || typeof document === 'undefined') return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileActionsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileActionsOpen]);

  useEffect(() => {
    if (!mobileActionsOpen || typeof document === 'undefined') return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileActionsOpen]);

  const seoDescription = summary || t('museumDescription', { name: displayName });
  const canonical = `/museum/${slug}`;

  const expositionItems = useMemo(
    () =>
      Array.isArray(expositions)
        ? expositions.map((row) => normaliseExpositionRow(row, slug)).filter(Boolean)
        : [],
    [expositions, slug]
  );
  const filteredExpositionItems = useMemo(() => {
    const activeKeys = Object.keys(EXPOSITION_FILTER_QUERY_MAP).filter(
      (key) => expositionFilters[key]
    );
    if (activeKeys.length === 0) return expositionItems;
    return expositionItems.filter((exposition) =>
      activeKeys.every((key) => Boolean(exposition?.tags?.[key]))
    );
  }, [expositionItems, expositionFilters]);
  const hasActiveExpositionFilter = useMemo(
    () => hasActiveExpositionFilters(expositionFilters),
    [expositionFilters]
  );
  const [activeExpositionSlide, setActiveExpositionSlide] = useState(0);

  useEffect(() => {
    setActiveExpositionSlide((prev) => {
      if (!filteredExpositionItems.length) return 0;
      return prev >= filteredExpositionItems.length
        ? filteredExpositionItems.length - 1
        : prev;
    });
  }, [filteredExpositionItems.length]);

  const expositionFiltersSignature = useMemo(
    () => JSON.stringify(expositionFilters),
    [expositionFilters]
  );

  useEffect(() => {
    setActiveExpositionSlide(0);
  }, [expositionFiltersSignature]);

  const expositionCarouselLabels = useMemo(
    () => ({
      previous: t('carouselPrevious'),
      next: t('carouselNext'),
      pagination: t('carouselPagination'),
      goToSlide: (target) => t('carouselGoTo', { target }),
      slide: (current, total) => t('carouselSlide', { current, total }),
      instructions: t('carouselInstructions'),
    }),
    [t]
  );

  const socialLinks = useMemo(() => {
    const links = [];
    if (resolvedMuseum.instagram) {
      const value = resolvedMuseum.instagram;
      const url = value.startsWith('http') ? value : `https://instagram.com/${value.replace(/^@/, '')}`;
      links.push({ label: 'Instagram', value, url });
    }
    if (resolvedMuseum.facebook) {
      const value = resolvedMuseum.facebook;
      const url = value.startsWith('http') ? value : `https://facebook.com/${value.replace(/^@/, '')}`;
      links.push({ label: 'Facebook', value, url });
    }
    if (resolvedMuseum.twitter) {
      const value = resolvedMuseum.twitter;
      const url = value.startsWith('http') ? value : `https://twitter.com/${value.replace(/^@/, '')}`;
      links.push({ label: 'Twitter', value, url });
    }
    return links;
  }, [resolvedMuseum.instagram, resolvedMuseum.facebook, resolvedMuseum.twitter]);

  const tabDefinitions = useMemo(
    () =>
      TAB_IDS.map((id) => ({
        id,
        hash: TAB_HASHES[id],
        label: t(TAB_LABEL_KEYS[id]),
        title: t(TAB_TITLE_KEYS[id]),
      })),
    [t]
  );

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const initialHash = window.location.hash.replace('#', '').toLowerCase();
      if (initialHash && HASH_TO_TAB[initialHash]) {
        return HASH_TO_TAB[initialHash];
      }
    }
    return DEFAULT_TAB;
  });

  const applyActiveExpositionFilters = useCallback(
    (updater) => {
      const current = expositionFiltersRef.current;
      const next =
        typeof updater === 'function' ? updater(current) : { ...current, ...updater };
      expositionFiltersRef.current = next;
      setExpositionFilters(next);
      setPendingExpositionFilters(next);
      syncExpositionFiltersToUrl(next);
      if (hasActiveExpositionFilters(next)) {
        setActiveTab('exhibitions');
      }
    },
    [setActiveTab, syncExpositionFiltersToUrl]
  );

  useEffect(() => {
    expositionFiltersRef.current = expositionFilters;
  }, [expositionFilters]);

  useEffect(() => {
    if (!router || !router.isReady) return;
    const nextFilters = parseExpositionFiltersFromQuery(router.query);
    setPendingExpositionFilters(nextFilters);
    if (skipNextFilterSyncRef.current) {
      skipNextFilterSyncRef.current = false;
      return;
    }
    if (!areFilterStatesEqual(nextFilters, expositionFiltersRef.current)) {
      expositionFiltersRef.current = nextFilters;
      setExpositionFilters(nextFilters);
      if (hasActiveExpositionFilters(nextFilters)) {
        setActiveTab('exhibitions');
      }
    }
  }, [
    router,
    router?.isReady,
    router?.query?.expoGratis,
    router?.query?.expoKindvriendelijk,
    router?.query?.expoTijdelijk,
    setActiveTab,
  ]);

  const handleChipToggle = useCallback(
    (key) => {
      applyActiveExpositionFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    [applyActiveExpositionFilters]
  );

  const handleExpositionFilterChange = useCallback((name, value) => {
    setPendingExpositionFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleApplyExpositionFilters = useCallback(() => {
    applyActiveExpositionFilters(pendingExpositionFilters);
    setFiltersSheetOpen(false);
    setFiltersPopoverOpen(false);
  }, [pendingExpositionFilters, applyActiveExpositionFilters]);

  const handleResetExpositionFilters = useCallback(() => {
    setPendingExpositionFilters(DEFAULT_EXPOSITION_FILTERS);
    applyActiveExpositionFilters(DEFAULT_EXPOSITION_FILTERS);
    setFiltersSheetOpen(false);
    setFiltersPopoverOpen(false);
  }, [applyActiveExpositionFilters]);

  const handleOpenFiltersSheet = useCallback(() => {
    setPendingExpositionFilters(expositionFiltersRef.current);
    setFiltersSheetOpen(true);
    setFiltersPopoverOpen(false);
  }, []);

  const handleToggleFiltersPopover = useCallback(() => {
    setFiltersSheetOpen(false);
    setFiltersPopoverOpen((prev) => {
      const next = !prev;
      if (next) {
        setPendingExpositionFilters(expositionFiltersRef.current);
      }
      return next;
    });
  }, []);

  const handleCloseFiltersSheet = useCallback(() => {
    setFiltersSheetOpen(false);
    setPendingExpositionFilters(expositionFiltersRef.current);
  }, []);

  const handleCloseFiltersPopover = useCallback(() => {
    setFiltersPopoverOpen(false);
    setPendingExpositionFilters(expositionFiltersRef.current);
  }, []);

  const filterChipDefinitions = useMemo(
    () => [
      { key: 'free', label: t('tagFree') },
      { key: 'childFriendly', label: t('tagChildFriendly') },
      { key: 'temporary', label: t('tagTemporary') },
    ],
    [t]
  );

  const expositionFilterSections = useMemo(
    () => [
      {
        id: 'exposition-filters',
        title: t('exhibitionFiltersGroupTitle'),
        options: [
          { name: 'free', label: t('tagFree') },
          { name: 'childFriendly', label: t('tagChildFriendly') },
          { name: 'temporary', label: t('tagTemporary') },
        ],
      },
    ],
    [t]
  );

  const expositionFilterLabels = useMemo(
    () => ({
      title: t('exhibitionFiltersTitle'),
      description: t('exhibitionFiltersDescription'),
      apply: t('filtersApply'),
      reset: t('filtersReset'),
      close: t('filtersClose'),
    }),
    [t]
  );

  const expositionFiltersButtonLabel = t('exhibitionFiltersButton');

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleHashChange = () => {
      const nextHash = window.location.hash.replace('#', '').toLowerCase();
      if (nextHash && HASH_TO_TAB[nextHash]) {
        setActiveTab(HASH_TO_TAB[nextHash]);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = TAB_HASHES[activeTab] || TAB_HASHES[DEFAULT_TAB];
    if (!hash) return;
    const nextHash = `#${hash}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash);
    }
  }, [activeTab]);

  const handleTabSelect = useCallback(
    (tabId) => {
      if (!tabDefinitions.some((tab) => tab.id === tabId)) return;
      setActiveTab(tabId);
      const hash = TAB_HASHES[tabId];
      if (typeof window !== 'undefined' && hash) {
        const scrollToPanel = () => {
          const panel = document.getElementById(hash);
          if (panel) {
            panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        };
        if (typeof window.requestAnimationFrame === 'function') {
          window.requestAnimationFrame(scrollToPanel);
        } else {
          scrollToPanel();
        }
      }
    },
    [tabDefinitions]
  );

  const handleTabKeyDown = useCallback(
    (event, currentIndex) => {
      if (!tabDefinitions.length) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = (currentIndex + direction + tabDefinitions.length) % tabDefinitions.length;
        const nextTab = tabDefinitions[nextIndex];
        if (nextTab) {
          setActiveTab(nextTab.id);
          if (typeof document !== 'undefined') {
            const button = document.getElementById(`museum-tab-${nextTab.id}`);
            if (button) {
              button.focus();
            }
          }
        }
      }
    },
    [tabDefinitions]
  );

  const overviewDetails = [];
  if (locationLines.length > 0) {
    overviewDetails.push({
      key: 'location',
      label: t('location'),
      lines: locationLines,
    });
  }
  if (openingHours) {
    overviewDetails.push({
      key: 'hours',
      label: t('openingHours'),
      value: openingHours,
    });
  }
  if (resolvedMuseum.free) {
    overviewDetails.push({
      key: 'free',
      label: t('visitorInformation'),
      value: t('free'),
    });
  }
  if (hasWebsite) {
    overviewDetails.push({
      key: 'website',
      label: t('website'),
      value: resolvedMuseum.websiteUrl,
      href: resolvedMuseum.websiteUrl,
    });
  }
  if (hasTicketLink) {
    overviewDetails.push({
      key: 'tickets',
      label: t('buyTickets'),
      value: ticketUrl,
      href: ticketUrl,
      note: ticketContext,
      noteId: overviewTicketNoteId,
    });
  }

  const mapQueryParts = [displayName, ...locationLines];
  if (!locationLines.length) {
    mapQueryParts.push(resolvedMuseum.address, resolvedMuseum.city, resolvedMuseum.province);
  }
  const mapQuery = mapQueryParts.filter(Boolean).join(', ');
  const mapEmbedUrl = mapQuery ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed` : null;
  const mapDirectionsUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : null;

  const handleMapDirectionsClick = useCallback(
    (event) => {
      if (!mapDirectionsUrl) return;
      openExternalLink(mapDirectionsUrl, event, { preferApp: true });
    },
    [mapDirectionsUrl, openExternalLink]
  );

  const mobileActionsToggleLabel = mobileActionsOpen
    ? t('mobileActionsCloseLabel')
    : t('mobileActionsOpenLabel');
  const mobileActionsTitle = t('mobileActionsTitle');

  return (
    <section className={`museum-detail${heroImage ? ' has-hero' : ''}`}>
      <SEO title={`${displayName} — MuseumBuddy`} description={seoDescription} image={heroImage} canonical={canonical} />
      <FiltersSheet
        open={filtersSheetOpen}
        filters={pendingExpositionFilters}
        onChange={handleExpositionFilterChange}
        onApply={handleApplyExpositionFilters}
        onReset={handleResetExpositionFilters}
        onClose={handleCloseFiltersSheet}
        labels={expositionFilterLabels}
        sections={expositionFilterSections}
        idPrefix="exposition-filters-sheet"
      />

      <div className="museum-detail-container museum-hero-heading-container">
        <div className="museum-hero-heading">
          <nav className="museum-breadcrumbs" aria-label={t('breadcrumbsLabel')}>
            <Link href="/" className="museum-backlink">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                width="20"
                height="20"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span>{t('breadcrumbMuseums')}</span>
            </Link>
          </nav>

          <div className="museum-hero-text">
            {locationLabel && <p className="detail-sub museum-hero-location">{locationLabel}</p>}
            <h1 className="detail-title museum-hero-title">{displayName}</h1>
            {summary && <p className="detail-sub museum-hero-tagline">{summary}</p>}
          </div>
        </div>
      </div>

      {heroImage && (
        <div className="museum-detail-hero">
          <Image
            src={heroImage}
            alt={displayName}
            fill
            className="museum-hero-image"
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 90vw, 1200px"
            priority={isLandingMuseum}
            loading={isLandingMuseum ? 'eager' : 'lazy'}
          />
          {!isPublicDomainImage && hasCreditSegments && (
            <p className="museum-hero-credit" title={creditFullText || undefined}>
              {creditSegments.map((segment, index) => (
                <Fragment key={`hero-credit-${segment.key}-${index}`}>
                  {index > 0 && (
                    <span aria-hidden="true" className="image-credit-divider">
                      •
                    </span>
                  )}
                  {segment.url ? (
                    <a
                      className="image-credit-link"
                      href={segment.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {segment.label}
                    </a>
                  ) : (
                    <span className="image-credit-part">{segment.label}</span>
                  )}
                </Fragment>
              ))}
            </p>
          )}
        </div>
      )}

      <div className="museum-detail-container">

        <div className="museum-primary-action-bar">
        <div className="museum-primary-action-group">
          {hasTicketLink ? (
            <a
              href={ticketUrl}
              target="_blank"
              rel="noreferrer"
              className="museum-primary-action primary"
              aria-describedby={ticketContext ? primaryTicketNoteId : undefined}
              onClick={handleTicketLinkClick}
            >
              <span className="ticket-button__label">{t('buyTickets')}</span>
              {ticketContext ? (
                <TicketButtonNote affiliate={showAffiliateNote} id={primaryTicketNoteId}>
                  {ticketContext}
                </TicketButtonNote>
              ) : null}
            </a>
          ) : (
            <button type="button" className="museum-primary-action primary" disabled aria-disabled="true">
              <span className="ticket-button__label">{t('buyTickets')}</span>
            </button>
          )}

          {hasWebsite && (
            <a
              href={resolvedMuseum.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="museum-primary-action secondary"
              onClick={handleWebsiteLinkClick}
            >
              <span>{t('website')}</span>
            </a>
          )}
        </div>

          <div className="museum-primary-action-utility">
            <ShareButton onShare={handleShare} label={t('share')} />
            <FavoriteButton active={isFavorite} onToggle={handleFavorite} label={t('save')} />
          </div>
        </div>

        <div className="museum-detail-grid">
          <div className="museum-detail-main">
            <div className="museum-tablist" role="tablist" aria-label={t('museumTabsLabel')}>
              {tabDefinitions.map((tab, index) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`museum-tab-${tab.id}`}
                    aria-controls={tab.hash}
                    aria-selected={isActive}
                    aria-label={tab.title}
                    tabIndex={isActive ? 0 : -1}
                    className={`museum-tab${isActive ? ' is-active' : ''}`}
                    onClick={() => handleTabSelect(tab.id)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <section
              id={TAB_HASHES.overview}
              role="tabpanel"
              aria-labelledby="museum-tab-overview"
              className="museum-tabpanel"
              hidden={activeTab !== 'overview'}
              aria-hidden={activeTab !== 'overview'}
              tabIndex={activeTab === 'overview' ? 0 : -1}
            >
              <div className="museum-overview-card">
                <h2 className="museum-overview-title">{t('tabOverview')}</h2>
                {summary && <p className="museum-overview-text">{summary}</p>}
                {overviewDetails.length > 0 && (
                  <ul className="museum-overview-list">
                    {overviewDetails.map((detail) => {
                      const detailClickHandler =
                        detail.key === 'tickets'
                          ? handleTicketLinkClick
                          : detail.key === 'website'
                          ? handleWebsiteLinkClick
                          : undefined;
                      return (
                        <li key={detail.key} className="museum-overview-list-item">
                          <span className="museum-overview-label">{detail.label}</span>
                          <span className="museum-overview-value">
                            {detail.href ? (
                              <>
                                <a
                                  href={detail.href}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-describedby={
                                    detail.note && detail.noteId ? detail.noteId : undefined
                                  }
                                  onClick={detailClickHandler}
                                >
                                  {formatLinkLabel(detail.href) || detail.value}
                                </a>
                                {detail.note ? (
                                  <span className="museum-overview-note" id={detail.noteId}>
                                    {detail.note}
                                  </span>
                                ) : null}
                              </>
                            ) : detail.lines ? (
                              detail.lines.map((line, index) => (
                                <span key={`${detail.key}-${index}`} className="museum-overview-line">
                                  {line}
                                </span>
                              ))
                            ) : (
                              detail.value
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>

            <section
              id={TAB_HASHES.exhibitions}
              role="tabpanel"
              aria-labelledby="museum-tab-exhibitions"
              className="museum-tabpanel"
              hidden={activeTab !== 'exhibitions'}
              aria-hidden={activeTab !== 'exhibitions'}
              tabIndex={activeTab === 'exhibitions' ? 0 : -1}
            >
              <div className="museum-expositions-card">
                <div className="museum-expositions-body">
                  <h2 className="museum-expositions-heading">{t('exhibitionsTitle')}</h2>
                  <div className="museum-expositions-filters">
                    <div className="museum-expositions-chips">
                      {filterChipDefinitions.map((chip) => {
                        const isActive = Boolean(expositionFilters[chip.key]);
                        return (
                          <button
                            key={chip.key}
                            type="button"
                            className={`museum-expositions-chip${isActive ? ' is-active' : ''}`}
                            onClick={() => handleChipToggle(chip.key)}
                            aria-pressed={isActive}
                          >
                            {chip.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="museum-expositions-filter-actions">
                      <button
                        type="button"
                        className="museum-expositions-filter-button museum-expositions-filter-button--popover"
                        onClick={handleToggleFiltersPopover}
                        aria-haspopup="dialog"
                        aria-expanded={filtersPopoverOpen}
                        ref={filtersTriggerRef}
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
                        <span>{expositionFiltersButtonLabel}</span>
                      </button>
                      <button
                        type="button"
                        className="museum-expositions-filter-button museum-expositions-filter-button--sheet"
                        onClick={handleOpenFiltersSheet}
                        aria-haspopup="dialog"
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
                        <span>{expositionFiltersButtonLabel}</span>
                      </button>
                      <FiltersPopover
                        open={filtersPopoverOpen}
                        filters={pendingExpositionFilters}
                        onChange={handleExpositionFilterChange}
                        onApply={handleApplyExpositionFilters}
                        onReset={handleResetExpositionFilters}
                        onClose={handleCloseFiltersPopover}
                        labels={expositionFilterLabels}
                        sections={expositionFilterSections}
                        triggerRef={filtersTriggerRef}
                        idPrefix="exposition-filters-popover"
                      />
                    </div>
                  </div>
                  {filteredExpositionItems.length > 0 ? (
                    <ExpositionCarousel
                      items={filteredExpositionItems}
                      ariaLabel={t('exhibitionsTitle')}
                      activeSlide={activeExpositionSlide}
                      onActiveSlideChange={setActiveExpositionSlide}
                      getItemKey={(exposition) => exposition.id}
                      labels={expositionCarouselLabels}
                      renderItem={(exposition) => (
                        <ExpositionCard
                          exposition={exposition}
                          affiliateUrl={affiliateTicketUrl}
                          ticketUrl={directTicketUrl}
                          museumSlug={slug}
                          tags={exposition.tags}
                        />
                      )}
                    />
                  ) : (
                    <p className="museum-expositions-empty">
                      {hasActiveExpositionFilter ? t('noFilteredExhibitions') : t('noExhibitions')}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section
              id={TAB_HASHES.map}
              role="tabpanel"
              aria-labelledby="museum-tab-map"
              className="museum-tabpanel"
              hidden={activeTab !== 'map'}
              aria-hidden={activeTab !== 'map'}
              tabIndex={activeTab === 'map' ? 0 : -1}
            >
              <div className="museum-map-card">
                <h2 className="museum-map-title">{t('tabMap')}</h2>
                {mapEmbedUrl ? (
                  <>
                    <div className="museum-map-embed">
                      <iframe
                        src={mapEmbedUrl}
                        title={`${displayName} — ${t('tabMap')}`}
                        loading="lazy"
                        allowFullScreen
                      />
                    </div>
                    {mapDirectionsUrl && (
                      <a
                        className="museum-map-link"
                        href={mapDirectionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={handleMapDirectionsClick}
                      >
                        {t('mapDirections')}
                      </a>
                    )}
                  </>
                ) : (
                  <p className="museum-map-empty">{t('mapUnavailable')}</p>
                )}
              </div>
            </section>
          </div>

          <aside
            className={`museum-sidebar museum-tabpanel${activeTab === 'info' ? ' is-active' : ''}`}
            role="tabpanel"
            id={TAB_HASHES.info}
            aria-labelledby="museum-tab-info"
            hidden={activeTab !== 'info'}
            aria-hidden={activeTab !== 'info'}
            tabIndex={activeTab === 'info' ? 0 : -1}
          >
            <div className="museum-sidebar-card support-card">
              <h2 className="museum-sidebar-title">{t('visitorInformation')}</h2>

              <div className="museum-info-details">
                {openingHours && (
                  <div className="museum-info-item">
                    <span className="museum-info-label">{t('openingHours')}</span>
                    <p className="museum-info-value">{openingHours}</p>
                  </div>
                )}

                {locationLines.length > 0 && (
                  <div className="museum-info-item">
                    <span className="museum-info-label">{t('location')}</span>
                    <p className="museum-info-value">
                      {locationLines.map((line, index) => (
                        <span key={line}>
                          {line}
                          {index < locationLines.length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  </div>
                )}

                {resolvedMuseum.free && (
                  <div className="museum-info-item">
                    <span className="museum-info-label">{t('visitorInformation')}</span>
                    <p className="museum-info-value">{t('free')}</p>
                  </div>
                )}

                {resolvedMuseum.phone && (
                  <div className="museum-info-item">
                    <span className="museum-info-label">{t('phone')}</span>
                    <p className="museum-info-value">
                      <a href={`tel:${resolvedMuseum.phone}`}>{resolvedMuseum.phone}</a>
                    </p>
                  </div>
                )}

                {resolvedMuseum.email && (
                  <div className="museum-info-item">
                    <span className="museum-info-label">{t('email')}</span>
                    <p className="museum-info-value">
                      <a href={`mailto:${resolvedMuseum.email}`}>{resolvedMuseum.email}</a>
                    </p>
                  </div>
                )}

                {socialLinks.length > 0 && (
                  <div className="museum-info-item">
                    <span className="museum-info-label">{t('social')}</span>
                    <p className="museum-info-value">
                      {socialLinks.map((item) => (
                        <span key={item.url} style={{ display: 'block' }}>
                          <a href={item.url} target="_blank" rel="noreferrer">
                            {item.value}
                          </a>
                        </span>
                      ))}
                    </p>
                  </div>
                )}
              </div>

            </div>
          </aside>
        </div>
      </div>

      {hasMobilePrimaryActions ? (
        <div className={`museum-mobile-actions${mobileActionsOpen ? ' is-open' : ''}`}>
          <button
            type="button"
            className="museum-mobile-actions__fab"
            aria-expanded={mobileActionsOpen}
            aria-controls={mobileActionSheetId}
            onClick={handleToggleMobileActions}
            aria-label={mobileActionsToggleLabel}
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
              <path d="M3.75 7.5A1.75 1.75 0 0 1 5.5 5.75h13a1.75 1.75 0 0 1 1.75 1.75v2.1a2 2 0 1 0 0 4v2.1A1.75 1.75 0 0 1 18.5 17.5h-13A1.75 1.75 0 0 1 3.75 15.7v-2.1a2 2 0 1 0 0-4Z" />
              <path d="M12 8.25v7.5" />
              <path d="M9.75 12h4.5" />
            </svg>
          </button>
          <div
            className="museum-mobile-actions__backdrop"
            role="presentation"
            aria-hidden="true"
            onClick={handleCloseMobileActions}
          />
          <div
            className="museum-mobile-actions__sheet"
            role="dialog"
            aria-modal="true"
            id={mobileActionSheetId}
            aria-labelledby={mobileActionSheetTitleId}
            aria-hidden={!mobileActionsOpen}
            tabIndex={-1}
          >
            <div className="museum-mobile-actions__handle" aria-hidden="true" />
            <div className="museum-mobile-actions__header">
              <h2 id={mobileActionSheetTitleId} className="museum-mobile-actions__title">
                {mobileActionsTitle}
              </h2>
              <button
                type="button"
                className="museum-mobile-actions__close"
                onClick={handleCloseMobileActions}
                aria-label={t('close')}
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
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="museum-mobile-actions__body">
              <div className="museum-mobile-actions__actions">
                {hasTicketLink ? (
                  <button
                    type="button"
                    className="museum-primary-action primary museum-mobile-actions__action"
                    onClick={handleMobileTicketAction}
                    aria-describedby={ticketContext ? mobileTicketNoteId : undefined}
                  >
                    <span className="ticket-button__label">{t('buyTickets')}</span>
                    {ticketContext ? (
                      <TicketButtonNote affiliate={showAffiliateNote} id={mobileTicketNoteId}>
                        {ticketContext}
                      </TicketButtonNote>
                    ) : null}
                  </button>
                ) : null}
                {hasWebsite ? (
                  <button
                    type="button"
                    className="museum-primary-action secondary museum-mobile-actions__action"
                    onClick={handleMobileWebsiteAction}
                  >
                    <span>{t('website')}</span>
                  </button>
                ) : null}
              </div>
              <div className="museum-mobile-actions__utility">
                <ShareButton onShare={handleShareFromSheet} label={t('share')} />
                <FavoriteButton active={isFavorite} onToggle={handleFavorite} label={t('save')} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </section>
  );
}

export async function getStaticProps({ params }) {
  const rawSlug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const slug = typeof rawSlug === 'string' ? rawSlug.toLowerCase() : null;

  if (!slug) {
    return { notFound: true };
  }

  if (!supabaseClient) {
    return {
      props: {
        error: 'missingSupabase',
        museum: null,
        expositions: [],
      },
    };
  }

  try {
    const { data: museumRow, error: museumError } = await supabaseClient
      .from('musea')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (museumError) {
      if (museumError.code === 'PGRST116') {
        return { notFound: true };
      }
      return {
        props: {
          error: 'museumQueryFailed',
          museum: null,
          expositions: [],
        },
      };
    }

    if (!museumRow) {
      return { notFound: true };
    }

    const museum = normaliseMuseumRow(museumRow);

    const today = todayYMD('Europe/Amsterdam');
    let expoRows = [];
    const expoQuery = supabaseClient
      .from('exposities')
      .select('*')
      .eq('museum_id', museumRow.id)
      .order('start_datum', { ascending: true });

    if (today) {
      expoQuery.or(`eind_datum.gte.${today},eind_datum.is.null`);
    }

    const { data: expoData, error: expoError } = await expoQuery;
    if (!expoError && Array.isArray(expoData)) {
      expoRows = expoData;
    }

    return {
      props: {
        museum,
        expositions: expoRows,
        error: null,
      },
    };
  } catch (err) {
    return {
      props: {
        error: 'unknown',
        museum: null,
        expositions: [],
      },
    };
  }
}

export async function getStaticPaths() {
  const slugs = new Set();

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('musea').select('slug');
      if (!error && Array.isArray(data)) {
        data.forEach((row) => {
          if (row?.slug) {
            slugs.add(row.slug);
          }
        });
      }
    } catch (err) {
      // ignore and fall back to static keys
    }
  }

  if (slugs.size === 0) {
    [museumImages, museumSummaries, museumOpeningHours, museumTicketUrls].forEach((collection) => {
      if (!collection) return;
      Object.keys(collection).forEach((key) => {
        if (key) {
          slugs.add(key);
        }
      });
    });
  }

  const paths = Array.from(slugs).map((slug) => ({
    params: { slug },
  }));

  return { paths, fallback: false };
}
