export const FAMILY_GUIDE_PATH = '/museumgids/kindvriendelijke-musea-amsterdam';
export const LEGACY_FAMILY_GUIDE_PATHS = Object.freeze([
  '/kindvriendelijke-musea-amsterdam',
  '/kindvriendelijk',
  '/ontdek/met-kinderen',
]);
export const FAMILY_GUIDE_CANONICAL_URL = 'https://www.museumbuddy.nl/museumgids/kindvriendelijke-musea-amsterdam';
export const FAMILY_GUIDE_LAST_VERIFIED_AT = '2026-07-13';
export const FAMILY_GUIDE_TITLE = 'Kindvriendelijke musea in Amsterdam: de beste per leeftijd | MuseumBuddy';
export const FAMILY_GUIDE_DESCRIPTION = 'Ontdek welke musea in Amsterdam echt leuk zijn met kinderen. Vergelijk leeftijden, interactieve activiteiten, bezoekduur, prijzen en tickets.';
export const FAMILY_AFFILIATE_DISCLOSURE = 'MuseumBuddy kan een commissie ontvangen als je via deze link boekt. Dit kost jou normaal gesproken niets extra.';

export const familyAgeGroups = Object.freeze([
  { key: '0-3', label: '0–3 jaar', description: 'Kies korte bezoeken met ruimte om te pauzeren; controleer altijd kinderwagens en verschoonruimte.' },
  { key: '4-6', label: '4–6 jaar', description: 'Let op tastbare opdrachten, korte verhalen en programma’s voor jonge kinderen.' },
  { key: '7-9', label: '7–9 jaar', description: 'Veel kinderen kunnen dan speurtochten, experimenten en interactieve opdrachten langer volhouden.' },
  { key: '10-12', label: '10–12 jaar', description: 'Geschikt voor verdieping, wetenschap, film, wereldculturen en kunst met een duidelijke opdracht.' },
  { key: 'teens', label: 'tieners', description: 'Kies musea met zelfstandige ontdekking, actuele thema’s of sterke visuele beleving.' },
]);

const nullFacilities = {
  strollerInformation: null,
  babyChangingInformation: null,
  familyFacilities: null,
  childTicketInformation: null,
  freeChildAgeInformation: null,
  reservationRecommendation: null,
  noiseOrSensoryInformation: null,
  temporaryFamilyProgramme: null,
  temporaryProgrammeEndDate: null,
};

