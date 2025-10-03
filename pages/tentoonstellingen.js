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

const EXHIBITION_SELECT_COLUMNS = '*';

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
    };
  }

  try {
    const { data, error } = await supabaseClient.from('exposities').select(EXHIBITION_SELECT_COLUMNS);

    if (error) {
      return {
        props: {
          exhibitions: [],
          error: 'queryFailed',
        },
      };
    }

    const rows = Array.isArray(data) ? data : [];

    const museumIdSet = new Set();
    const museumSlugSet = new Set();

    const addIdCandidate = (value) => {
      if (value === null || value === undefined) return;
      museumIdSet.add(value);
    };

    const addSlugCandidate = (value) => {
      if (typeof value !== 'string') return;
      const trimmed = value.trim();
      if (!trimmed) return;
      museumSlugSet.add(trimmed);
    };

    rows.forEach((row) => {
      if (!row || typeof row !== 'object') {
        return;
      }

      addIdCandidate(row.museum_id);
      addIdCandidate(row.museumId);
      addIdCandidate(row?.museum?.id);

      addSlugCandidate(row?.museum?.slug);
      addSlugCandidate(row.museum_slug);
      addSlugCandidate(row.museumSlug);
      addSlugCandidate(row.museum_slugnaam);
      addSlugCandidate(row.slug_museum);
    });

    let museumMapById = new Map();
    let museumMapBySlug = new Map();

    const fetchMuseums = async (column, values) => {
      if (!Array.isArray(values) || values.length === 0) {
        return [];
      }

      const { data: museumData, error: museumError } = await supabaseClient
        .from('musea')
        .select(MUSEUM_SELECT_COLUMNS)
        .in(column, values);

      if (museumError && museumError.message && /column|identifier|relationship/i.test(museumError.message)) {
        const { data: fallbackData, error: fallbackError } = await supabaseClient
          .from('musea')
          .select(MUSEUM_SELECT_FALLBACK_COLUMNS)
          .in(column, values);

        if (!fallbackError) {
          return Array.isArray(fallbackData) ? fallbackData : [];
        }

        return [];
      }

      if (museumError) {
        return [];
      }

      return Array.isArray(museumData) ? museumData : [];
    };

    const museumIds = Array.from(museumIdSet);
    if (museumIds.length > 0) {
      const museumData = await fetchMuseums('id', museumIds);
      const normalisedMuseums = museumData
        .map((museumRow) => normalizeMuseumRow(museumRow))
        .filter((museum) => museum && museum.slug);

      museumMapById = new Map(normalisedMuseums.map((museum) => [museum.id, museum]));
      museumMapBySlug = new Map(normalisedMuseums.map((museum) => [museum.slug, museum]));
    }

    const knownSlugSet = new Set(museumMapBySlug.keys());
    const missingSlugs = Array.from(museumSlugSet).filter((slug) => !knownSlugSet.has(slug));

    if (missingSlugs.length > 0) {
      const museumsBySlug = await fetchMuseums('slug', missingSlugs);

      museumsBySlug.forEach((museumRow) => {
        const normalised = normalizeMuseumRow(museumRow);
        if (!normalised || !normalised.slug) {
          return;
        }
        museumMapBySlug.set(normalised.slug, normalised);
        if (normalised.id !== undefined && normalised.id !== null && !museumMapById.has(normalised.id)) {
          museumMapById.set(normalised.id, normalised);
        }
      });
    }

    const exhibitions = rows
      .map((row) => {
        if (!row || typeof row !== 'object') {
          return null;
        }

        const directMuseum = normalizeMuseumRow(row.museum);
        const idCandidates = [row.museum_id, row.museumId, directMuseum?.id];
        const slugCandidates = [
          directMuseum?.slug,
          row.museum_slug,
          row.museumSlug,
          row.museum_slugnaam,
          row.slug_museum,
        ];

        let resolvedMuseum = directMuseum;

        for (const idCandidate of idCandidates) {
          if (resolvedMuseum && resolvedMuseum.slug) break;
          if (idCandidate === null || idCandidate === undefined) continue;
          const match = museumMapById.get(idCandidate);
          if (match) {
            resolvedMuseum = match;
          }
        }

        for (const slugCandidate of slugCandidates) {
          if (resolvedMuseum && resolvedMuseum.slug) break;
          if (typeof slugCandidate !== 'string') continue;
          const trimmed = slugCandidate.trim();
          if (!trimmed) continue;
          const match = museumMapBySlug.get(trimmed);
          if (match) {
            resolvedMuseum = match;
          }
        }

        if (!resolvedMuseum || !resolvedMuseum.slug) {
          const fallbackSlug = slugCandidates.find((slug) => typeof slug === 'string' && slug.trim());
          if (fallbackSlug) {
            const trimmed = fallbackSlug.trim();
            const fallbackId = idCandidates.find((id) => id !== null && id !== undefined) ?? trimmed;
            resolvedMuseum = normalizeMuseumRow({
              id: fallbackId,
              slug: trimmed,
              naam: museumNames[trimmed] || row.museum_naam || row.museumName || null,
              stad: row.museum_stad || row.museumCity || null,
              provincie: row.museum_provincie || row.museumProvince || null,
              gratis_toegankelijk: resolveBooleanFlag(
                row.museum_gratis_toegankelijk,
                row.museumGratis,
                row.museum_free,
                row.museumFree
              ) === true,
              ticket_affiliate_url:
                row.museum_ticket_affiliate_url || row.museumTicketAffiliateUrl || null,
              website_url: row.museum_website_url || row.museumWebsiteUrl || null,
              afbeelding_url: row.museum_afbeelding_url || null,
              image_url: row.museum_image_url || museumImages[trimmed] || null,
            });
          }
        }

        if (!resolvedMuseum || !resolvedMuseum.slug) {
          return null;
        }

        return {
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
          museum: resolvedMuseum,
        };
      })
      .filter((row) => row && row.museum && row.museum.slug);

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
