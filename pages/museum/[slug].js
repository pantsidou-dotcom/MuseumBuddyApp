import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import Image from 'next/image';
import Link from 'next/link';
import SEO from '../../components/SEO';
import ExpositionCard from '../../components/ExpositionCard';
import ExpositionCarousel from '../../components/ExpositionCarousel';
import { useLanguage } from '../../components/LanguageContext';
import { useFavorites } from '../../components/FavoritesContext';
import TicketButtonNote from '../../components/TicketButtonNote';
import museumImages from '../../lib/museumImages';
import { normalizeImageSource, resolveImageUrl } from '../../lib/resolveImageSource';
import createBlurDataUrl from '../../lib/createBlurDataUrl';
import museumImageCredits from '../../lib/museumImageCredits';
import museumSummaries from '../../lib/museumSummaries';
import museumOpeningHours from '../../lib/museumOpeningHours';
import museumTicketUrls from '../../lib/museumTicketUrls';
import formatImageCredit from '../../lib/formatImageCredit';
import { supabase as supabaseClient } from '../../lib/supabase';
import { shouldShowAffiliateNote } from '../../lib/nonAffiliateMuseums';
import kidFriendlyMuseums, { isKidFriendly as resolveKidFriendly } from '../../lib/kidFriendlyMuseums';
import { getMuseumCategories } from '../../lib/museumCategories';
import { trackFavoriteAdd, trackTicketsClick } from '../../lib/analytics';
import { getStaticMuseumBySlug, getStaticMuseums } from '../../lib/staticMuseums';
import { getStaticExhibitionsForMuseumSlug } from '../../lib/staticExhibitions';
import { getSiteUrl } from '../../lib/siteUrl';

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

function normaliseExpositionRow(row, museumSlug) {
  if (!row) return null;
  const freeFlag = resolveBooleanFlag(row.gratis, row.free, row.kosteloos, row.freeEntry);
  const childFriendlyFlag = resolveBooleanFlag(
    row.kindvriendelijk,
    row.childFriendly,
    row.familievriendelijk,
    row.familyFriendly
  );
  let temporaryFlag = resolveBooleanFlag(
    row.tijdelijk,
    row.temporary,
    row.tijdelijkeTentoonstelling,
    row.temporaryExhibition
  );
  if (temporaryFlag === undefined && row.start_datum && row.eind_datum) {
    temporaryFlag = true;
  }
  const tags = {
    free: freeFlag === true,
    childFriendly: childFriendlyFlag === true,
    temporary: temporaryFlag === true,
  };
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
    tags,
    free: tags.free,
    childFriendly: tags.childFriendly,
    temporary: tags.temporary,
  };
}

