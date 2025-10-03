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
    const today = todayYMD('Europe/Amsterdam');
    const { data, error } = await supabaseClient
      .from('exposities')
      .select(
        `id, titel, start_datum, eind_datum, beschrijving, omschrijving, description, gratis, free, kosteloos, freeEntry, isFree, is_free, ticket_affiliate_url, ticket_url, bron_url, afbeelding_url, image_url, hero_image_url, hero_afbeelding_url, banner_url, cover_url, museum:museum_id(id, slug, naam, stad, provincie, gratis_toegankelijk, ticket_affiliate_url, website_url, website, afbeelding_url, image_url)`
      )
      .or(`eind_datum.gte.${today},eind_datum.is.null`)
      .order('start_datum', { ascending: true });

    if (error) {
      return {
        props: {
          exhibitions: [],
          error: 'queryFailed',
        },
      };
    }

    const exhibitions = (data || [])
      .map((row) => {
        if (!row) return null;
        const museum = row.museum || null;
        if (!museum || !museum.slug) {
          return null;
        }

        return {
          id: row.id,
          titel: row.titel || null,
          start_datum: row.start_datum || null,
          eind_datum: row.eind_datum || null,
          beschrijving: row.beschrijving || null,
          omschrijving: row.omschrijving || null,
          description: row.description || null,
          gratis: row.gratis,
          free: row.free,
          kosteloos: row.kosteloos,
          freeEntry: row.freeEntry,
          isFree: row.isFree,
          is_free: row.is_free,
          ticket_affiliate_url: row.ticket_affiliate_url || null,
          ticket_url: row.ticket_url || null,
          bron_url: row.bron_url || null,
          afbeelding_url: row.afbeelding_url || null,
          image_url: row.image_url || null,
          hero_image_url: row.hero_image_url || null,
          hero_afbeelding_url: row.hero_afbeelding_url || null,
          banner_url: row.banner_url || null,
          cover_url: row.cover_url || null,
          museum: {
            id: museum.id,
            slug: museum.slug,
            naam: museum.naam || null,
            stad: museum.stad || museum.city || null,
            provincie: museum.provincie || museum.province || null,
            gratis_toegankelijk: museum.gratis_toegankelijk,
            ticket_affiliate_url: museum.ticket_affiliate_url || null,
            website_url: museum.website_url || museum.website || null,
            afbeelding_url: museum.afbeelding_url || null,
            image_url: museum.image_url || null,
          },
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
