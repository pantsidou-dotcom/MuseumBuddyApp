import { useEffect, useMemo, useState } from 'react';
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

const TAB_ORDER = ['overview', 'exhibitions', 'info', 'map'];

const TAB_HASHES = {
  overview: 'overzicht',
  exhibitions: 'tentoonstellingen',
  info: 'bezoekersinfo',
  map: 'kaart',
};

function normaliseHash(hash) {
  if (!hash) return '';
  return hash.replace(/^#/, '').toLowerCase();
}

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

export default function MuseumDetailPage({ museum, expositions, error }) {
  const { lang, t } = useLanguage();
  const { favorites, toggleFavorite } = useFavorites();
  const resolvedMuseum = useMemo(() => (museum ? { ...museum } : null), [museum]);
  const slug = resolvedMuseum?.slug || null;

  const expositionItems = useMemo(
    () =>
      Array.isArray(expositions)
        ? expositions.map((row) => normaliseExpositionRow(row, slug)).filter(Boolean)
        : [],
    [expositions, slug]
  );

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const current = normaliseHash(window.location.hash);
      const matchedTab = TAB_ORDER.find((key) => TAB_HASHES[key] === current);
      if (matchedTab) {
        return matchedTab;
      }
    }
    return expositionItems.length > 0 ? 'exhibitions' : 'overview';
  });

  const tabLabels = useMemo(
    () => ({
      overview: t('museumTabOverview'),
      exhibitions: t('museumTabExhibitions'),
      info: t('museumTabVisitorInfo'),
      map: t('museumTabMap'),
    }),
    [t]
  );

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
  const mapQuerySource = locationLines.length
    ? locationLines.join(', ')
    : [resolvedMuseum.address, resolvedMuseum.city, resolvedMuseum.province].filter(Boolean).join(', ');
  const mapQuery = mapQuerySource.trim();
  const mapEmbedUrl = mapQuery ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed` : null;
  const mapDirectionsUrl = mapQuery ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}` : null;
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

  const handleTabSelect = (tabKey) => {
    if (!TAB_ORDER.includes(tabKey)) return;
    setActiveTab(tabKey);
  };

  const handleTabKeyDown = (event, currentKey) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const currentIndex = TAB_ORDER.indexOf(currentKey);
    if (currentIndex === -1) return;
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % TAB_ORDER.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = TAB_ORDER.length - 1;
    }
    const nextKey = TAB_ORDER[nextIndex];
    handleTabSelect(nextKey);
    if (typeof document !== 'undefined') {
      const nextButton = document.getElementById(`museum-tab-${nextKey}`);
      if (nextButton) {
        nextButton.focus();
      }
    }
  };

  const seoDescription = summary || t('museumDescription', { name: displayName });
  const canonical = `/museum/${slug}`;

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const applyHash = () => {
      const current = normaliseHash(window.location.hash);
      const matchedTab = TAB_ORDER.find((key) => TAB_HASHES[key] === current);
      if (matchedTab) {
        setActiveTab(matchedTab);
      }
    };

    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => {
      window.removeEventListener('hashchange', applyHash);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = TAB_HASHES[activeTab];
    if (!hash) return;
    if (normaliseHash(window.location.hash) === hash) return;
    const { pathname, search } = window.location;
    const base = `${pathname}${search}`;
    window.history.replaceState(null, '', `${base}#${hash}`);
  }, [activeTab]);

  const VisitorInfoSection = () => (
    <>
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
          <span className="museum-info-credit-label">{t('imageCreditLabel')}:</span>{' '}
          {imageCredit ? (
            <>
              {imageCredit.author || t('unknown')}
              {imageCredit.license ? `, ${imageCredit.license}` : ''}
              {imageCredit.source && (
                <>
                  {' '}
                  {t('via')}{' '}
                  <a href={imageCredit.url} target="_blank" rel="noreferrer">
                    {imageCredit.source}
                  </a>
                </>
              )}
            </>
          ) : (
            t('unknown')
          )}
        </div>
      )}
    </>
  );

  return (
    <section className={`museum-detail${heroImage ? ' has-hero' : ''}`}>
      <SEO title={`${displayName} — MuseumBuddy`} description={seoDescription} image={heroImage} canonical={canonical} />

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
          <div className="museum-expositions-card">
            <div className="museum-tabs">
              <div className="museum-tablist" role="tablist" aria-label={t('museumTabsLabel') || 'Sections'}>
                {TAB_ORDER.map((key) => {
                  const isActive = activeTab === key;
                  const tabId = `museum-tab-${key}`;
                  const panelId = TAB_HASHES[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      id={tabId}
                      aria-controls={panelId}
                      aria-selected={isActive}
                      className={`museum-tab${isActive ? ' is-active' : ''}`}
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => handleTabSelect(key)}
                      onKeyDown={(event) => handleTabKeyDown(event, key)}
                    >
                      <span>{tabLabels[key] || key}</span>
                    </button>
                  );
                })}
              </div>

              <div className="museum-tabpanels">
                <section
                  id={TAB_HASHES.overview}
                  role="tabpanel"
                  aria-labelledby="museum-tab-overview"
                  className={`museum-tabpanel${activeTab === 'overview' ? ' is-active' : ''}`}
                  hidden={activeTab !== 'overview'}
                >
                  <div className="museum-tabpanel-content">
                    <header className="museum-detail-header">
                      <div>
                        <p className="detail-sub">
                          {[resolvedMuseum.city, resolvedMuseum.province].filter(Boolean).join(', ')}
                        </p>
                        <h1 className="detail-title">{displayName}</h1>
                        {summary && <p className="detail-sub">{summary}</p>}
                      </div>
                    </header>
                  </div>
                </section>

                <section
                  id={TAB_HASHES.exhibitions}
                  role="tabpanel"
                  aria-labelledby="museum-tab-exhibitions"
                  className={`museum-tabpanel${activeTab === 'exhibitions' ? ' is-active' : ''}`}
                  hidden={activeTab !== 'exhibitions'}
                >
                  <div className="museum-tabpanel-content">
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
                  id={TAB_HASHES.info}
                  role="tabpanel"
                  aria-labelledby="museum-tab-info"
                  className={`museum-tabpanel${activeTab === 'info' ? ' is-active' : ''}`}
                  hidden={activeTab !== 'info'}
                >
                  <div className="museum-tabpanel-content">
                    <h2 className="museum-tabpanel-title">{tabLabels.info || t('visitorInformation')}</h2>
                    <VisitorInfoSection />
                  </div>
                </section>

                <section
                  id={TAB_HASHES.map}
                  role="tabpanel"
                  aria-labelledby="museum-tab-map"
                  className={`museum-tabpanel${activeTab === 'map' ? ' is-active' : ''}`}
                  hidden={activeTab !== 'map'}
                >
                  <div className="museum-tabpanel-content">
                    <h2 className="museum-tabpanel-title">{tabLabels.map || t('museumTabMap')}</h2>
                    {mapEmbedUrl ? (
                      <div className="museum-map-frame">
                        <iframe
                          src={mapEmbedUrl}
                          title={t('museumMapTitle', { name: displayName })}
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          className="museum-map-embed"
                        />
                      </div>
                    ) : (
                      <p className="museum-map-empty">{t('museumMapUnavailable')}</p>
                    )}
                    {mapDirectionsUrl && (
                      <a className="museum-map-link" href={mapDirectionsUrl} target="_blank" rel="noreferrer">
                        {t('openInMaps')}
                      </a>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>

          <aside className="museum-sidebar">
            <div className="museum-sidebar-card support-card">
              <h2 className="museum-sidebar-title">{t('visitorInformation')}</h2>
              <VisitorInfoSection />
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
