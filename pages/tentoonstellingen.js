import { useMemo } from 'react';
import MuseumCard from '../components/MuseumCard';
import SEO from '../components/SEO';
import { useLanguage } from '../components/LanguageContext';
import museumImages from '../lib/museumImages';
import museumNames from '../lib/museumNames';
import museumImageCredits from '../lib/museumImageCredits';
import museumTicketUrls from '../lib/museumTicketUrls';
import { getMuseumCategories } from '../lib/museumCategories';
import { supabase as supabaseClient } from '../lib/supabase';

function todayYMD(tz = 'Europe/Amsterdam') {
  try {
    const now = new Date();
    const localeTime = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(now)
      .split('-');
    if (localeTime.length !== 3) return null;
    const [year, month, day] = localeTime;
    return `${year}-${month}-${day}`;
  } catch (err) {
    return null;
  }
}

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

const MUSEUM_SELECT_FALLBACK_COLUMNS = [
  'id',
  'slug',
  'naam',
  'stad',
  'provincie',
  'gratis_toegankelijk',
  'ticket_affiliate_url',
  'afbeelding_url',
  'image_url',
].join(', ');

const EXHIBITION_WITH_MUSEUM_SELECT = `*, museum:museum_id (${MUSEUM_SELECT_COLUMNS})`;

const EXHIBITION_FALLBACK_SELECT = '*';

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

function formatDateRange(start, end, locale) {
  if (!start) return '';

  try {
    const startDate = new Date(`${start}T00:00:00`);
    if (Number.isNaN(startDate.getTime())) return '';
    const formatter = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: startDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
    const startLabel = formatter.format(startDate);

    if (!end) {
      return startLabel;
    }

    const endDate = new Date(`${end}T00:00:00`);
    if (Number.isNaN(endDate.getTime())) {
      return startLabel;
    }

    const differentYear = startDate.getFullYear() !== endDate.getFullYear();
    const endFormatter = differentYear
      ? new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' })
      : formatter;
    const endLabel = endFormatter.format(endDate);

    return `${startLabel} – ${endLabel}`;
  } catch (err) {
    return '';
  }
}

