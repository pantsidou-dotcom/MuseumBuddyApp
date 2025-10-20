import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import MuseumCard from '../components/MuseumCard';
import SEO from '../components/SEO';
import { useLanguage } from '../components/LanguageContext';
import museumImages from '../lib/museumImages';
import museumNames from '../lib/museumNames';
import museumImageCredits from '../lib/museumImageCredits';
import museumTicketUrls from '../lib/museumTicketUrls';
import { getMuseumCategories } from '../lib/museumCategories';
import { supabase as supabaseClient } from '../lib/supabase';
import Button from '../components/ui/Button';
import parseBooleanParam from '../lib/parseBooleanParam.js';
import { DEFAULT_TIME_ZONE, isMuseumOpenNow } from '../lib/openingHours.js';
import { formatDateRange } from '../lib/formatDateRange';
import FiltersSheet from '../components/FiltersSheet';
import {
  CATEGORY_ORDER,
  CATEGORY_TRANSLATION_KEYS,
} from '../lib/museumCategories';

const FILTERS_EVENT = 'museumBuddy:openFilters';

const MUSEUM_SELECT_COLUMNS = [
  'id',
  'slug',
  'naam',
  'stad',
  'provincie',
  'gratis_toegankelijk',
  'ticket_affiliate_url',
  'website_url',
  'afbeelding_url',
  'image_url',
].join(', ');

const MUSEUM_FALLBACK_COLUMNS = [
  'id',
  'slug',
  'naam',
  'stad',
  'provincie',
  'gratis_toegankelijk',
  'ticket_affiliate_url',
  'website_url',
].join(', ');

const EXHIBITION_SELECT_WITH_RELATION = `*, museum:museum_id (${MUSEUM_SELECT_COLUMNS})`;
const EXHIBITION_SELECT_WITH_RELATION_FALLBACK = `*, museum:museum_id (${MUSEUM_FALLBACK_COLUMNS})`;
const EXHIBITION_SELECT_NO_RELATION = '*';

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

function normalizeMuseumRow(row) {
  if (!row || !row.id || !row.slug) {
    return null;
  }

  const freeAccess = resolveBooleanFlag(row.gratis_toegankelijk);

  return {
    id: row.id,
    slug: row.slug,
    naam: row.naam || null,
    stad: row.stad || row.city || null,
    provincie: row.provincie || row.province || null,
    gratis_toegankelijk: freeAccess === true,
    ticket_affiliate_url: row.ticket_affiliate_url || null,
    website_url: row.website_url || row.website || null,
    afbeelding_url: row.afbeelding_url || null,
    image_url: row.image_url || null,
  };
}