function getStaticExpositionRowsForSlug(slug) {
  return getStaticExhibitionsForMuseumSlug(slug).map((entry) => ({
    id: entry.id,
    titel: entry.titel,
    start_datum: entry.start_datum,
    eind_datum: entry.eind_datum,
    bron_url: entry.bron_url,
    beschrijving: entry.beschrijving || entry.omschrijving || entry.description || null,
    omschrijving: entry.omschrijving || entry.beschrijving || entry.description || null,
    ticket_affiliate_url: entry.ticket_affiliate_url || null,
    ticket_url: entry.ticket_url || null,
  }));
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

const CATEGORY_CONTENT = {
  history: {
    why: 'je historische context zoekt en Amsterdam beter wilt begrijpen',
    tips: 'Check vooraf of er rondleidingen of audiotours zijn voor extra context.',
    bestMoment: 'doordeweeks in de ochtend voor een rustiger bezoek met meer leestijd',
  },
  art: {
    why: 'je kunst in verschillende stijlen en perioden wilt vergelijken',
    tips: 'Plan 60–90 minuten zodat je de vaste collectie én tijdelijke zalen rustig kunt bekijken.',
    bestMoment: 'vroeg op de dag; dan is het vaak rustiger bij populaire werken',
  },
  'modern-art': {
    why: 'je hedendaagse kunst, installaties en vernieuwende vormen wilt ervaren',
    tips: 'Neem de tijd per zaal: moderne kunst wint vaak met een rustige kijkronde.',
    bestMoment: 'later in de middag op weekdagen, wanneer piekdrukte vaak afneemt',
  },
  science: {
    why: 'je interactieve en educatieve opstellingen zoekt',
    tips: 'Reserveer extra tijd voor interactieve onderdelen, die duren vaak langer dan verwacht.',
    bestMoment: 'net na opening om wachtrijen bij populaire opstellingen te vermijden',
  },
  photography: {
    why: 'je fotografie en visuele verhalen in detail wilt bekijken',
    tips: 'Let op het licht en de ruimte-indeling: die zijn vaak onderdeel van de presentatie.',
    bestMoment: 'op rustige weekochtenden voor meer tijd bij kleinere zalen',
  },
  architecture: {
    why: 'je naast de collectie ook het gebouw en de stadsontwikkeling interessant vindt',
    tips: 'Kijk niet alleen naar objecten, maar ook naar maquettes en bouwtekeningen.',
    bestMoment: 'doordeweeks buiten piekuren, zodat je details beter kunt bekijken',
  },
  maritime: {
    why: 'je maritieme geschiedenis en verhalen over handel en scheepvaart wilt ontdekken',
    tips: 'Combineer binnenzalen met eventuele buitenonderdelen als het weer goed is.',
    bestMoment: 'een droge dag met rustig weer, vooral bij locaties met buitenobjecten',
  },
  culture: {
    why: 'je verschillende culturele perspectieven en verhalen wilt verkennen',
    tips: 'Lees zaalteksten actief: ze geven vaak belangrijke context bij de objecten.',
    bestMoment: 'doordeweeks, zodat je rustiger door tekst- en verhaallijnen kunt gaan',
  },
  religion: {
    why: 'je religieuze geschiedenis, rituelen en erfgoed beter wilt begrijpen',
    tips: 'Kies een rustig moment, zodat je de historische context echt kunt opnemen.',
    bestMoment: 'eerste deel van de dag voor een stillere sfeer in de zalen',
  },
  film: {
    why: 'je filmcultuur, cinema-geschiedenis en visueel experiment wilt beleven',
    tips: 'Controleer vooraf het programma als je museumbezoek wilt combineren met een filmvoorstelling.',
    bestMoment: 'late middag of begin avond als je ook een screening wilt meepakken',
  },
};

const MUSEUM_DETAIL_ENHANCEMENTS = {
  'rijksmuseum-amsterdam': {
    nl: {
      positioning:
        'Het Rijksmuseum is het nationale kunstmuseum van Nederland, met iconische werken uit de Gouden Eeuw en een brede collectie van middeleeuwen tot nu.',
      why: [
        'Sterke keuze voor liefhebbers van klassieke kunst en Nederlandse geschiedenis.',
        'Je ziet wereldberoemde topstukken én toegepaste kunst in één bezoek.',
        'Ideaal als je een compleet museum zoekt met veel variatie per zaal.',
      ],
      tips: [
        'Reserveer je ticket en tijdslot vooraf, vooral in weekenden en vakanties.',
        'Kom vroeg op de dag voor een rustiger rondje langs de populairste zalen.',
      ],
    },
    en: {
      positioning:
        'The Rijksmuseum is the Netherlands’ national art museum, known for Dutch Golden Age masterpieces and a broad collection from medieval to modern periods.',
      why: [
        'A strong pick for visitors interested in classic art and Dutch history.',
        'You can combine famous highlights with decorative arts in one visit.',
        'Great if you want a large museum with varied galleries.',
      ],
      tips: [
        'Book your ticket and timeslot in advance, especially on weekends.',
        'Arrive early to experience the busiest rooms more comfortably.',
      ],
    },
  },
  'van-gogh-museum-amsterdam': {
    nl: {
      positioning:
        'Het Van Gogh Museum biedt de grootste collectie werken van Vincent van Gogh, aangevuld met brieven en kunst van tijdgenoten die zijn ontwikkeling tonen.',
      why: [
        'Perfect voor bezoekers die het verhaal achter Van Goghs werk willen begrijpen.',
        'De opbouw door de jaren maakt stijlveranderingen direct zichtbaar.',
        'Interessant voor zowel kunstliefhebbers als eerste museumbezoekers.',
      ],
      tips: [
        'Tickets zijn vaak snel uitverkocht; boek ruim vooraf online.',
        'Kies een tijdslot vroeg of later op de dag om piekdrukte te vermijden.',
      ],
    },
    en: {
      positioning:
        'The Van Gogh Museum presents the world’s largest Van Gogh collection, with letters and works by contemporaries that add context to his artistic development.',
      why: [
        'Ideal if you want to understand the story behind Van Gogh’s work.',
        'The chronological layout makes style changes easy to follow.',
        'Works well for both art enthusiasts and first-time museum visitors.',
      ],
      tips: [
        'Tickets often sell out quickly, so book online well in advance.',
        'Choose an early or late timeslot to avoid peak crowding.',
      ],
    },
  },
  'anne-frank-huis-amsterdam': {
    nl: {
      positioning:
        'Het Anne Frank Huis is een indrukwekkende herinneringsplek over de Tweede Wereldoorlog, met het Achterhuis als centraal onderdeel van het bezoek.',
      why: [
        'Bijzonder waardevol voor bezoekers met interesse in geschiedenis en mensenrechten.',
        'Het museum combineert persoonlijke verhalen met historische context.',
        'Een sterk bezoek voor wie Amsterdam ook via zijn oorlogsverleden wil begrijpen.',
      ],
      tips: [
        'Tickets worden alleen online verkocht en raken vaak vroeg uitverkocht.',
        'Plan extra tijd rondom je tijdslot; de omgeving is vaak druk.',
      ],
    },
    en: {
      positioning:
        'The Anne Frank House is a powerful memorial museum about World War II, centered around the Secret Annex experience.',
      why: [
        'Especially meaningful for visitors interested in history and human rights.',
        'It combines personal stories with broader historical context.',
        'A strong choice if you want to understand Amsterdam through its wartime past.',
      ],
      tips: [
        'Tickets are sold online only and often sell out early.',
        'Allow extra time around your entry slot because the area is usually busy.',
      ],
    },
  },
  'stedelijk-museum-amsterdam': {
    nl: {
      positioning:
        'Het Stedelijk Museum Amsterdam is dé plek voor moderne en hedendaagse kunst en design, met een sterke internationale programmering.',
      why: [
        'Aanrader voor liefhebbers van moderne kunst, design en visuele cultuur.',
        'De combinatie van collectie en tijdelijke exposities zorgt voor afwisseling.',
        'Geschikt als je vernieuwende kunst naast bekende namen wilt zien.',
      ],
      tips: [
        'Bekijk vooraf welke tijdelijke tentoonstellingen er lopen voor je route.',
        'Plan doordeweeks een bezoek voor meer rust in populaire zalen.',
      ],
    },
    en: {
      positioning:
        'The Stedelijk Museum Amsterdam focuses on modern and contemporary art and design, with a strong international program.',
      why: [
        'Recommended for visitors into modern art, design, and visual culture.',
        'Its mix of collection galleries and temporary shows adds variety.',
        'Great if you want experimental work alongside well-known names.',
      ],
      tips: [
        'Check current temporary exhibitions in advance to plan your route.',
        'Visit on weekdays for a calmer experience in busy galleries.',
      ],
    },
  },
  'moco-museum-amsterdam': {
    nl: {
      positioning:
        'Moco Museum richt zich op moderne, hedendaagse en street art, met toegankelijke tentoonstellingen van bekende namen en nieuwe makers.',
      why: [
        'Goede keuze voor bezoekers die moderne kunst op een laagdrempelige manier willen ontdekken.',
        'Populaire werken en fotogenieke installaties maken het bezoek dynamisch.',
        'Past goed bij een korter museumbezoek in het Museumkwartier.',
      ],
      tips: [
        'Koop tickets vooraf voor je gewenste tijdslot, zeker op drukke dagen.',
        'Ga vroeg of aan het einde van de middag voor minder wachttijd bij highlights.',
      ],
    },
    en: {
      positioning:
        'Moco Museum focuses on modern, contemporary, and street art with accessible exhibitions featuring both famous names and emerging artists.',
      why: [
        'A good pick for visitors who want an approachable modern art experience.',
        'Popular works and photogenic installations keep the visit dynamic.',
        'Fits well into a shorter museum visit in the Museum Quarter.',
      ],
      tips: [
        'Book your preferred timeslot in advance, especially on busy days.',
        'Go early or later in the afternoon for shorter waits at highlights.',
      ],
    },
  },
};

function buildSeoMetaDescription(name, summary) {
  const safeSummary = typeof summary === 'string' ? summary.trim() : '';
  if (!safeSummary) {
    return `${name} in Amsterdam bezoeken? Bekijk openingstijden, tickets, tentoonstellingen en praktische bezoektips op MuseumBuddy.`;
  }
  const compactSummary = safeSummary.replace(/\s+/g, ' ');
  const trimmedSummary =
    compactSummary.length > 140 ? `${compactSummary.slice(0, 137).trimEnd()}…` : compactSummary;
  return `${name} in Amsterdam: ${trimmedSummary} Inclusief tips, beste bezoekmoment en tentoonstellingen.`;
}

function getRelatedMuseums(slug, allMuseums) {
  const categories = getMuseumCategories(slug);
  if (!categories.length || !Array.isArray(allMuseums)) return [];

  return allMuseums
    .filter((museum) => museum?.slug && museum.slug !== slug)
    .map((museum) => {
      const relatedCategories = getMuseumCategories(museum.slug);
      const overlap = relatedCategories.filter((category) => categories.includes(category));
      return { museum, overlapCount: overlap.length };
    })
    .filter((entry) => entry.overlapCount > 0)
    .sort((a, b) => b.overlapCount - a.overlapCount || a.museum.name.localeCompare(b.museum.name))
    .slice(0, 3)
    .map((entry) => entry.museum);
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

const DEFAULT_TAB = 'exhibitions';
const SITE_URL = getSiteUrl();
const TAB_IDS = ['exhibitions', 'map'];
const TAB_HASHES = {
  exhibitions: 'tentoonstellingen',
  map: 'kaart',
};
const TAB_LABEL_KEYS = {
  exhibitions: 'tabExhibitions',
  map: 'tabMap',
};
const TAB_TITLE_KEYS = {
  exhibitions: 'tabTitleExhibitions',
  map: 'tabTitleMap',
};
const HASH_TO_TAB = Object.entries(TAB_HASHES).reduce(
  (acc, [id, hash]) => {
    acc[hash] = id;
    return acc;
  },
  { overzicht: 'exhibitions', bezoekersinfo: 'exhibitions' }
);

const DEFAULT_LANDING_MUSEUM_SLUG = 'van-gogh-museum-amsterdam';
const CONFIGURED_LANDING_SLUG =
  typeof process.env.NEXT_PUBLIC_LANDING_MUSEUM_SLUG === 'string'
    ? process.env.NEXT_PUBLIC_LANDING_MUSEUM_SLUG.trim().toLowerCase()
    : '';
const LANDING_MUSEUM_SLUG = CONFIGURED_LANDING_SLUG || DEFAULT_LANDING_MUSEUM_SLUG;
const KID_FRIENDLY_SLUG_SET = new Set(kidFriendlyMuseums.map((slug) => slug.toLowerCase()));

export default function MuseumDetailPage({ museum, expositions, error }) {
  const { lang, t } = useLanguage();
  const { favorites, toggleFavorite } = useFavorites();

  const resolvedMuseum = useMemo(() => (museum ? { ...museum } : null), [museum]);
  const allMuseums = useMemo(() => {
    const staticMuseums = getStaticMuseums().map((entry) => normaliseMuseumRow(entry)).filter(Boolean);
    const bySlug = new Map(staticMuseums.map((entry) => [entry.slug, entry]));
    if (resolvedMuseum?.slug && !bySlug.has(resolvedMuseum.slug)) {
      bySlug.set(resolvedMuseum.slug, resolvedMuseum);
    }
    return Array.from(bySlug.values());
  }, [resolvedMuseum]);
  const isKidFriendlyMuseum = useMemo(
    () => (resolvedMuseum ? resolveKidFriendly(resolvedMuseum, KID_FRIENDLY_SLUG_SET) : false),
    [resolvedMuseum]
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

  const slug = resolvedMuseum.slug;
  const isLandingMuseum = typeof slug === 'string' && slug.toLowerCase() === LANDING_MUSEUM_SLUG;
  const displayName = resolvedMuseum.name;
  const rawImage =
    museumImages[slug] ||
    resolvedMuseum.raw?.afbeelding_url ||
    resolvedMuseum.raw?.image_url ||
    null;
  const heroImage = useMemo(() => normalizeImageSource(rawImage), [rawImage]);
  const heroImageUrl = useMemo(() => resolveImageUrl(rawImage), [rawImage]);
  const heroBlurDataURL = useMemo(() => {
    if (heroImage && typeof heroImage === 'object' && 'blurDataURL' in heroImage && heroImage.blurDataURL) {
      return heroImage.blurDataURL;
    }
    return createBlurDataUrl('#1f2937');
  }, [heroImage]);
  const imageCredit = museumImageCredits[slug];
  const isPublicDomainImage = Boolean(imageCredit?.isPublicDomain);
  const formattedCredit = useMemo(
    () => (isPublicDomainImage ? null : formatImageCredit(imageCredit, t)),
    [imageCredit, isPublicDomainImage, t]
  );
  const creditSegments = formattedCredit?.segments || [];
  const hasCreditSegments = creditSegments.length > 0;
  const creditFullText = creditSegments.map((segment) => segment.label).join(' • ');
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
  const ticketHoverMessage = showAffiliateNote ? t('ticketsAffiliateDisclosure') : undefined;
  const ticketDetailsLine = [t('ticketsAffiliateDisclosure'), t('ticketsAffiliatePricesMayVary')]
    .filter(Boolean)
    .join(' ');
  const ticketNoteDefinitions = showAffiliateNote
    ? [
        { key: 'intro', message: t('ticketsAffiliateIntro'), disclosure: false },
        { key: 'details', message: ticketDetailsLine, disclosure: true },
      ]
    : [];

  const createTicketNote = (prefix) => {
    if (!ticketNoteDefinitions.length) {
      return null;
    }

    return ticketNoteDefinitions.map((definition, index) => (
      <span
        key={`${prefix}-${definition.key ?? index}`}
        className={`ticket-button__note-line${definition.disclosure ? ' ticket-button__note-disclosure' : ''}`}
      >
        {definition.message}
      </span>
    ));
  };

  const ticketContext = createTicketNote('ticket-context');
  const heroTicketNoteId = useId();
  const ticketRel = showAffiliateNote ? 'sponsored noopener noreferrer' : 'noopener noreferrer';
  const ticketAriaLabel = showAffiliateNote
    ? `${t('buyTickets')} — ${t('ticketsAffiliateDisclosure')}`
    : t('buyTickets');
  const locationLines = useMemo(() => getLocationLines(resolvedMuseum), [resolvedMuseum]);
  const locationLabel = [resolvedMuseum.city, resolvedMuseum.province].filter(Boolean).join(', ');
  const hasWebsite = Boolean(resolvedMuseum.websiteUrl);
  const hasTicketLink = Boolean(ticketUrl);
  const expositionCount = Array.isArray(expositions) ? expositions.length : 0;
  const museumCategories = useMemo(() => getMuseumCategories(slug), [slug]);
  const primaryCategory = museumCategories[0];
  const categoryContent = primaryCategory ? CATEGORY_CONTENT[primaryCategory] : null;
  const detailEnhancement = MUSEUM_DETAIL_ENHANCEMENTS[slug]?.[lang] || MUSEUM_DETAIL_ENHANCEMENTS[slug]?.nl || null;
  const introText = summary
    ? `${summary} Op deze pagina vind je de belangrijkste bezoekersinformatie voor ${displayName} in Amsterdam.`
    : `${displayName} is een museum in Amsterdam. Hier vind je praktische informatie voor je bezoek, inclusief tentoonstellingen en routehulp.`;
  const whyVisitText = detailEnhancement
    ? null
    : categoryContent
    ? `${displayName} is een goede keuze als ${categoryContent.why}.`
    : `${displayName} is interessant als je een museum in Amsterdam zoekt met een duidelijke focus en actuele tentoonstellingen.`;
  const visitTips = useMemo(() => {
    if (detailEnhancement?.tips?.length) {
      return detailEnhancement.tips.slice(0, 2);
    }
    const tips = [];
    if (categoryContent?.tips) {
      tips.push(categoryContent.tips);
    }
    if (openingHours) {
      tips.push(`Controleer de actuele openingstijden (${openingHours}) en eventuele afwijkingen op feestdagen.`);
    }
    if (hasTicketLink) {
      tips.push('Boek je ticket vooraf, vooral in weekenden en vakanties.');
    }
    if (expositionCount > 0) {
      tips.push(`Bekijk vooraf de ${expositionCount} actuele tentoonstelling(en) om je route in het museum te plannen.`);
    }
    return tips.slice(0, 4);
  }, [categoryContent?.tips, detailEnhancement?.tips, expositionCount, hasTicketLink, openingHours]);
  const bestMomentText = categoryContent?.bestMoment
    ? `Voor ${displayName} is ${categoryContent.bestMoment}.`
    : `Doordeweeks buiten de middagpiek is meestal een prettig moment om ${displayName} te bezoeken.`;
  const relatedMuseums = useMemo(() => getRelatedMuseums(slug, allMuseums), [allMuseums, slug]);
  const showFreeGuideLink = Boolean(resolvedMuseum.free);

  const favoritePayload = useMemo(
    () => ({
      id: resolvedMuseum.id,
      slug,
      title: displayName,
      city: resolvedMuseum.city,
      province: resolvedMuseum.province,
      free: resolvedMuseum.free,
      image: heroImageUrl,
      imageCredit,
      ticketUrl,
      ticketAffiliateUrl: affiliateTicketUrl,
      type: 'museum',
    }),
    [
      resolvedMuseum.id,
      slug,
      displayName,
      resolvedMuseum.city,
      resolvedMuseum.province,
      resolvedMuseum.free,
      heroImageUrl,
      imageCredit,
      ticketUrl,
      affiliateTicketUrl,
    ]
  );

  const analyticsData = useMemo(
    () => ({
      type: 'museum',
      id: resolvedMuseum.id ?? null,
      slug,
      title: displayName,
    }),
    [displayName, resolvedMuseum.id, slug]
  );

  const triggerHapticFeedback = useCallback(
    async (intensity = 'medium') => {
      if (typeof window === 'undefined') return;
      try {
        if (Capacitor?.isNativePlatform?.()) {
          const haptics = Capacitor.Plugins?.Haptics;
          if (haptics?.impact) {
            const style =
              intensity === 'heavy'
                ? 'HEAVY'
                : intensity === 'light'
                ? 'LIGHT'
                : 'MEDIUM';
            await haptics.impact({ style });
            return;
          }
        }
        if (window.navigator?.vibrate) {
          window.navigator.vibrate(intensity === 'light' ? 18 : 32);
        }
      } catch (err) {
        if (window.navigator?.vibrate) {
          window.navigator.vibrate(20);
        }
      }
    },
    []
  );

  const openExternalLink = useCallback(
    async (url, event, { preferApp = false } = {}) => {
      if (!url || typeof window === 'undefined') return false;
      try {
        if (Capacitor?.isNativePlatform?.()) {
          event?.preventDefault();
          event?.stopPropagation();
          const plugins = Capacitor.Plugins || {};
          if (preferApp && plugins.App?.openUrl) {
            try {
              await plugins.App.openUrl({ url });
              return true;
            } catch (appError) {
              // fall through to browser fallback
            }
          }
          if (plugins.Browser?.open) {
            await plugins.Browser.open({ url, presentationStyle: 'fullscreen' });
            return true;
          }
        }
      } catch (err) {
        // ignore and fall back to default navigation
      }

      if (!event) {
        try {
          window.open(url, '_blank', 'noopener');
        } catch (err) {
          window.location.href = url;
        }
        return true;
      }

      return false;
    },
    []
  );

  const isFavorite = favorites.some((fav) => fav.id === resolvedMuseum.id && fav.type === 'museum');

  const handleFavorite = useCallback(() => {
    if (!isFavorite) {
      trackFavoriteAdd(analyticsData);
    }
    toggleFavorite(favoritePayload);
    triggerHapticFeedback(isFavorite ? 'light' : 'medium');
  }, [analyticsData, favoritePayload, isFavorite, toggleFavorite, triggerHapticFeedback]);

  const handleShare = useCallback(async () => {
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

  const handleTicketLinkClick = useCallback(
    (event) => {
      if (!ticketUrl) return;
      trackTicketsClick({
        ...analyticsData,
        url: ticketUrl,
        affiliate: affiliateTicketUrl ? 'affiliate' : 'direct',
        location: 'museum_detail_hero',
      });
      openExternalLink(ticketUrl, event);
    },
    [affiliateTicketUrl, analyticsData, openExternalLink, ticketUrl]
  );

  const handleWebsiteLinkClick = useCallback(
    (event) => {
      if (!resolvedMuseum.websiteUrl) return;
      openExternalLink(resolvedMuseum.websiteUrl, event);
    },
    [openExternalLink, resolvedMuseum.websiteUrl]
  );

  const seoDescription = buildSeoMetaDescription(displayName, summary || t('museumDescription', { name: displayName }));
  const seoTitle = `${displayName} in Amsterdam | MuseumBuddy`;
  const canonical = `/museum/${slug}`;
  const museumStructuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Museum',
      name: displayName,
      description: seoDescription,
      url: `${SITE_URL}${canonical}`,
      image: heroImageUrl || undefined,
      sameAs: resolvedMuseum.websiteUrl || undefined,
      telephone: resolvedMuseum.phone || undefined,
      email: resolvedMuseum.email || undefined,
      isAccessibleForFree: resolvedMuseum.free || undefined,
      address: locationLines.length
        ? {
            '@type': 'PostalAddress',
            streetAddress: resolvedMuseum.address || undefined,
            postalCode: resolvedMuseum.postalCode || undefined,
            addressLocality: resolvedMuseum.city || 'Amsterdam',
            addressRegion: resolvedMuseum.province || undefined,
            addressCountry: 'NL',
          }
        : undefined,
    }),
    [
      canonical,
      displayName,
      heroImageUrl,
      locationLines.length,
      resolvedMuseum.address,
      resolvedMuseum.city,
      resolvedMuseum.email,
      resolvedMuseum.free,
      resolvedMuseum.phone,
      resolvedMuseum.postalCode,
      resolvedMuseum.province,
      resolvedMuseum.websiteUrl,
      seoDescription,
      SITE_URL,
    ]
  );

  const expositionItems = useMemo(
    () =>
      Array.isArray(expositions)
        ? expositions.map((row) => normaliseExpositionRow(row, slug)).filter(Boolean)
        : [],
    [expositions, slug]
  );
  const filteredExpositionItems = expositionItems;
  const [activeExpositionSlide, setActiveExpositionSlide] = useState(0);

  useEffect(() => {
    setActiveExpositionSlide((prev) => {
      if (!filteredExpositionItems.length) return 0;
      return prev >= filteredExpositionItems.length
        ? filteredExpositionItems.length - 1
        : prev;
    });
  }, [filteredExpositionItems.length]);

  const expositionCarouselLabels = useMemo(
    () => ({
      previous: t('carouselPrevious'),
      next: t('carouselNext'),
      pagination: t('carouselPagination'),
      goToSlide: (target) => t('carouselGoTo', { target }),
      slide: (current, total) => t('carouselSlide', { current, total }),
      instructions: t('carouselInstructions'),
      pause: t('carouselPause'),
      play: t('carouselPlay'),
      autoplayPaused: t('carouselAutoplayPaused'),
      autoplayPlaying: t('carouselAutoplayPlaying'),
    }),
    [t]
  );

  const renderHeroHeading = useCallback(() => (
    <>
      {locationLabel && <p className="detail-sub museum-hero-location">{locationLabel}</p>}
      <h1 className="detail-title museum-hero-title">{displayName}</h1>
      {summary && <p className="detail-sub museum-hero-tagline">{summary}</p>}
    </>
  ), [displayName, locationLabel, summary]);

  const heroImageAlt = t('museumHeroImageAlt', { name: displayName });

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

  const hasVisitorDetails =
    Boolean(openingHours) ||
    locationLines.length > 0 ||
    resolvedMuseum.phone ||
    resolvedMuseum.email ||
    socialLinks.length > 0;
  const hasVisitorActions = hasTicketLink || hasWebsite;
  const showImageCredit = !isPublicDomainImage && hasCreditSegments;

  const renderVisitorInformationCard = () => {
    const cardClassName = ['museum-sidebar-card', 'support-card', 'museum-visitor-card', 'museum-visitor-card--hero']
      .filter(Boolean)
      .join(' ');

    return (
      <div className={cardClassName}>
        <h2 className="museum-sidebar-title">{t('visitorInformation')}</h2>

        <div className="museum-visitor-actions">
          {hasVisitorActions ? (
            <div className="museum-primary-action-group">
              {hasTicketLink ? (
                <div className="museum-primary-action-stack">
                  <a
                    href={ticketUrl}
                    target="_blank"
                    rel={ticketRel}
                    className="museum-primary-action primary"
                    aria-describedby={ticketContext ? heroTicketNoteId : undefined}
                    onClick={handleTicketLinkClick}
                    title={ticketHoverMessage}
                    aria-label={ticketAriaLabel}
                    data-affiliate={showAffiliateNote ? 'true' : undefined}
                  >
                    <span
                      className={
                        showAffiliateNote
                          ? 'ticket-button__label ticket-button__label--stacked'
                          : 'ticket-button__label'
                      }
                    >
                      <span className="ticket-button__label-text">{t('buyTickets')}</span>
                      {showAffiliateNote ? (
                        <span className="ticket-button__badge">
                          {t('ticketsPartnerBadge')}
                          <span className="sr-only"> — {t('ticketsAffiliateIntro')}</span>
                        </span>
                      ) : null}
                    </span>
                  </a>
                  {ticketContext ? (
                    <TicketButtonNote
                      affiliate={showAffiliateNote}
                      showIcon={false}
                      id={heroTicketNoteId}
                      className="museum-primary-action__note museum-visitor-action__note"
                    >
                      {createTicketNote('hero-ticket-note')}
                    </TicketButtonNote>
                  ) : null}
                </div>
              ) : (
                <div className="museum-primary-action-stack">
                  <button type="button" className="museum-primary-action primary" disabled aria-disabled="true">
                    <span className="ticket-button__label">
                      <span className="ticket-button__label-text">{t('buyTickets')}</span>
                    </span>
                  </button>
                </div>
              )}

              {hasWebsite && (
                <a
                  href={resolvedMuseum.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="museum-primary-action secondary"
                  onClick={handleWebsiteLinkClick}
                >
                  <span>{t('website')}</span>
                </a>
              )}
            </div>
          ) : null}

          <div className="museum-primary-action-utility">
            <ShareButton onShare={handleShare} label={t('share')} />
            <FavoriteButton active={isFavorite} onToggle={handleFavorite} label={t('save')} />
          </div>
        </div>

        {hasVisitorDetails ? (
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
        ) : null}

        {showImageCredit ? (
          <p className="museum-visitor-credit image-credit" title={creditFullText || undefined}>
            {creditSegments.map((segment, index) => (
              <Fragment key={`hero-credit-${segment.key}-${index}`}>
                {index > 0 && (
                  <span aria-hidden="true" className="image-credit-divider">
                    •
                  </span>
                )}
                {segment.url ? (
                  <a className="image-credit-link" href={segment.url} target="_blank" rel="noreferrer">
                    {segment.label}
                  </a>
                ) : (
                  <span className="image-credit-part">{segment.label}</span>
                )}
              </Fragment>
            ))}
          </p>
        ) : null}
      </div>
    );
  };

  const visitorInformationCard = renderVisitorInformationCard();

  const tabDefinitions = useMemo(
    () =>
      TAB_IDS.map((id) => ({
        id,
        hash: TAB_HASHES[id],
        label: t(TAB_LABEL_KEYS[id]),
        title: t(TAB_TITLE_KEYS[id]),
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

  const mapQueryParts = [displayName, ...locationLines];
  if (!locationLines.length) {
    mapQueryParts.push(resolvedMuseum.address, resolvedMuseum.city, resolvedMuseum.province);
  }
  const mapQuery = mapQueryParts.filter(Boolean).join(', ');
  const mapEmbedUrl = mapQuery ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed` : null;
  const mapDirectionsUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : null;

  const handleMapDirectionsClick = useCallback(
    (event) => {
      if (!mapDirectionsUrl) return;
      openExternalLink(mapDirectionsUrl, event, { preferApp: true });
    },
    [mapDirectionsUrl, openExternalLink]
  );

  return (
    <section className={`museum-detail${heroImage ? ' has-hero' : ''}`}>
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={heroImageUrl}
        canonical={canonical}
        structuredData={museumStructuredData}
      />
      <div className="museum-detail-container museum-hero-heading-container">
        <div className="museum-hero-heading">
          <nav className="museum-breadcrumbs" aria-label={t('breadcrumbsLabel')}>
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
              <span>{t('breadcrumbMuseums')}</span>
            </Link>
          </nav>

          <div className={`museum-hero-layout${heroImage ? '' : ' museum-hero-layout--no-image'}`}>
            <div className="museum-hero-media">
              {heroImage ? (
                <div className="museum-hero-media-inner">
                  <Image
                    src={heroImage}
                    alt={heroImageAlt}
                    fill
                    className="museum-hero-image"
                    sizes="(max-width: 640px) 100vw, (max-width: 1200px) 90vw, 1200px"
                    priority={isLandingMuseum}
                    loading={isLandingMuseum ? 'eager' : 'lazy'}
                    fetchPriority={isLandingMuseum ? 'high' : 'auto'}
                    placeholder="blur"
                    blurDataURL={heroBlurDataURL}
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="museum-hero-text museum-hero-overlay">{renderHeroHeading()}</div>
                </div>
              ) : (
                <div className="museum-hero-text museum-hero-text--standalone">{renderHeroHeading()}</div>
              )}
            </div>

            {visitorInformationCard ? (
              <div className="museum-hero-sidebar">{visitorInformationCard}</div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="museum-detail-container">
        <div className="museum-detail-grid">
          <div className="museum-detail-main">
            <section className="page-intro" aria-label="Museum SEO content">
              <p className="page-subtitle">{introText}</p>

              {detailEnhancement?.positioning ? <p>{detailEnhancement.positioning}</p> : null}

              <h2>{lang === 'nl' ? 'Waarom dit museum bezoeken?' : 'Why visit this museum?'}</h2>
              {detailEnhancement?.why?.length ? (
                <ul>
                  {detailEnhancement.why.slice(0, 3).map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              ) : (
                <p>{whyVisitText}</p>
              )}

              {visitTips.length > 0 ? (
                <>
                  <h2>{lang === 'nl' ? 'Tips voor je bezoek' : 'Tips for your visit'}</h2>
                  <ul>
                    {visitTips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </>
              ) : null}

              <h2>{lang === 'nl' ? 'Beste moment om te gaan' : 'Best time to visit'}</h2>
              <p>{bestMomentText}</p>

              <p className="page-subtitle">
                {t('museumDetailSeoBody')}{' '}
                <Link href="/tentoonstellingen">
                  {lang === 'nl' ? 'Tentoonstellingen in Amsterdam' : 'Exhibitions in Amsterdam'}
                </Link>{' '}
                ·{' '}
                <Link href="/">
                  {lang === 'nl' ? 'Musea in Amsterdam' : 'Museums in Amsterdam'}
                </Link>
                {isKidFriendlyMuseum ? (
                  <>
                    {' '}
                    ·{' '}
                    <Link href="/kindvriendelijke-musea-amsterdam">
                      {lang === 'nl' ? 'Kindvriendelijke musea' : 'Kid-friendly museums'}
                    </Link>
                  </>
                ) : null}
                {showFreeGuideLink ? (
                  <>
                    {' '}
                    ·{' '}
                    <Link href="/gratis-musea-amsterdam">
                      {lang === 'nl' ? 'Gratis musea' : 'Free museums'}
                    </Link>
                  </>
                ) : null}
              </p>

              {relatedMuseums.length > 0 ? (
                <p className="page-subtitle">
                  {lang === 'nl' ? 'Gerelateerde musea:' : 'Related museums:'}{' '}
                  {relatedMuseums.map((item, index) => (
                    <Fragment key={item.slug}>
                      {index > 0 ? ', ' : ''}
                      <Link href={`/museum/${item.slug}`}>{item.name}</Link>
                    </Fragment>
                  ))}
                </p>
              ) : null}

              <h2>{lang === 'nl' ? 'Andere musea ontdekken?' : 'Discover other museums?'}</h2>
              <p className="page-subtitle">
                <Link href="/beste-musea-amsterdam">
                  {lang === 'nl'
                    ? 'Bekijk onze selectie van de beste musea in Amsterdam'
                    : 'Explore our selection of the best museums in Amsterdam'}
                </Link>
                {relatedMuseums.length > 0 ? (
                  <>
                    {' '}
                    ·{' '}
                    {relatedMuseums.slice(0, 2).map((item, index) => (
                      <Fragment key={`cross-link-${item.slug}`}>
                        {index > 0 ? ', ' : ''}
                        <Link href={`/museum/${item.slug}`}>{item.name}</Link>
                      </Fragment>
                    ))}
                  </>
                ) : null}
                .
              </p>
            </section>
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
                    aria-label={tab.title}
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
                  <h2 className="museum-expositions-heading">{t('exhibitionsTitle')}</h2>
                  {filteredExpositionItems.length > 0 ? (
                    <ExpositionCarousel
                      items={filteredExpositionItems}
                      ariaLabel={t('exhibitionsTitle')}
                      activeSlide={activeExpositionSlide}
                      onActiveSlideChange={setActiveExpositionSlide}
                      getItemKey={(exposition) => exposition.id}
                      labels={expositionCarouselLabels}
                      renderItem={(exposition) => (
                        <ExpositionCard
                          exposition={exposition}
                          affiliateUrl={affiliateTicketUrl}
                          ticketUrl={directTicketUrl}
                          museumSlug={slug}
                          tags={exposition.tags}
                        />
                      )}
                    />
                  ) : (
                    <p className="museum-expositions-empty">{t('noExhibitions')}</p>
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
                      <a
                        className="museum-map-link"
                        href={mapDirectionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={handleMapDirectionsClick}
                      >
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

  const fallbackStaticRow = getStaticMuseumBySlug(slug);
  const staticExpoRows = getStaticExpositionRowsForSlug(slug);

  if (!supabaseClient) {
    if (!fallbackStaticRow) {
      return { notFound: true };
    }
    const museum = normaliseMuseumRow({ ...fallbackStaticRow });
    return {
      props: {
        error: null,
        museum,
        expositions: staticExpoRows,
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
      if (fallbackStaticRow) {
        const museum = normaliseMuseumRow({ ...fallbackStaticRow });
        return {
          props: {
            error: null,
            museum,
            expositions: staticExpoRows,
          },
        };
      }
      if (museumError.code === 'PGRST116') {
        return { notFound: true };
      }
      return {
        props: {
          error: 'museumQueryFailed',
          museum: null,
          expositions: staticExpoRows,
        },
      };
    }

    if (!museumRow) {
      if (fallbackStaticRow) {
        const museum = normaliseMuseumRow({ ...fallbackStaticRow });
        return {
          props: {
            error: null,
            museum,
            expositions: staticExpoRows,
          },
        };
      }
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

    if (staticExpoRows.length > 0) {
      const seen = new Set(
        expoRows.map((row) => {
          const title = row?.titel || '';
          const start = row?.start_datum || '';
          const end = row?.eind_datum || '';
          return `${title.toLowerCase()}|${start}|${end}`;
        })
      );

      staticExpoRows.forEach((row) => {
        const key = `${(row?.titel || '').toLowerCase()}|${row?.start_datum || ''}|${row?.eind_datum || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          expoRows.push(row);
        }
      });
    }

    return {
      props: {
        museum,
        expositions: expoRows,
        error: null,
      },
    };
  } catch (err) {
    if (fallbackStaticRow) {
      const museum = normaliseMuseumRow({ ...fallbackStaticRow });
      return {
        props: {
          error: null,
          museum,
          expositions: staticExpoRows,
        },
      };
    }
    return {
      props: {
        error: 'unknown',
        museum: null,
        expositions: staticExpoRows,
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
    [
      museumImages,
      museumSummaries,
      museumOpeningHours,
      museumTicketUrls,
      getStaticMuseums(),
    ].forEach((collection) => {
      if (!collection) return;
      if (Array.isArray(collection)) {
        collection.forEach((item) => {
          if (item?.slug) {
            slugs.add(item.slug);
          }
        });
        return;
      }
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
