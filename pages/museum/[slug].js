import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SEO from '../../components/SEO';
import { useLanguage } from '../../components/LanguageContext';
import { useFavorites } from '../../components/FavoritesContext';
import { useTheme } from '../../components/ThemeContext';
import museumImages from '../../lib/museumImages';
import museumImageCredits from '../../lib/museumImageCredits';
import museumSummaries from '../../lib/museumSummaries';
import museumOpeningHours from '../../lib/museumOpeningHours';
import museumTicketUrls from '../../lib/museumTicketUrls';
import { supabase as supabaseClient } from '../../lib/supabase';
import { shouldShowAffiliateNote } from '../../lib/nonAffiliateMuseums';
import {
  Topbar,
  TopbarInner,
  Logo,
  IconRow,
  IconBtn,
  FavoriteBadge,
  SearchRow,
  SearchInput,
  FilterBtn,
  PageHeader as HeaderBlock,
  SectionHeader,
  ChipIcon,
  ExpositionList,
  ExpoCard,
  Fab,
  ExpoMeta,
  ExpoTitle,
  CTA,
  VisitorCard,
  VisitorTitle,
  ButtonRow,
  PrimaryLink,
  GhostLink,
  Label,
  Value,
  Credit,
  PageSurface,
  PageContainer,
  SectionSpacing,
  FooterText,
  FilterBackdrop,
  FilterSheet,
  FilterHeader,
  FilterTitle,
  FilterClose,
  FilterBody,
  FilterOption,
  FilterActions,
  SheetPrimaryButton,
  SheetSecondaryButton,
  EmptyState,
  fabActiveClass,
  ctaDisabledClass,
} from '../../components/ui';

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

function formatRange(start, end, locale) {
  if (!start) return '';
  const opts = { day: '2-digit', month: 'short' };
  const startFmt = start.toLocaleDateString(locale, opts).toUpperCase();
  if (!end) return startFmt;
  const endFmt = end.toLocaleDateString(locale, opts).toUpperCase();
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    const month = startFmt.split(' ')[1];
    return `${start.getDate().toString().padStart(2, '0')} - ${end
      .getDate()
      .toString()
      .padStart(2, '0')} ${month}`;
  }
  return `${startFmt} - ${endFmt}`;
}

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ');
}