export const familyMuseumProfiles = Object.freeze([
  {
    slug: 'nemo-science-museum-amsterdam', familyFriendly: true, familyVerificationStatus: 'verified', familySourceUrl: 'https://www.nemosciencemuseum.nl/en/', familyLastVerifiedAt: FAMILY_GUIDE_LAST_VERIFIED_AT,
    recommendedAgeMin: 4, recommendedAgeMax: 14, recommendedAgeLabel: 'vanaf ca. 4 jaar, sterk voor 7–12 jaar', whyFunForChildren: 'Kinderen kunnen zelf experimenteren met wetenschap, techniek, licht en constructies, waardoor het bezoek draait om doen in plaats van lang stil kijken.', interactiveLevel: 'hoog', handsOnActivities: ['experimenteren', 'demonstraties', 'zelf ontdekken'], familyActivitySummary: 'Vijf verdiepingen met hands-on wetenschap en proefjes.', typicalVisitDurationMin: 120, typicalVisitDurationMax: 180, strollerInformation: null, babyChangingInformation: null, familyFacilities: ['dakplein bij goed weer', 'veel doe-opstellingen'], childTicketInformation: 'Bekijk actuele kinderprijzen bij de ticketaanbieder.', freeChildAgeInformation: null, reservationRecommendation: 'Vooraf reserveren is verstandig in weekenden en vakanties.', noiseOrSensoryInformation: 'Kan druk en prikkelrijk zijn.', temporaryFamilyProgramme: null, temporaryProgrammeEndDate: null,
    label: 'Veel zelf doen', rankReason: 'meest uitgesproken hands-on profiel', neighbourhood: 'Oosterdok', imageAlt: 'NEMO Science Museum met kindvriendelijke science-opstellingen in Amsterdam', ticketPartnerCategory: 'affiliate', ticketPartner: 'Tiqets', ticketUrl: 'https://www.tiqets.com/en/checkout/tickets-for-nemo-science-museum-entry-ticket-p706076/booking_details/?partner=museaumbuddy-179611', cardType: 'main', ageGroups: ['4-6','7-9','10-12','teens'], editorialScore: 6,
  },
  {
    slug: 'wereldmuseum-amsterdam', familyFriendly: true, familyVerificationStatus: 'verified', familySourceUrl: 'https://amsterdam.wereldmuseum.nl/en/wereldmuseum-junior/pedagogic-method-wereldmuseum-junior', familyLastVerifiedAt: FAMILY_GUIDE_LAST_VERIFIED_AT,
    recommendedAgeMin: 6, recommendedAgeMax: 13, recommendedAgeLabel: '6–13 jaar', whyFunForChildren: 'Wereldmuseum Junior is structureel opgezet rond zien, aanraken, ervaren en meedoen, met een duidelijke focus op kinderen van 6 tot 13 jaar.', interactiveLevel: 'hoog', handsOnActivities: ['meedoen in Junior-tentoonstelling', 'verhalen en opdrachten', 'zintuiglijke onderdelen'], familyActivitySummary: 'Kindermuseum binnen Wereldmuseum Amsterdam met actieve tentoonstellingen.', typicalVisitDurationMin: 90, typicalVisitDurationMax: 150, ...nullFacilities,
    childTicketInformation: 'Bekijk actuele kinderprijzen bij de ticketaanbieder.', reservationRecommendation: 'Reserveer vooraf voor Junior-programma’s en populaire dagen.', label: 'Beste voor jonge ontdekkers', rankReason: 'structureel kindermuseum met heldere leeftijdsdoelgroep', neighbourhood: 'Oosterpark', imageAlt: 'Wereldmuseum Amsterdam als gezinsmuseum met Wereldmuseum Junior', ticketPartnerCategory: 'affiliate', ticketPartner: 'Tiqets', ticketUrl: 'https://www.tiqets.com/en/checkout/tickets-for-wereldmuseum-amsterdam-entry-ticket-p973054/booking_details/?partner=museaumbuddy-179611', cardType: 'main', ageGroups: ['7-9','10-12'], editorialScore: 6,
  },
  {
    slug: 'joods-museum-amsterdam', familyFriendly: true, familyVerificationStatus: 'verified', familySourceUrl: 'https://jck.nl/en/for-families-and-children', familyLastVerifiedAt: FAMILY_GUIDE_LAST_VERIFIED_AT,
    recommendedAgeMin: 6, recommendedAgeMax: 12, recommendedAgeLabel: '6–12 jaar', whyFunForChildren: 'Joods Museum junior is ingericht als een huis waar kinderen voorwerpen mogen gebruiken, challah kunnen bakken en hun naam in Hebreeuws kunnen leren schrijven.', interactiveLevel: 'hoog', handsOnActivities: ['Joods Museum junior', 'huisopdrachten', 'muziek en taal'], familyActivitySummary: 'Interactieve juniorafdeling over Joods leven en tradities.', typicalVisitDurationMin: 75, typicalVisitDurationMax: 120, ...nullFacilities,
    childTicketInformation: 'Officiële familiepagina vermeldt kindertarieven voor 6–12 en 13–17 jaar.', freeChildAgeInformation: 'Kinderen onder 6 jaar gratis volgens officiële familiepagina.', reservationRecommendation: 'Vooraf reserveren aanbevolen bij gezinsactiviteiten.', label: 'Beste juniorhuis', rankReason: 'permanente junioromgeving met concrete kinderactiviteiten', neighbourhood: 'Jodenbuurt', imageAlt: 'Joods Museum Amsterdam met interactieve juniorafdeling voor kinderen', ticketPartnerCategory: 'affiliate', ticketPartner: 'Tiqets', ticketUrl: 'https://www.tiqets.com/en/checkout/tickets-for-jewish-museum-p974556/booking_details/?partner=museaumbuddy-179611', cardType: 'main', ageGroups: ['7-9','10-12'], editorialScore: 5,
  },
  {
    slug: 'rijksmuseum-amsterdam', familyFriendly: true, familyVerificationStatus: 'verified', familySourceUrl: 'https://www.rijksmuseum.nl/en/families-and-children', familyLastVerifiedAt: FAMILY_GUIDE_LAST_VERIFIED_AT,
    recommendedAgeMin: 6, recommendedAgeMax: 17, recommendedAgeLabel: 'vanaf ca. 6 jaar; gratis t/m 17 jaar', whyFunForChildren: 'Het Rijksmuseum koppelt topstukken aan familieprogramma’s, een familiespel en praktische gezinsinformatie, waardoor kunst kijken meer richting krijgt.', interactiveLevel: 'middel', handsOnActivities: ['familiespel', 'familierondleiding', 'topstukken zoeken'], familyActivitySummary: 'Groot kunstmuseum met familiespel en programma’s voor kinderen.', typicalVisitDurationMin: 90, typicalVisitDurationMax: 150, ...nullFacilities,
    childTicketInformation: 'Officiële familiepagina vermeldt gratis toegang t/m 17 jaar.', freeChildAgeInformation: 'Gratis voor iedereen tot en met 17 jaar.', reservationRecommendation: 'Reserveer tijdslot vooraf; het museum kan druk zijn.', label: 'Kunst met opdracht', rankReason: 'sterk wanneer gezinnen kunst willen zien met kindvriendelijke routes', neighbourhood: 'Museumplein', imageAlt: 'Rijksmuseum Amsterdam voor gezinnen met kinderen', ticketPartnerCategory: 'affiliate', ticketPartner: 'GetYourGuide', ticketUrl: 'https://www.getyourguide.com/amsterdam-l36/amsterdam-rijksmuseum-entry-ticket-t7135/?partner_id=I8RVSW6&utm_medium=local_partners', cardType: 'main', ageGroups: ['7-9','10-12','teens'], editorialScore: 5,
  },
  {
    slug: 'eye-filmmuseum-amsterdam', familyFriendly: true, familyVerificationStatus: 'verified', familySourceUrl: 'https://www.eyefilm.nl/en/childrens-activities', familyLastVerifiedAt: FAMILY_GUIDE_LAST_VERIFIED_AT,
    recommendedAgeMin: 2, recommendedAgeMax: 16, recommendedAgeLabel: '2–6 jaar voor Cinemini; oudere kinderen per film of tentoonstelling', whyFunForChildren: 'Eye heeft structurele kinderfilms en Cinemini voor peuters en kleuters, met korte films en experimenten met licht en schaduw.', interactiveLevel: 'middel', handsOnActivities: ['Cinemini', 'kinderfilms', 'licht- en schaduwspel'], familyActivitySummary: 'Filmmuseum met kinderprogramma’s en korte gezinsbezoeken.', typicalVisitDurationMin: 60, typicalVisitDurationMax: 120, ...nullFacilities,
    childTicketInformation: 'Bekijk actuele prijs per film, tentoonstelling of activiteit.', reservationRecommendation: 'Reserveer voor films en Cinemini.', label: 'Kort en filmisch', rankReason: 'goed voor korte programma’s en jonge kinderen wanneer agenda past', neighbourhood: 'Amsterdam-Noord', imageAlt: 'Eye Filmmuseum Amsterdam met kinderfilms en familieactiviteiten', ticketPartnerCategory: 'official', ticketPartner: 'Eye', ticketUrl: 'https://www.eyefilm.nl/en/whats-on', cardType: 'main', ageGroups: ['0-3','4-6','7-9','10-12','teens'], editorialScore: 4,
  },
  {
    slug: 'micropia-museum-amsterdam', familyFriendly: true, familyVerificationStatus: 'partially_verified', familySourceUrl: 'https://www.artis.nl/en/artis-micropia', familyLastVerifiedAt: FAMILY_GUIDE_LAST_VERIFIED_AT,
    recommendedAgeMin: 8, recommendedAgeMax: 14, recommendedAgeLabel: 'vanaf ca. 8 jaar', whyFunForChildren: 'Micropia maakt microben zichtbaar met microscopen, interactieve displays en verhalen uit het lab; vooral sterk voor nieuwsgierige oudere kinderen.', interactiveLevel: 'middel', handsOnActivities: ['microscopen', 'labverhalen', 'interactieve displays'], familyActivitySummary: 'Compact museum over de onzichtbare wereld van micro-organismen.', typicalVisitDurationMin: 60, typicalVisitDurationMax: 90, ...nullFacilities,
    childTicketInformation: 'Bekijk actuele kinderprijzen bij de ticketaanbieder.', reservationRecommendation: 'Online tickets zijn praktisch; combineer eventueel met ARTIS.', noiseOrSensoryInformation: 'Donkere ruimtes en microbiologie passen niet bij elk jong kind.', label: 'Nieuwsgierige onderzoekers', rankReason: 'compact en inhoudelijk sterk voor oudere kinderen', neighbourhood: 'Plantage', imageAlt: 'Micropia Amsterdam met microscopen en microben voor kinderen', ticketPartnerCategory: 'affiliate', ticketPartner: 'Tiqets', ticketUrl: 'https://www.tiqets.com/en/checkout/tickets-for-artis-micropia-entry-ticket-p973953/booking_details/?partner=museaumbuddy-179611', cardType: 'main', ageGroups: ['7-9','10-12','teens'], editorialScore: 4,
  },
  {
    slug: 'scheepvaartmuseum-amsterdam', familyFriendly: true, familyVerificationStatus: 'partially_verified', familySourceUrl: 'https://www.hetscheepvaartmuseum.nl/', familyLastVerifiedAt: FAMILY_GUIDE_LAST_VERIFIED_AT,
    recommendedAgeMin: 4, recommendedAgeMax: 12, recommendedAgeLabel: 'vanaf ca. 4 jaar', whyFunForChildren: 'Het maritieme thema werkt goed voor gezinnen door schepen, modellen en verhalen die je relatief concreet kunt maken tijdens een kort of langer bezoek.', interactiveLevel: 'middel', handsOnActivities: ['scheepsverhalen', 'modellen bekijken', 'familieactiviteiten per agenda'], familyActivitySummary: 'Maritiem museum dat vaak goed werkt voor kinderen die van schepen en verhalen houden.', typicalVisitDurationMin: 90, typicalVisitDurationMax: 150, ...nullFacilities,
    childTicketInformation: 'Bekijk actuele kinderprijzen bij de ticketaanbieder.', reservationRecommendation: 'Vooraf tickets controleren bij vakanties en weekenden.', label: 'Schepen en verhalen', rankReason: 'sterke gezinscontext, maar activiteiten kunnen per periode verschillen', neighbourhood: 'Oosterdok', imageAlt: 'Het Scheepvaartmuseum Amsterdam als gezinsmuseum met maritieme verhalen', ticketPartnerCategory: 'affiliate', ticketPartner: 'GetYourGuide', ticketUrl: 'https://www.getyourguide.com/het-scheepvaartmuseum-l2999/fast-line-tickets-the-national-maritime-museum-t46115/?partner_id=I8RVSW6&utm_medium=local_partners', cardType: 'other', ageGroups: ['4-6','7-9','10-12'], editorialScore: 3,
  },
]);