function truncate(text, maxLength = 180) {
  if (typeof text !== 'string') return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1)}…`;
}

function pickImage(row, museum) {
  const candidates = [row?.afbeelding_url, row?.image_url, row?.hero_image_url, row?.hero_afbeelding_url, row?.banner_url];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }

  if (museum?.afbeelding_url && typeof museum.afbeelding_url === 'string') {
    return museum.afbeelding_url;
  }

  if (museum?.image_url && typeof museum.image_url === 'string') {
    return museum.image_url;
  }

  return null;
}

function mapExhibitionToCard(exhibition, t, language) {
  if (!exhibition?.museum || !exhibition.museum.slug) {
    return null;
  }

  const museum = exhibition.museum;
  const slug = museum.slug;
  const museumName = museumNames[slug] || museum.naam || '';
  const exhibitionTitle = exhibition.titel || museumName || '';
  const titleBase = museumName
    ? t('exhibitionsListCardTitle', { exhibition: exhibitionTitle, museum: museumName })
    : exhibitionTitle;
  const rangeLabel = formatDateRange(exhibition.start_datum, exhibition.eind_datum, {
    language,
  });
  const descriptionText = truncate(
    exhibition.beschrijving || exhibition.omschrijving || exhibition.description || ''
  );
  const cardTitle = titleBase;
  const summary = descriptionText || null;
  const metaTag = rangeLabel || null;

  const imageFromData = pickImage(exhibition, museum);
  const resolvedImage = imageFromData || museumImages[slug] || null;
  const freeFlag = resolveBooleanFlag(
    exhibition.gratis,
    exhibition.free,
    exhibition.kosteloos,
    exhibition.freeEntry,
    exhibition.isFree,
    exhibition.is_free,
    museum.gratis_toegankelijk
  );
  const categories = ['exhibition', ...getMuseumCategories(slug)].filter(Boolean);
  const uniqueCategories = Array.from(new Set(categories));
  const affiliateTicketUrl =
    exhibition.ticket_affiliate_url ||
    museum.ticket_affiliate_url ||
    museumTicketUrls[slug] ||
    null;
  const directTicketUrl = exhibition.ticket_url || museum.website_url || null;
  const infoTicketUrl = exhibition.bron_url || null;
  const ticketUrl = affiliateTicketUrl || directTicketUrl || infoTicketUrl;
  const startDate = exhibition.start_datum || exhibition.startDatum || null;
  const endDate = exhibition.eind_datum || exhibition.eindDatum || null;

  return {
    exhibitionId: exhibition.id,
    id: museum.id,
    slug,
    title: cardTitle,
    city: museum.stad,
    province: museum.provincie,
    free: freeFlag === true,
    categories: uniqueCategories,
    image: resolvedImage,
    imageCredit: museumImageCredits[slug],
    ticketUrl,
    ticketAffiliateUrl: affiliateTicketUrl,
    summary,
    metaTag,
    museumName,
    startDate,
    endDate,
  };
}

function deriveSlug(row) {
  if (!row) {
    return null;
  }

  const candidates = [
    row?.museum?.slug,
    row?.museum_slug,
    row?.museumSlug,
    row?.museum_slugnaam,
    row?.slug_museum,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return null;
}

function buildFallbackMuseum(row, slug) {
  if (!slug) {
    return null;
  }

  return normalizeMuseumRow({
    id: row.museum_id ?? slug,
    slug,
    naam: row.museum_naam || row.museumName || museumNames[slug] || null,
    stad: row.museum_stad || row.museumCity || null,
    provincie: row.museum_provincie || row.museumProvince || null,
    gratis_toegankelijk: resolveBooleanFlag(
      row.museum_gratis_toegankelijk,
      row.museumGratis,
      row.museum_free,
      row.museumFree
    ) === true,
    ticket_affiliate_url: row.museum_ticket_affiliate_url || row.museumTicketAffiliateUrl || null,
    website_url: row.museum_website_url || row.museumWebsiteUrl || null,
    afbeelding_url: row.museum_afbeelding_url || null,
    image_url: row.museum_image_url || museumImages[slug] || null,
  });
}

function resolveMuseumForRow(row, museumMap = new Map(), slugMap = new Map()) {
  const direct = normalizeMuseumRow(row.museum);
  if (direct) {
    return direct;
  }

  if (row.museum_id && museumMap.has(row.museum_id)) {
    return museumMap.get(row.museum_id);
  }

  const slug = deriveSlug(row);

  if (slug && slugMap.has(slug)) {
    return slugMap.get(slug);
  }

  return buildFallbackMuseum(row, slug);
}

async function fetchMuseumsByIds(ids) {
  if (!supabaseClient || !Array.isArray(ids) || ids.length === 0) {
    return new Map();
  }

  let { data, error } = await supabaseClient
    .from('musea')
    .select(MUSEUM_SELECT_COLUMNS)
    .in('id', ids);

  if (error && error.message && /column|identifier|relationship/i.test(error.message)) {
    ({ data, error } = await supabaseClient.from('musea').select(MUSEUM_FALLBACK_COLUMNS).in('id', ids));
  }

  if (error) {
    return new Map();
  }

  const normalised = (Array.isArray(data) ? data : [])
    .map((row) => normalizeMuseumRow(row))
    .filter((museum) => museum && museum.id && museum.slug);

  return new Map(normalised.map((museum) => [museum.id, museum]));
}

async function fetchMuseumsBySlugs(slugs) {
  if (!supabaseClient || !Array.isArray(slugs) || slugs.length === 0) {
    return new Map();
  }

  let { data, error } = await supabaseClient
    .from('musea')
    .select(MUSEUM_SELECT_COLUMNS)
    .in('slug', slugs);

  if (error && error.message && /column|identifier|relationship/i.test(error.message)) {
    ({ data, error } = await supabaseClient
      .from('musea')
      .select(MUSEUM_FALLBACK_COLUMNS)
      .in('slug', slugs));
  }

  if (error) {
    return new Map();
  }

  const normalised = (Array.isArray(data) ? data : [])
    .map((row) => normalizeMuseumRow(row))
    .filter((museum) => museum && museum.slug);

  return new Map(normalised.map((museum) => [museum.slug, museum]));
}

async function loadExhibitionsForStaticProps() {
  if (!supabaseClient) {
    return { exhibitions: [], error: null };
  }

  const today = todayYMD('Europe/Amsterdam');
  const selectAttempts = [
    EXHIBITION_SELECT_WITH_RELATION,
    EXHIBITION_SELECT_WITH_RELATION_FALLBACK,
    EXHIBITION_SELECT_NO_RELATION,
  ];

  let rows = [];
  let lastError = null;

  for (let i = 0; i < selectAttempts.length; i += 1) {
    let query = supabaseClient
      .from('exposities')
      .select(selectAttempts[i])
      .order('start_datum', { ascending: true });

    if (today) {
      query = query.or(`eind_datum.gte.${today},eind_datum.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      lastError = error;
      if (error.message && /column|identifier|relationship/i.test(error.message)) {
        continue;
      }
      break;
    }

    rows = Array.isArray(data) ? data : [];
    lastError = null;
    break;
  }

  if (lastError) {
    return { exhibitions: [], error: 'queryFailed' };
  }

  const missingIds = [];
  const exhibitionsWithMuseums = rows.map((row) => {
    const normalisedMuseum = normalizeMuseumRow(row.museum);
    if (!normalisedMuseum && row.museum_id) {
      missingIds.push(row.museum_id);
    }

    return {
      ...row,
      museum: normalisedMuseum || null,
    };
  });

  const museumMap = await fetchMuseumsByIds([...new Set(missingIds)]);

  const missingSlugRows = [];
  const resolvedById = exhibitionsWithMuseums.map((row) => {
    if (row.museum && row.museum.slug) {
      return row;
    }

    if (row.museum_id && museumMap.has(row.museum_id)) {
      return {
        ...row,
        museum: museumMap.get(row.museum_id),
      };
    }

    missingSlugRows.push(row);
    return row;
  });

  const missingSlugs = [...new Set(missingSlugRows.map((row) => deriveSlug(row)).filter(Boolean))];
  const slugMap = await fetchMuseumsBySlugs(missingSlugs);

  const exhibitions = resolvedById
    .map((row) => {
      let museum = row.museum;
      if (!museum || !museum.slug) {
        museum = resolveMuseumForRow(row, museumMap, slugMap);
      }

      if (!museum || !museum.slug) {
        return null;
      }

      return {
        id: row.id ?? null,
        titel: row.titel || null,
        start_datum: row.start_datum || row.startDatum || null,
        eind_datum: row.eind_datum || row.eindDatum || null,
        beschrijving: row.beschrijving || row.omschrijving || row.description || null,
        omschrijving: row.omschrijving || null,
        description: row.description || null,
        gratis: row.gratis ?? null,
        free: row.free ?? null,
        kosteloos: row.kosteloos ?? null,
        freeEntry: row.freeEntry ?? null,
        isFree: row.isFree ?? null,
        is_free: row.is_free ?? null,
        ticket_affiliate_url: row.ticket_affiliate_url || row.ticketAffiliateUrl || null,
        ticket_url: row.ticket_url || row.ticketUrl || null,
        bron_url: row.bron_url || row.source_url || null,
        afbeelding_url: row.afbeelding_url || row.image_url || null,
        image_url: row.image_url || null,
        museum,
      };
    })
    .filter(Boolean);

  exhibitions.sort((a, b) => {
    const aStart = a.start_datum ? Date.parse(a.start_datum) : Number.POSITIVE_INFINITY;
    const bStart = b.start_datum ? Date.parse(b.start_datum) : Number.POSITIVE_INFINITY;
    if (aStart === bStart) {
      return (a.titel || '').localeCompare(b.titel || '');
    }
    return aStart - bStart;
  });

  return { exhibitions, error: null };
}

