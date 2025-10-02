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

function normalizeExhibitionRow(row) {
  if (!row) return null;

  const museum = row.musea || row.museum;
  if (!museum || !museum.slug) return null;

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

  const slug = museum.slug;
  const fallbackAffiliate = museum.ticket_affiliate_url || museumTicketUrls[slug] || null;
  const affiliateUrl = row.ticket_affiliate_url || fallbackAffiliate;
  const ticketUrl = row.ticket_url || museum.ticket_url || museum.website_url || null;

  return {
    id: row.id,
    title: row.titel,
    startDate: row.start_datum || null,
    endDate: row.eind_datum || null,
    description: row.beschrijving || row.omschrijving || '',
    sourceUrl: row.bron_url || null,
    moreInfoUrl: row.bron_url || null,
    ticketAffiliateUrl: affiliateUrl || null,
    ticketUrl: ticketUrl || null,
    museum: {
      id: museum.id,
      slug,
      name: museum.naam,
      city: museum.stad || null,
      province: museum.provincie || null,
    },
    image: museumImages[slug] || museum.afbeelding_url || museum.image_url || null,
    imageCredit: museumImageCredits[slug] || null,
    tags,
  };
}

function sortExhibitions(exhibitions) {
  return [...exhibitions].sort((a, b) => {
    const aStart = a.startDate ? new Date(`${a.startDate}T00:00:00`).getTime() : Infinity;
    const bStart = b.startDate ? new Date(`${b.startDate}T00:00:00`).getTime() : Infinity;
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
    let query = supabaseClient
      .from('exposities')
      .select('*, musea:museum_id(id, slug, naam, stad, provincie, ticket_affiliate_url, ticket_url, website_url, afbeelding_url)')
      .order('start_datum', { ascending: true });

    if (today) {
      query = query.or(`eind_datum.gte.${today},eind_datum.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      return {
        props: {
          exhibitions: [],
          error: 'queryFailed',
        },
      };
    }

    const normalized = Array.isArray(data)
      ? data
          .map((row) => normalizeExhibitionRow(row))
          .filter(Boolean)
      : [];

    const sorted = sortExhibitions(normalized);

    return {
      props: {
        exhibitions: sorted,
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