export const rejectedFamilyMuseumCandidates = Object.freeze([
  { slug: 'van-gogh-museum-amsterdam', reason: 'sterke kunstcollectie maar in deze dataset geen structureel, officieel gezinsaanbod geverifieerd voor opname als hoofdaanbeveling' },
  { slug: 'stedelijk-museum-amsterdam', reason: 'kandidaat voor kunst met kinderen, maar familieclaims en actuele programma’s moeten nog officieel worden gecontroleerd' },
  { slug: 'straat-museum-amsterdam', reason: 'visueel sterk voor oudere kinderen en tieners, maar structurele kinderfaciliteiten zijn onvoldoende geverifieerd' },
  { slug: 'allard-pierson-amsterdam', reason: 'incidentele of thematische activiteiten maken het nog geen structurele hoofdkeuze zonder aanvullende broncontrole' },
  { slug: 'het-grachtenmuseum-amsterdam', reason: 'mogelijk geschikt voor een kort bezoek, maar familieprofiel is onvoldoende officieel onderbouwd' },
  { slug: 'het-schip-amsterdam', reason: 'architectuurmuseum kan interessant zijn, maar geen voldoende breed structureel gezinsaanbod geverifieerd' },
  { slug: 'rembrandthuis-amsterdam', reason: 'kan bij teken- of etsdemo’s passen, maar structurele kindvriendelijkheid moet nog worden gecontroleerd' },
]);

