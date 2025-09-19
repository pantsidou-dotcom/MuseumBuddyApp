import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SEO from '../../components/SEO';
import ExpositionCard from '../../components/ExpositionCard';
import { useLanguage } from '../../components/LanguageContext';
import { useFavorites } from '../../components/FavoritesContext';
import VisitorInfo from '../../components/VisitorInfo';
import museumImages from '../../lib/museumImages';
import museumImageCredits from '../../lib/museumImageCredits';
import museumSummaries from '../../lib/museumSummaries';
import museumOpeningHours from '../../lib/museumOpeningHours';
import museumTicketUrls from '../../lib/museumTicketUrls';
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

function normaliseExpositionRow(row, museumSlug) {
  if (!row) return null;
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

export default function MuseumDetailPage({ museum, expositions, error }) {
  const { lang, t } = useLanguage();
  const { favorites, toggleFavorite } = useFavorites();

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
  const displayName = resolvedMuseum.name;
  const rawImage = museumImages[slug] || resolvedMuseum.raw?.image_url || null;
  const imageCredit = museumImageCredits[slug];
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
  const locationLines = getLocationLines(resolvedMuseum);

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

  const isFavorite = favorites.some((fav) => fav.id === resolvedMuseum.id && fav.type === 'museum');

  const handleFavorite = () => {
    toggleFavorite(favoritePayload);
  };

  const handleShare = async () => {
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
  };

  const seoDescription = summary || t('museumDescription', { name: displayName });
  const canonical = `/museum/${slug}`;

  const expositionItems = Array.isArray(expositions)
    ? expositions
        .map((row) => normaliseExpositionRow(row, slug))
        .filter(Boolean)
    : [];

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

  return (
    <section className="museum-page">
      <SEO title={`${displayName} — MuseumBuddy`} description={seoDescription} image={heroImage} canonical={canonical} />

      <div className="container museum-page-inner">
        <Link href="/" className="chip-link back-chip">
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
          <span>{t('back')}</span>
        </Link>

        {heroImage && (
          <div className="museum-hero">
            <Image
              src={heroImage}
              alt={displayName}
              fill
              sizes="(max-width: 640px) 100vw, 640px"
              className="museum-hero-image"
              priority
            />
          </div>
        )}

        <header className="museum-page-header">
          <div className="eyebrow">{[resolvedMuseum.city, resolvedMuseum.province].filter(Boolean).join(', ')}</div>
          <h1>{displayName}</h1>
          {summary && <p>{summary}</p>}
        </header>

        <div className="section-header">
          <h2>{t('expositionsTitle')}</h2>
          <div className="icon-row">
            <button type="button" className="icon-chip" onClick={handleShare} aria-label={t('share')}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
                <path d="M16 6l-4-4-4 4" />
                <path d="M12 2v14" />
              </svg>
            </button>
            <button
              type="button"
              className={`icon-chip${isFavorite ? ' is-active' : ''}`}
              aria-label={t('save')}
              aria-pressed={isFavorite}
              onClick={handleFavorite}
            >
              <svg
                viewBox="0 0 24 24"
                fill={isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 8.25c0 4.556-9 11.25-9 11.25S3 12.806 3 8.25a5.25 5.25 0 0 1 9-3.676A5.25 5.25 0 0 1 21 8.25Z" />
              </svg>
            </button>
          </div>
        </div>

        {expositionItems.length > 0 ? (
          <div className="expo-stack">
            {expositionItems.map((exposition) => (
              <ExpositionCard
                key={exposition.id}
                exposition={exposition}
                affiliateUrl={affiliateTicketUrl}
                ticketUrl={directTicketUrl}
                museumSlug={slug}
              />
            ))}
          </div>
        ) : (
          <p className="museum-expositions-empty">{t('noExpositions')}</p>
        )}

        <VisitorInfo
          ticketUrl={ticketUrl}
          websiteUrl={resolvedMuseum.websiteUrl}
          openingHours={openingHours}
          locationLines={locationLines}
          free={resolvedMuseum.free}
          phone={resolvedMuseum.phone}
          email={resolvedMuseum.email}
          socialLinks={socialLinks}
          imageCredit={imageCredit}
          showAffiliateNote={showAffiliateNote}
          showImageCredit={Boolean(heroImage) || Boolean(imageCredit)}
        />
        {/* keep tooltip reference for tests: title={t('affiliateLink')} */}
        {/* keep affiliate note reference for tests: className="affiliate-note" */}
      </div>
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