function truncate(text, maxLength = 180) {
  if (typeof text !== 'string') return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1)}…`;
}

function pickImage(row, museum) {
  const candidates = [
    row?.afbeelding_url,
    row?.image_url,
    row?.hero_image_url,
    row?.hero_afbeelding_url,
    row?.banner_url,
    row?.cover_url,
  ];

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

function mapExhibitionToCard(exhibition, lang, t) {
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
  const locale = lang === 'en' ? 'en-GB' : 'nl-NL';
  const rangeLabel = formatDateRange(exhibition.start_datum, exhibition.eind_datum, locale);
  const hostedBy = museumName ? t('exhibitionsListHostedBy', { museum: museumName }) : '';
  const descriptionText = truncate(
    exhibition.beschrijving || exhibition.omschrijving || exhibition.description || ''
  );
  const metaLine = [hostedBy, rangeLabel].filter(Boolean).join(' • ');
  const cardTitle = rangeLabel ? `${titleBase} (${rangeLabel})` : titleBase;
  let summary = descriptionText;
  if (!summary && metaLine) {
    summary = metaLine;
  } else if (summary && metaLine) {
    summary = summary.endsWith('.') ? `${summary} ${metaLine}` : `${summary} — ${metaLine}`;
  }

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
  const ticketUrl =
    exhibition.ticket_affiliate_url ||
    exhibition.ticket_url ||
    exhibition.bron_url ||
    museum.ticket_affiliate_url ||
    museumTicketUrls[slug] ||
    museum.website_url ||
    null;

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
    summary,
  };
}

export default function ExhibitionsPage({ exhibitions = [], error = null }) {
  const { t, lang } = useLanguage();

  if (error) {
    return (
      <>
        <SEO title={t('exhibitionsPageTitle')} description={t('exhibitionsPageDescription')} />
        <p>{t('somethingWrong')}</p>
      </>
    );
  }

  const cards = useMemo(
    () =>
      (Array.isArray(exhibitions) ? exhibitions : [])
        .map((exhibition) => mapExhibitionToCard(exhibition, lang, t))
        .filter(Boolean),
    [exhibitions, lang, t]
  );

  return (
    <>
      <SEO title={t('exhibitionsPageTitle')} description={t('exhibitionsPageDescription')} />
      <section className="page-intro" aria-labelledby="exhibitions-heading">
        <h1 id="exhibitions-heading" className="page-title">
          {t('exhibitionsPageHeading')}
        </h1>
        <p className="page-subtitle">{t('exhibitionsPageSubtitle')}</p>
      </section>
      <p className="count">{cards.length} {t('exhibitions')}</p>
      {cards.length === 0 ? (
        <p>{t('noExhibitions')}</p>
      ) : (
        <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {cards.map((museum, index) => (
            <li key={`exhibition-${museum.exhibitionId || museum.slug || index}`}>
              <MuseumCard museum={museum} priority={index < 6} />
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
        exhibitions: [],
        error: 'missingSupabase',
      },
      revalidate: 60,
    };
  }

  const today = todayYMD('Europe/Amsterdam');

  const buildExhibitionQuery = (selectColumns) => {
    let query = supabaseClient
      .from('exposities')
      .select(selectColumns)
      .order('start_datum', { ascending: true });

    if (today) {
      query = query.or(`eind_datum.gte.${today},eind_datum.is.null`);
    }

    return query;
  };

  const fetchMuseumsByIds = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      return new Map();
    }

    let { data: museumData, error: museumError } = await supabaseClient
      .from('musea')
      .select(MUSEUM_SELECT_COLUMNS)
      .in('id', ids);

    if (museumError && museumError.message && /column|identifier|relationship/i.test(museumError.message)) {
      const fallbackResult = await supabaseClient
        .from('musea')
        .select(MUSEUM_SELECT_FALLBACK_COLUMNS)
        .in('id', ids);

      museumData = fallbackResult.data;
      museumError = fallbackResult.error;
    }

    if (museumError) {
      return new Map();
    }

    const normalised = (Array.isArray(museumData) ? museumData : [])
      .map((row) => normalizeMuseumRow(row))
      .filter((museum) => museum && museum.id && museum.slug);

    return new Map(normalised.map((museum) => [museum.id, museum]));
  };

  try {
    let { data, error } = await buildExhibitionQuery(EXHIBITION_WITH_MUSEUM_SELECT);

    if (error && error.message && /column|identifier|relationship/i.test(error.message)) {
      const fallbackResult = await buildExhibitionQuery(EXHIBITION_FALLBACK_SELECT);
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      return {
        props: {
          exhibitions: [],
          error: 'queryFailed',
        },
        revalidate: 60,
      };
    }

    const rows = Array.isArray(data) ? data : [];

    const missingMuseumIds = [];
    const exhibitionsWithMuseums = rows.map((row) => {
      const normalisedMuseum = normalizeMuseumRow(row.museum);
      if (!normalisedMuseum && row.museum_id) {
        missingMuseumIds.push(row.museum_id);
      }

      return {
        ...row,
        museum: normalisedMuseum || null,
      };
    });

    let museumMap = new Map();

    if (missingMuseumIds.length > 0) {
      const uniqueIds = [...new Set(missingMuseumIds)];
      museumMap = await fetchMuseumsByIds(uniqueIds);
    }

    const exhibitions = exhibitionsWithMuseums
      .map((row) => {
        if (row.museum && row.museum.slug) {
          return row;
        }

        let resolvedMuseum = null;

        if (row.museum_id && museumMap.has(row.museum_id)) {
          resolvedMuseum = museumMap.get(row.museum_id);
        }

        if (!resolvedMuseum) {
          const slugCandidates = [
            row.museum_slug,
            row.museumSlug,
            row.museum_slugnaam,
            row.slug_museum,
          ];
          const fallbackSlug = slugCandidates.find((slug) => typeof slug === 'string' && slug.trim());

          if (fallbackSlug) {
            const trimmedSlug = fallbackSlug.trim();
            resolvedMuseum = normalizeMuseumRow({
              id: row.museum_id ?? trimmedSlug,
              slug: trimmedSlug,
              naam: museumNames[trimmedSlug] || row.museum_naam || row.museumName || null,
              stad: row.museum_stad || row.museumCity || null,
              provincie: row.museum_provincie || row.museumProvince || null,
              gratis_toegankelijk:
                resolveBooleanFlag(
                  row.museum_gratis_toegankelijk,
                  row.museumGratis,
                  row.museum_free,
                  row.museumFree
                ) === true,
              ticket_affiliate_url:
                row.museum_ticket_affiliate_url || row.museumTicketAffiliateUrl || null,
              website_url: row.museum_website_url || row.museumWebsiteUrl || null,
              afbeelding_url: row.museum_afbeelding_url || null,
              image_url: row.museum_image_url || museumImages[trimmedSlug] || null,
            });
          }
        }

        if (!resolvedMuseum || !resolvedMuseum.slug) {
          return null;
        }

        return {
          ...row,
          museum: resolvedMuseum,
        };
      })
      .filter(Boolean)
      .map((row) => ({
        id: row.id,
        titel: row.titel || null,
        start_datum: row.start_datum || row.startDatum || null,
        eind_datum: row.eind_datum || row.eindDatum || null,
        beschrijving: row.beschrijving || row.omschrijving || row.description || null,
        omschrijving: row.omschrijving || null,
        description: row.description || null,
        gratis: row.gratis,
        free: row.free,
        kosteloos: row.kosteloos,
        freeEntry: row.freeEntry,
        isFree: row.isFree,
        is_free: row.is_free,
        ticket_affiliate_url: row.ticket_affiliate_url || row.ticketAffiliateUrl || null,
        ticket_url: row.ticket_url || row.ticketUrl || null,
        bron_url: row.bron_url || row.source_url || null,
        afbeelding_url: row.afbeelding_url || row.image_url || null,
        image_url: row.image_url || null,
        hero_image_url: row.hero_image_url || row.heroImageUrl || null,
        hero_afbeelding_url: row.hero_afbeelding_url || row.heroAfbeeldingUrl || null,
        banner_url: row.banner_url || null,
        cover_url: row.cover_url || null,
        museum: row.museum,
      }));

    exhibitions.sort((a, b) => {
      const aStart = a.start_datum ? Date.parse(a.start_datum) : Number.POSITIVE_INFINITY;
      const bStart = b.start_datum ? Date.parse(b.start_datum) : Number.POSITIVE_INFINITY;
      if (aStart === bStart) {
        return (a.titel || '').localeCompare(b.titel || '');
      }
      return aStart - bStart;
    });

    return {
      props: {
        exhibitions,
        error: null,
      },
      revalidate: 60,
    };
  } catch (err) {
    return {
      props: {
        exhibitions: [],
        error: 'unknown',
      },
      revalidate: 60,
    };
  }
}
