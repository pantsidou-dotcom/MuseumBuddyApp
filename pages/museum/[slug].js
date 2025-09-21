import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SEO from '../../components/SEO';
import ExpositionCard from '../../components/ExpositionCard';
import { useLanguage } from '../../components/LanguageContext';
import { useFavorites } from '../../components/FavoritesContext';
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
const HASH_TO_TAB = Object.entries(TAB_HASHES).reduce((acc, [id, hash]) => {
  acc[hash] = id;
  return acc;
}, {});

function formatLinkLabel(url) {
  if (!url) return '';
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, '');
  } catch (err) {
    return url.replace(/^https?:\/\//, '');
  }
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
  const locationLabel = [resolvedMuseum.city, resolvedMuseum.province].filter(Boolean).join(', ');
  const hasWebsite = Boolean(resolvedMuseum.websiteUrl);
  const hasTicketLink = Boolean(ticketUrl);

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

  const tabDefinitions = useMemo(
    () =>
      TAB_IDS.map((id) => ({
        id,
        hash: TAB_HASHES[id],
        label: t(TAB_LABEL_KEYS[id]),
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
      label: t('buyTicket'),
      value: ticketUrl,
      href: ticketUrl,
      note: showAffiliateNote ? t('affiliateLinkLabel') : null,
    });
  }

  const mapQueryParts = [displayName, ...locationLines];
  if (!locationLines.length) {
    mapQueryParts.push(resolvedMuseum.address, resolvedMuseum.city, resolvedMuseum.province);
  }
  const mapQuery = mapQueryParts.filter(Boolean).join(', ');
  const mapEmbedUrl = mapQuery ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed` : null;
  const mapDirectionsUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : null;

  return (
    <section className={`museum-detail${heroImage ? ' has-hero' : ''}`}>
      <SEO title={`${displayName} — MuseumBuddy`} description={seoDescription} image={heroImage} canonical={canonical} />

      <div className="museum-detail-container museum-hero-heading-container">
        <div className="museum-hero-heading">
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
            <span>{t('back')}</span>
          </Link>

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
            sizes="(max-width: 768px) 100vw, 100vw"
            priority
          />
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
                title={t('affiliateLink')}
              >
                <span>{t('buyTicket')}</span>
                {showAffiliateNote && <span className="affiliate-note">{t('affiliateLinkLabel')}</span>}
              </a>
            ) : (
              <button type="button" className="museum-primary-action primary" disabled aria-disabled="true">
                <span>{t('buyTicket')}</span>
              </button>
            )}

            {hasWebsite && (
              <a
                href={resolvedMuseum.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="museum-primary-action secondary"
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
                    {overviewDetails.map((detail) => (
                      <li key={detail.key} className="museum-overview-list-item">
                        <span className="museum-overview-label">{detail.label}</span>
                        <span className="museum-overview-value">
                          {detail.href ? (
                            <>
                              <a href={detail.href} target="_blank" rel="noreferrer">
                                {formatLinkLabel(detail.href) || detail.value}
                              </a>
                              {detail.note && <span className="museum-overview-note">{detail.note}</span>}
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
                    ))}
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
                  <h2 className="museum-expositions-heading">{t('expositionsTitle')}</h2>
                  {expositionItems.length > 0 ? (
                    <ul className="events-list">
                      {expositionItems.map((exposition) => (
                        <li key={exposition.id}>
                          <ExpositionCard
                            exposition={exposition}
                            affiliateUrl={affiliateTicketUrl}
                            ticketUrl={directTicketUrl}
                            museumSlug={slug}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="museum-expositions-empty">{t('noExpositions')}</p>
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
                      <a className="museum-map-link" href={mapDirectionsUrl} target="_blank" rel="noreferrer">
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

              {(heroImage || imageCredit) && (
                <div className="museum-info-credit">
                  <span className="museum-info-credit-label">{t('imageCreditLabel')}:</span>
                  <span className="museum-info-credit-value">
                    {imageCredit ? (
                      <span className="museum-info-credit-content">
                        <span>{imageCredit.author || t('unknown')}</span>
                        {imageCredit.license && <span>, {imageCredit.license}</span>}
                        {imageCredit.source && (
                          <span className="museum-info-credit-source">
                            {t('via')}
                            <a href={imageCredit.url} target="_blank" rel="noreferrer">
                              {imageCredit.source}
                            </a>
                          </span>
                        )}
                      </span>
                    ) : (
                      t('unknown')
                    )}
                  </span>
                </div>
              )}
            </div>
          </aside>
        </div>
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