export function getFamilyGuideIndexabilityStatus(profiles = familyMuseumProfiles) {
  const recommendable = profiles.filter((p) => ['verified', 'partially_verified'].includes(p.familyVerificationStatus) && p.familyFriendly === true && p.familySourceUrl);
  const mainRecommendations = recommendable.filter((p) => p.cardType === 'main' && p.whyFunForChildren && p.handsOnActivities?.length);
  const expiredTemporary = recommendable.filter((p) => p.temporaryProgrammeEndDate && p.temporaryProgrammeEndDate < FAMILY_GUIDE_LAST_VERIFIED_AT);
  const indexable = recommendable.length >= 5 && mainRecommendations.length >= 3 && expiredTemporary.length === 0;
  return { indexable, robots: indexable ? 'index, follow' : 'noindex, follow', recommendableCount: recommendable.length, mainRecommendationCount: mainRecommendations.length, expiredTemporaryCount: expiredTemporary.length };
}

export function getProfilesByAgeGroup(ageGroupKey) {
  if (!ageGroupKey) return [];
  return familyMuseumProfiles.filter((profile) => profile.ageGroups.includes(ageGroupKey));
}

export function isFamilyGuideMuseum(slug) {
  return familyMuseumProfiles.some((profile) => profile.slug === slug && ['verified','partially_verified'].includes(profile.familyVerificationStatus));
}

export function getSafeFamilyAnalyticsPayload(data = {}) {
  const allowed = new Set(['museumCode','ctaPosition','ageCategory','ticketPartnerCategory','cardType','sourceSection','language','deviceCategory']);
  return Object.fromEntries(Object.entries(data).filter(([key, value]) => allowed.has(key) && value !== undefined && value !== null && !String(value).includes('partner=')));
}
