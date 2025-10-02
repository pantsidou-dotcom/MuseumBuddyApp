import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SEO from '../components/SEO';
import { useLanguage } from '../components/LanguageContext';
import ExhibitionGridCard from '../components/ExhibitionGridCard';
import { supabase as supabaseClient } from '../lib/supabase';
import museumImages from '../lib/museumImages';
import museumImageCredits from '../lib/museumImageCredits';
import museumTicketUrls from '../lib/museumTicketUrls';

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

function toSlug(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, 'en')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeExhibitionRow(row, museumOverride) {
  if (!row) return null;

  const museum = museumOverride || row.musea || row.museum || {};

  const rawSlug = museum.slug || row.museum_slug || row.museumSlug || row.slug || '';
  const normalizedSlug =
    (typeof rawSlug === 'string' && rawSlug.trim() ? rawSlug.trim().toLowerCase() : '') ||
    toSlug(
      museum.naam ||
        museum.name ||
        row.museum_naam ||
        row.museumName ||
        row.museum ||
        ''
    );
  const slug = normalizedSlug || null;

  const tags = {
    free: resolveBooleanFlag(row.gratis, row.free, row.kosteloos, row.freeEntry) === true,
    childFriendly:
      resolveBooleanFlag(
        row.kindvriendelijk,
        row.childFriendly,
        row.familievriendelijk,
        row.familyFriendly
      ) === true,
    temporary:
      resolveBooleanFlag(
        row.tijdelijk,
        row.temporary,
        row.tijdelijkeTentoonstelling,
        row.temporaryExhibition
      ) === true || Boolean(row.start_datum && row.eind_datum),
  };

  const fallbackAffiliate = museum.ticket_affiliate_url || museumTicketUrls[slug] || null;
  const affiliateUrl = row.ticket_affiliate_url || fallbackAffiliate;
  const ticketUrl = row.ticket_url || museum.ticket_url || museum.website_url || null;

  const description =
    row.beschrijving || row.omschrijving || row.beschrijving_kort || row.samenvatting || row.description || '';
  const sourceUrl = row.bron_url || row.source_url || row.url || null;
  const moreInfoUrl =
    row.meer_info_url ||
    row.meer_informatie_url ||
    row.detail_url ||
    row.detailUrl ||
    row.link ||
    row.website_url ||
    sourceUrl ||
    null;
  const museumCity = museum.stad || museum.city || row.museum_stad || row.museumCity || null;
  const museumProvince = museum.provincie || museum.province || row.museum_provincie || row.museumProvince || null;

  return {
    id: row.id,
    title: row.titel,
    startDate: row.start_datum || null,
    endDate: row.eind_datum || null,
    description,
    sourceUrl,
    moreInfoUrl,
    ticketAffiliateUrl: affiliateUrl || null,
    ticketUrl: ticketUrl || null,
    museum: {
      id: museum.id || row.museum_id || null,
      slug,
      name: museum.naam || museum.name || row.museum_naam || row.museumName || null,
      city: museumCity,
      province: museumProvince,
    },
    image:
      museumImages[slug] ||
      museum.afbeelding_url ||
      museum.image_url ||
      museum.image ||
      row.museum_afbeelding_url ||
      row.museumImageUrl ||
      row.museum_afbeelding ||
      row.afbeelding_url ||
      row.afbeelding ||
      row.image_url ||
      null,
    imageCredit: slug ? museumImageCredits[slug] || null : null,
    tags,
  };
}

function sortExhibitions(exhibitions, tz = 'Europe/Amsterdam') {
  const today = todayYMD(tz);
  const todayTime = today ? new Date(`${today}T00:00:00`).getTime() : Date.now();

  return [...exhibitions].sort((a, b) => {
    const aStart = a.startDate ? new Date(`${a.startDate}T00:00:00`).getTime() : Infinity;
    const bStart = b.startDate ? new Date(`${b.startDate}T00:00:00`).getTime() : Infinity;
    const aEnd = a.endDate ? new Date(`${a.endDate}T23:59:59`).getTime() : Infinity;
    const bEnd = b.endDate ? new Date(`${b.endDate}T23:59:59`).getTime() : Infinity;

    const aIsCurrentOrUpcoming = aEnd >= todayTime;
    const bIsCurrentOrUpcoming = bEnd >= todayTime;

    if (aIsCurrentOrUpcoming !== bIsCurrentOrUpcoming) {
      return aIsCurrentOrUpcoming ? -1 : 1;
    }

    if (aStart === bStart) {
      return a.title.localeCompare(b.title);
    }
    return aStart - bStart;
  });
}