function FilterBottomSheet({
  open,
  onClose,
  filters,
  onToggle,
  onReset,
  onApply,
  lang,
}) {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const node = sheetRef.current;
    if (!node) return undefined;
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])';

    const getFocusable = () =>
      Array.from(node.querySelectorAll(focusableSelector)).filter(
        (el) => !el.hasAttribute('data-focus-guard') && !el.getAttribute('aria-hidden')
      );

    const firstFocus = getFocusable()[0];
    if (firstFocus) firstFocus.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        const items = getFocusable();
        if (!items.length) {
          event.preventDefault();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    node.addEventListener('keydown', handleKeyDown);
    return () => {
      node.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const copy = {
    filters: lang === 'nl' ? 'Filters' : 'Filters',
    reset: lang === 'nl' ? 'Reset' : 'Reset',
    apply: lang === 'nl' ? 'Toepassen' : 'Apply',
    close: lang === 'nl' ? 'Sluit filters' : 'Close filters',
    futureOnly: lang === 'nl' ? 'Alleen lopende exposities' : 'Upcoming only',
    affiliateOnly: lang === 'nl' ? 'Alleen met affiliate-link' : 'Affiliate links only',
    favoritesOnly: lang === 'nl' ? 'Alleen favorieten' : 'Favorites only',
  };

  return (
    <FilterBackdrop
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <FilterSheet
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filters-title"
      >
        <FilterHeader>
          <FilterTitle id="filters-title">{copy.filters}</FilterTitle>
          <FilterClose aria-label={copy.close} onClick={onClose}>
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </FilterClose>
        </FilterHeader>
        <FilterBody>
          <FilterOption>
            <input
              type="checkbox"
              checked={Boolean(filters.futureOnly)}
              onChange={() => onToggle('futureOnly')}
            />
            <span>{copy.futureOnly}</span>
          </FilterOption>
          <FilterOption>
            <input
              type="checkbox"
              checked={Boolean(filters.affiliateOnly)}
              onChange={() => onToggle('affiliateOnly')}
            />
            <span>{copy.affiliateOnly}</span>
          </FilterOption>
          <FilterOption>
            <input
              type="checkbox"
              checked={Boolean(filters.favoritesOnly)}
              onChange={() => onToggle('favoritesOnly')}
            />
            <span>{copy.favoritesOnly}</span>
          </FilterOption>
        </FilterBody>
        <FilterActions>
          <SheetSecondaryButton
            onClick={() => {
              onReset();
              onClose();
            }}
          >
            {copy.reset}
          </SheetSecondaryButton>
          <SheetPrimaryButton
            onClick={() => {
              onApply();
              onClose();
            }}
          >
            {copy.apply}
          </SheetPrimaryButton>
        </FilterActions>
      </FilterSheet>
    </FilterBackdrop>
  );
}

function resolveFavoriteExpositionIds(favorites) {
  return new Set(
    (favorites || [])
      .filter((item) => item?.type === 'exposition' && item.id)
      .map((item) => item.id)
  );
}

function prepareOpeningHours(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw.join('\n');
  return String(raw);
}

export default function MuseumDetailPage({ museum, expositions, error }) {
  const { lang, t, switchLang } = useLanguage();
  const { favorites, toggleFavorite } = useFavorites();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({ futureOnly: false, affiliateOnly: false, favoritesOnly: false });
  const filterButtonRef = useRef(null);

  const resolvedMuseum = useMemo(() => (museum ? { ...museum } : null), [museum]);
  const languageLabel = lang === 'en' ? 'Switch language to Dutch' : 'Wissel taal naar Engels';
  const filterLabel = lang === 'en' ? 'Filters' : 'Filters';

  useEffect(() => {
    if (!filtersOpen && filterButtonRef.current) {
      filterButtonRef.current.focus();
    }
  }, [filtersOpen]);

  if (error) {
    return (
      <PageSurface>
        <PageContainer>
          <SEO title="MuseumBuddy" description={t('somethingWrong')} />
          <EmptyState>{t('somethingWrong')}</EmptyState>
        </PageContainer>
      </PageSurface>
    );
  }

  if (!resolvedMuseum) {
    return (
      <PageSurface>
        <PageContainer>
          <SEO title="MuseumBuddy" description={t('somethingWrong')} />
          <EmptyState>{t('somethingWrong')}</EmptyState>
        </PageContainer>
      </PageSurface>
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
  const openingText = prepareOpeningHours(openingHours);

  const favoriteMuseumPayload = useMemo(
    () => ({
      id: resolvedMuseum.id,
      slug,
      title: displayName,
      city: resolvedMuseum.city,
      province: resolvedMuseum.province,
      free: resolvedMuseum.free,
      image: rawImage,
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
      rawImage,
      imageCredit,
      ticketUrl,
    ]
  );

  const museumIsFavorite = favorites.some((item) => item.id === resolvedMuseum.id && item.type === 'museum');

  const handleMuseumFavorite = () => {
    toggleFavorite(favoriteMuseumPayload);
  };

  const handleMuseumShare = useCallback(async () => {
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

  const expositionItems = useMemo(() => {
    if (!Array.isArray(expositions)) return [];
    return expositions
      .map((row) => normaliseExpositionRow(row, slug))
      .filter(Boolean);
  }, [expositions, slug]);

  const favoriteExpositionIds = useMemo(() => resolveFavoriteExpositionIds(favorites), [favorites]);

  const filteredExpositions = useMemo(() => {
    const now = new Date();
    return expositionItems.filter((expo) => {
      if (!expo) return false;
      if (filters.affiliateOnly && !expo.ticketAffiliateUrl && !expo.ticketUrl) {
        return false;
      }
      if (filters.favoritesOnly && !favoriteExpositionIds.has(expo.id)) {
        return false;
      }
      if (filters.futureOnly) {
        const end = expo.eind_datum ? new Date(`${expo.eind_datum}T00:00:00`) : null;
        if (end && end < now) {
          return false;
        }
      }
      return true;
    });
  }, [expositionItems, filters, favoriteExpositionIds]);

  const seoDescription = summary || t('museumDescription', { name: displayName });
  const canonical = `/museum/${slug}`;

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const value = searchValue.trim();
    if (!value) return;
    router.push(`/?q=${encodeURIComponent(value)}`);
  };

  const toggleFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <PageSurface>
      <SEO title={`${displayName} — MuseumBuddy`} description={seoDescription} image={rawImage} canonical={canonical} />

      <Topbar>
        <TopbarInner>
          <Logo>MUSEUM BUDDY</Logo>
          <IconRow>
            <IconBtn onClick={() => switchLang(lang === 'en' ? 'nl' : 'en')} aria-label={languageLabel}>
              {lang === 'en' ? 'EN' : 'NL'}
            </IconBtn>
            <IconBtn onClick={toggleTheme} aria-label={t('contrast')}>
              {theme === 'dark' ? (
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </IconBtn>
            <Link href="/favorites" passHref legacyBehavior>
              <IconBtn as="a" aria-label={t('favoritesLabel')}>
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 8.25c0 4.556-9 11.25-9 11.25S3 12.806 3 8.25a5.25 5.25 0 0 1 9-3.676A5.25 5.25 0 0 1 21 8.25Z" />
                </svg>
                {favorites.length > 0 && <FavoriteBadge>{favorites.length}</FavoriteBadge>}
              </IconBtn>
            </Link>
          </IconRow>
        </TopbarInner>
      </Topbar>

      <PageContainer>
        <SearchRow as="form" onSubmit={handleSearchSubmit} role="search">
          <SearchInput
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
          />
          <FilterBtn
            ref={filterButtonRef}
            onClick={() => setFiltersOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={filtersOpen}
            aria-label={filterLabel}
          >
            {filterLabel}
          </FilterBtn>
        </SearchRow>

        <HeaderBlock>
          <div className="eyebrow">{[resolvedMuseum.city, resolvedMuseum.province].filter(Boolean).join(', ')}</div>
          <h1>{displayName}</h1>
          {summary && <p>{summary}</p>}
        </HeaderBlock>

        <SectionHeader>
          <h2>{t('expositionsTitle')}</h2>
          <IconRow>
            <ChipIcon onClick={handleMuseumShare} aria-label={t('share')}>
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
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
            </ChipIcon>
            <ChipIcon onClick={handleMuseumFavorite} aria-label={t('save')}>
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill={museumIsFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 8.25c0 4.556-9 11.25-9 11.25S3 12.806 3 8.25a5.25 5.25 0 0 1 9-3.676A5.25 5.25 0 0 1 21 8.25Z" />
              </svg>
            </ChipIcon>
          </IconRow>
        </SectionHeader>

        {filteredExpositions.length > 0 ? (
          <ExpositionList>
            {filteredExpositions.map((exposition) => {
              const start = exposition.start_datum ? new Date(`${exposition.start_datum}T00:00:00`) : null;
              const end = exposition.eind_datum ? new Date(`${exposition.eind_datum}T00:00:00`) : null;
              const locale = lang === 'en' ? 'en-US' : 'nl-NL';
              const rangeLabel = formatRange(start, end, locale);
              const buyUrl =
                exposition.ticketAffiliateUrl || exposition.ticketUrl || exposition.bron_url || affiliateTicketUrl || directTicketUrl;
              const showNote = Boolean(exposition.ticketAffiliateUrl || affiliateTicketUrl) && shouldShowAffiliateNote(slug);
              const isFavorite = favoriteExpositionIds.has(exposition.id);

              const handleFavoriteToggle = () => {
                toggleFavorite({
                  id: exposition.id,
                  titel: exposition.titel,
                  start_datum: exposition.start_datum,
                  eind_datum: exposition.eind_datum,
                  bron_url: exposition.bron_url,
                  ticketAffiliateUrl: exposition.ticketAffiliateUrl,
                  ticketUrl: exposition.ticketUrl,
                  museumSlug: exposition.museumSlug,
                  type: 'exposition',
                });
              };

              return (
                <ExpoCard key={exposition.id}>
                  <Fab
                    onClick={handleFavoriteToggle}
                    className={joinClasses(isFavorite && fabActiveClass)}
                    aria-label={t('save')}
                    aria-pressed={isFavorite}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill={isFavorite ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 8.25c0 4.556-9 11.25-9 11.25S3 12.806 3 8.25a5.25 5.25 0 0 1 9-3.676A5.25 5.25 0 0 1 21 8.25Z" />
                    </svg>
                  </Fab>
                  <ExpoMeta>
                    {rangeLabel ? (
                      <>
                        <span>{t('duration')}</span>
                        <span>{rangeLabel}</span>
                      </>
                    ) : (
                      <span>{t('duration')}</span>
                    )}
                  </ExpoMeta>
                  <ExpoTitle>{exposition.titel}</ExpoTitle>
                  {buyUrl ? (
                    <CTA
                      as="a"
                      href={buyUrl}
                      target="_blank"
                      rel="noreferrer"
                      title={t('affiliateLink')}
                      aria-label={`${t('buyTicket')} - ${exposition.titel}`}
                    >
                      <span>{t('buyTicket')}</span>
                      {showNote && <small className="affiliate-note">{t('affiliateLinkLabel')}</small>}
                    </CTA>
                  ) : (
                    <CTA className={ctaDisabledClass} disabled aria-disabled="true">
                      <span>{t('buyTicket')}</span>
                    </CTA>
                  )}
                </ExpoCard>
              );
            })}
          </ExpositionList>
        ) : (
          <EmptyState>{t('noExpositions')}</EmptyState>
        )}

        <SectionSpacing />

        <VisitorCard>
          <VisitorTitle>{t('visitorInformation')}</VisitorTitle>
          <ButtonRow>
            {ticketUrl ? (
              <PrimaryLink
                href={ticketUrl}
                target="_blank"
                rel="noreferrer"
                title={showAffiliateNote ? t('affiliateLink') : undefined}
                aria-label={`${t('buyTicket')} - ${displayName}`}
              >
                {t('buyTicket')}
              </PrimaryLink>
            ) : (
              <PrimaryLink as="span" className={ctaDisabledClass} aria-disabled="true">
                {t('buyTicket')}
              </PrimaryLink>
            )}
            {resolvedMuseum.websiteUrl ? (
              <GhostLink href={resolvedMuseum.websiteUrl} target="_blank" rel="noreferrer">
                {t('website')}
              </GhostLink>
            ) : (
              <GhostLink as="span" className={ctaDisabledClass} aria-disabled="true">
                {t('website')}
              </GhostLink>
            )}
          </ButtonRow>

          {openingText && (
            <>
              <Label>{t('openingHours')}</Label>
              <Value>
                {openingText.split('\n').map((line, index, arr) => (
                  <span key={`${line}-${index}`}>
                    {line}
                    {index < arr.length - 1 && <br />}
                  </span>
                ))}
              </Value>
            </>
          )}

          {locationLines.length > 0 && (
            <>
              <Label>{t('location')}</Label>
              <Value>
                {locationLines.map((line, index) => (
                  <span key={`${line}-${index}`}>
                    {line}
                    {index < locationLines.length - 1 && <br />}
                  </span>
                ))}
              </Value>
            </>
          )}

          {(rawImage || imageCredit) && (
            <Credit>
              {t('imageCreditLabel')}{' '}
              {imageCredit ? (
                <>
                  {imageCredit.author || t('unknown')}
                  {imageCredit.license ? `, ${imageCredit.license}` : ''}
                  {imageCredit.source && (
                    <>
                      {' '}
                      {t('via')}{' '}
                      {imageCredit.url ? (
                        <a href={imageCredit.url} target="_blank" rel="noreferrer">
                          {imageCredit.source}
                        </a>
                      ) : (
                        imageCredit.source
                      )}
                    </>
                  )}
                </>
              ) : (
                t('unknown')
              )}
            </Credit>
          )}
        </VisitorCard>

        <FooterText>{t('affiliateLink')}</FooterText>
      </PageContainer>

      <FilterBottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onToggle={toggleFilter}
        onReset={() => setFilters({ futureOnly: false, affiliateOnly: false, favoritesOnly: false })}
        onApply={() => {}}
        lang={lang}
      />
    </PageSurface>
  );
}

MuseumDetailPage.getLayout = (page) => page;

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