export default function ExhibitionsPage({ exhibitions = [], error = null }) {
  const { t, lang } = useLanguage();
  const router = useRouter();

  const allCards = useMemo(
    () =>
      (Array.isArray(exhibitions) ? exhibitions : [])
        .map((exhibition) => mapExhibitionToCard(exhibition, t, lang))
        .filter(Boolean),
    [exhibitions, t, lang]
  );

  const museumOptions = useMemo(() => {
    const seen = new Map();
    for (const card of allCards) {
      if (!card?.slug) continue;
      if (seen.has(card.slug)) continue;
      const labelCandidates = [card.museumName, museumNames[card.slug], card.title, card.slug];
      let label = '';
      for (const candidate of labelCandidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
          label = candidate.trim();
          break;
        }
      }
      seen.set(card.slug, {
        name: `museum:${card.slug}`,
        label,
        slug: card.slug,
      });
    }
    const formatter = new Intl.Collator(lang === 'nl' ? 'nl-NL' : 'en-US', {
      sensitivity: 'base',
    });
    return Array.from(seen.values()).sort((a, b) => formatter.compare(a.label, b.label));
  }, [allCards, lang]);

  const emptyFilters = useMemo(() => {
    const base = { openNow: false, exhibitions: false };
    TYPE_FILTERS.forEach((type) => {
      base[type.stateKey] = false;
    });
    museumOptions.forEach((option) => {
      base[option.name] = false;
    });
    return base;
  }, [museumOptions]);

  const filtersFromUrl = useMemo(() => {
    const query = router?.query || {};
    const next = { ...emptyFilters };

    next.openNow = parseBooleanParam(query.open_now ?? query.openNow ?? query.open);
    next.exhibitions = parseBooleanParam(query.exhibitions ?? query.exposities);

    const rawTypes = query.types;
    const typeValue = Array.isArray(rawTypes) ? rawTypes[0] : rawTypes;
    const parsedTypes = typeof typeValue === 'string'
      ? typeValue
          .split(',')
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean)
      : [];
    TYPE_FILTERS.forEach((type) => {
      next[type.stateKey] = parsedTypes.includes(type.paramValue);
    });

    const rawMuseums = query.museums ?? query.museum ?? query.musea;
    const museumValue = Array.isArray(rawMuseums) ? rawMuseums[0] : rawMuseums;
    const parsedMuseums = typeof museumValue === 'string'
      ? museumValue
          .split(',')
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean)
      : [];
    museumOptions.forEach((option) => {
      next[option.name] = parsedMuseums.includes(option.slug.toLowerCase());
    });

    return next;
  }, [router?.query, emptyFilters, museumOptions]);

  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(filtersFromUrl);
  const [sheetFilters, setSheetFilters] = useState(filtersFromUrl);

  useEffect(() => {
    setActiveFilters(filtersFromUrl);
    setSheetFilters(filtersFromUrl);
  }, [filtersFromUrl]);

  const updateQueryWithFilters = useCallback(
    (nextFilters) => {
      if (!router?.isReady) return;
      const current = router.query || {};
      const nextQuery = { ...current };

      delete nextQuery.open_now;
      delete nextQuery.openNow;
      delete nextQuery.open;
      delete nextQuery.exhibitions;
      delete nextQuery.exposities;
      delete nextQuery.types;
      delete nextQuery.museums;
      delete nextQuery.museum;
      delete nextQuery.musea;

      if (nextFilters.openNow) {
        nextQuery.open_now = '1';
      }
      if (nextFilters.exhibitions) {
        nextQuery.exhibitions = '1';
      }

      const selectedTypes = TYPE_FILTERS.filter((type) => nextFilters[type.stateKey]).map(
        (type) => type.paramValue
      );
      if (selectedTypes.length > 0) {
        nextQuery.types = selectedTypes.join(',');
      }

      const selectedMuseums = museumOptions
        .filter((option) => nextFilters[option.name])
        .map((option) => option.slug);
      if (selectedMuseums.length > 0) {
        nextQuery.museums = selectedMuseums.join(',');
      }

      router.replace(
        {
          pathname: router.pathname,
          query: nextQuery,
        },
        undefined,
        { shallow: true, scroll: false }
      );
    },
    [router, museumOptions]
  );

  const handleFilterChange = useCallback((name, value) => {
    setSheetFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    const merged = { ...emptyFilters, ...sheetFilters };
    setActiveFilters(merged);
    setFiltersSheetOpen(false);
    updateQueryWithFilters(merged);
  }, [emptyFilters, sheetFilters, updateQueryWithFilters]);

  const handleResetFilters = useCallback(() => {
    setSheetFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    setFiltersSheetOpen(false);
    updateQueryWithFilters(emptyFilters);
  }, [emptyFilters, updateQueryWithFilters]);

  const handleCloseSheet = useCallback(() => {
    setFiltersSheetOpen(false);
    setSheetFilters(activeFilters);
  }, [activeFilters]);

  const openNowActive = Boolean(activeFilters.openNow);

  const selectedTypeIds = useMemo(
    () =>
      TYPE_FILTERS.filter((type) => activeFilters[type.stateKey]).map((type) => type.paramValue),
    [activeFilters]
  );

  const selectedMuseumSlugs = useMemo(
    () => museumOptions.filter((option) => activeFilters[option.name]).map((option) => option.slug),
    [activeFilters, museumOptions]
  );

  const selectedTypeCount = selectedTypeIds.length;
  const selectedMuseumCount = selectedMuseumSlugs.length;
  const hasAdditionalFilters = Boolean(
    activeFilters.exhibitions || selectedTypeCount > 0 || selectedMuseumCount > 0
  );

  const todayYmd = useMemo(() => todayYMD(DEFAULT_TIME_ZONE), []);
  const todayTimestamp = useMemo(() => {
    const parsed = Date.parse(todayYmd);
    return Number.isNaN(parsed) ? null : parsed;
  }, [todayYmd]);

  const visibleCards = useMemo(() => {
    return allCards.filter((card) => {
      if (!card) return false;

      if (activeFilters.openNow && isMuseumOpenNow(card) !== true) {
        return false;
      }

      if (activeFilters.exhibitions && todayTimestamp !== null) {
        const startValue = card.startDate ? Date.parse(card.startDate) : null;
        const endValue = card.endDate ? Date.parse(card.endDate) : null;

        if (typeof startValue === 'number' && !Number.isNaN(startValue) && startValue > todayTimestamp) {
          return false;
        }

        if (typeof endValue === 'number' && !Number.isNaN(endValue) && endValue < todayTimestamp) {
          return false;
        }
      }

      if (selectedTypeIds.length > 0) {
        const categories = Array.isArray(card.categories) ? card.categories : [];
        const matchesType = selectedTypeIds.some((typeId) => categories.includes(typeId));
        if (!matchesType) {
          return false;
        }
      }

      if (selectedMuseumSlugs.length > 0 && (!card.slug || !selectedMuseumSlugs.includes(card.slug))) {
        return false;
      }

      return true;
    });
  }, [allCards, activeFilters, selectedTypeIds, selectedMuseumSlugs, todayTimestamp]);

  const filtersContainerRef = useRef(null);
  const openNowButtonRef = useRef(null);
  const filtersButtonRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleOpen = () => {
      const container = filtersContainerRef.current;
      if (container?.scrollIntoView) {
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setFiltersSheetOpen(true);
      const button = filtersButtonRef.current || openNowButtonRef.current;
      if (button?.focus) {
        button.focus({ preventScroll: true });
      }
    };
    window.addEventListener(FILTERS_EVENT, handleOpen);
    return () => {
      window.removeEventListener(FILTERS_EVENT, handleOpen);
    };
  }, []);

  const handleToggleOpenNow = useCallback(() => {
    const nextValue = !openNowActive;
    const merged = { ...activeFilters, openNow: nextValue };
    setActiveFilters(merged);
    setSheetFilters((prev) => ({ ...prev, openNow: nextValue }));
    updateQueryWithFilters(merged);
  }, [activeFilters, openNowActive, updateQueryWithFilters]);

  const filterSections = useMemo(() => {
    const sections = [
      {
        id: 'availability',
        title: t('filtersAvailability'),
        options: [
          { name: 'openNow', label: t('filtersOpenNow') },
          { name: 'exhibitions', label: t('filtersExhibitions') },
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
    ];

    if (museumOptions.length > 0) {
      sections.push({
        id: 'museums',
        title: t('filtersMuseums'),
        options: museumOptions,
      });
    }

    return sections;
  }, [museumOptions, t]);

  const hasBaseCards = allCards.length > 0;
  const hasVisibleCards = visibleCards.length > 0;

  return (
    <>
      <SEO
        title={t('exhibitionsPageTitle')}
        description={t('exhibitionsPageDescription')}
        canonical="/tentoonstellingen"
        image="/images/og-exhibitions.svg"
      />
      <FiltersSheet
        open={filtersSheetOpen}
        filters={sheetFilters}
        onChange={handleFilterChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onClose={handleCloseSheet}
        sections={filterSections}
        labels={{
          title: t('exhibitionFiltersTitle'),
          description: t('exhibitionFiltersDescription'),
          availability: t('filtersAvailability'),
          exhibitions: t('filtersExhibitions'),
          openNow: t('filtersOpenNow'),
          distance: t('filtersDistance'),
          typeTitle: t('filtersTypeTitle'),
          apply: t('filtersApply'),
          reset: t('filtersReset'),
          close: t('filtersClose'),
        }}
        idPrefix="exhibitions-filters"
      />
      <section className="page-intro" aria-labelledby="exhibitions-heading">
        <h1 id="exhibitions-heading" className="page-title">
          {t('exhibitionsPageHeading')}
        </h1>
        <p className="page-subtitle">{t('exhibitionsPageSubtitle')}</p>
      </section>
      <p className="count">
        {visibleCards.length} {t('exhibitions')}
      </p>
      <div className="filters-inline" ref={filtersContainerRef}>
        <Button
          type="button"
          variant={hasAdditionalFilters ? 'primary' : 'secondary'}
          size="lg"
          className="filters-inline__button"
          onClick={() => setFiltersSheetOpen(true)}
          ref={filtersButtonRef}
          aria-haspopup="dialog"
          aria-expanded={filtersSheetOpen}
        >
          {t('exhibitionFiltersButton')}
        </Button>
        <Button
          type="button"
          variant={openNowActive ? 'primary' : 'secondary'}
          size="lg"
          className="filters-inline__button"
          onClick={handleToggleOpenNow}
          aria-pressed={openNowActive}
          ref={openNowButtonRef}
        >
          {t('filtersOpenNow')}
        </Button>
      </div>
      {error ? (
        <p>{t('somethingWrong')}</p>
      ) : !hasBaseCards ? (
        <p>{t('noExhibitions')}</p>
      ) : !hasVisibleCards ? (
        <p>{t('noFilteredExhibitions')}</p>
      ) : (
        <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {visibleCards.map((museum, index) => (
            <li key={`exhibition-${museum.exhibitionId || museum.slug || index}`}>
              <MuseumCard museum={museum} priority={index < 6} highlightOpenNow={openNowActive} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export async function getStaticProps() {
  const { exhibitions, error } = await loadExhibitionsForStaticProps();

  return {
    props: {
      exhibitions,
      error,
    },
  };
}