export default function ExhibitionsPage({ exhibitions = [], error = null }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState(() => {
    const q = router.query?.q;
    return typeof q === 'string' ? q : '';
  });

  const queryParam = router.query?.q;

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof queryParam === 'string') {
      if (queryParam !== query) {
        setQuery(queryParam);
      }
      return;
    }
    if (query && queryParam === undefined) {
      setQuery('');
    }
  }, [router.isReady, queryParam, query]);

  const filteredExhibitions = useMemo(() => {
    if (!query) return exhibitions;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return exhibitions;
    return exhibitions.filter((exhibition) => {
      const haystacks = [
        exhibition.title,
        exhibition.museum?.name,
        exhibition.museum?.city,
        exhibition.description,
      ]
        .filter(Boolean)
        .map((value) => value.toLowerCase());
      return haystacks.some((value) => value.includes(normalized));
    });
  }, [exhibitions, query]);

  const resultCount = filteredExhibitions.length;

  if (error) {
    return (
      <main className="container" style={{ maxWidth: 800 }}>
        <SEO
          title={t('exhibitionsPageTitle')}
          description={t('exhibitionsPageDescription')}
        />
        <p>{t('somethingWrong')}</p>
      </main>
    );
  }

  return (
    <>
      <SEO
        title={t('exhibitionsPageTitle')}
        description={t('exhibitionsPageDescription')}
      />
      <header className="hero" role="banner">
        <div className="hero-content">
          <span className="hero-tagline">{t('heroTagline')}</span>
          <h1 className="hero-title">{t('exhibitionsHeroTitle')}</h1>
          <p className="hero-subtext">{t('exhibitionsHeroSubtitle')}</p>
          <div className="hero-cta-group">
            <Link href="/#museum-resultaten" className="hero-quick-link hero-quick-link--primary">
              {t('heroPrimaryCta')}
            </Link>
            <Link href="#tentoonstellingen-lijst" className="hero-quick-link hero-quick-link--ghost">
              {t('heroSecondaryCta')}
            </Link>
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
        </form>
      </header>

      <p className="count" id="tentoonstellingen-lijst">
        {resultCount} {t('results')}
      </p>

      {resultCount === 0 ? (
        <p>{t('noFilteredExhibitions')}</p>
      ) : (
        <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {filteredExhibitions.map((exhibition, index) => (
            <li key={exhibition.id}>
              <ExhibitionGridCard exhibition={exhibition} priority={index < 6} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const EXHIBITION_SELECT_WITH_RELATION = `
  id,
  titel,
  start_datum,
  eind_datum,
  beschrijving,
  beschrijving_kort,
  omschrijving,
  bron_url,
  source_url,
  meer_info_url,
  meer_informatie_url,
  detail_url,
  link,
  website_url,
  ticket_affiliate_url,
  ticket_url,
  museum_id,
  museum_slug,
  museum_naam,
  museum_stad,
  museum_provincie,
  museum_afbeelding_url,
  museum_afbeelding,
  museum_image_url,
  musea: museum_id (
    id,
    slug,
    naam,
    stad,
    provincie,
    ticket_affiliate_url,
    ticket_url,
    website_url,
    afbeelding_url
  )
`;

const EXHIBITION_SELECT_NO_RELATION = `
  id,
  titel,
  start_datum,
  eind_datum,
  beschrijving,
  beschrijving_kort,
  omschrijving,
  bron_url,
  source_url,
  meer_info_url,
  meer_informatie_url,
  detail_url,
  link,
  website_url,
  ticket_affiliate_url,
  ticket_url,
  museum_id,
  museum_slug,
  museum_naam,
  museum_stad,
  museum_provincie,
  museum_afbeelding_url,
  museum_afbeelding,
  museum_image_url
`;

async function fetchMuseumsByIds(ids) {
  if (!ids || ids.length === 0) {
    return new Map();
  }

  const { data, error } = await supabaseClient
    .from('musea')
    .select(
      'id, slug, naam, stad, provincie, ticket_affiliate_url, ticket_url, website_url, afbeelding_url'
    )
    .in('id', ids);

  if (error) {
    throw Object.assign(new Error('museumQueryFailed'), { cause: error });
  }

  if (!Array.isArray(data)) {
    return new Map();
  }

  return new Map(data.filter(Boolean).map((museumRow) => [museumRow.id, museumRow]));
}

function collectMissingMuseumIds(rows) {
  const ids = new Set();

  rows.forEach((row) => {
    if (row?.musea && row.musea.id) {
      return;
    }

    const id = row?.museum_id;
    if (typeof id === 'number' && !Number.isNaN(id)) {
      ids.add(id);
    }
  });

  return Array.from(ids);
}

export async function getStaticProps() {
  if (!supabaseClient) {
    return {
      props: {
        exhibitions: [],
        error: 'missingSupabase',
      },
    };
  }

  try {
    let selectQuery = supabaseClient
      .from('exposities')
      .select(EXHIBITION_SELECT_WITH_RELATION)
      .order('start_datum', { ascending: true, nullsFirst: false });

    let { data, error } = await selectQuery;
    let usedFallback = false;

    if (error && /relationship|join|foreign/i.test(error.message || '')) {
      ({ data, error } = await supabaseClient
        .from('exposities')
        .select(EXHIBITION_SELECT_NO_RELATION)
        .order('start_datum', { ascending: true, nullsFirst: false }));
      usedFallback = true;
    }

    if (error) {
      return {
        props: {
          exhibitions: [],
          error: 'queryFailed',
        },
      };
    }

    const rawRows = Array.isArray(data) ? data.filter(Boolean) : [];

    let museumMap = new Map();

    const missingMuseumIds = collectMissingMuseumIds(rawRows);

    if (missingMuseumIds.length > 0) {
      try {
        museumMap = await fetchMuseumsByIds(missingMuseumIds);
      } catch (museumError) {
        if (!usedFallback) {
          throw museumError;
        }
        // If fetching museums fails on the fallback path, continue without additional data.
        museumMap = new Map();
      }
    }

    const normalized = rawRows
      .map((row) => {
        const museumRow = row.musea || museumMap.get(row.museum_id);
        return normalizeExhibitionRow(row, museumRow);
      })
      .filter(Boolean);

    const sorted = sortExhibitions(normalized);

    return {
      props: {
        exhibitions: sorted,
        error: null,
      },
      revalidate: 1800,
    };
  } catch (err) {
    return {
      props: {
        exhibitions: [],
        error: 'unknown',
      },
    };
  }
}
