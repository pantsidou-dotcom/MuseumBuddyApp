import Image from 'next/image';
import Link from 'next/link';
import SEO from '../../components/SEO';
import { useLanguage } from '../../components/LanguageContext';
import museumImages from '../../lib/museumImages';
import museumImageCredits from '../../lib/museumImageCredits';
import formatImageCredit from '../../lib/formatImageCredit';
import {
  FAMILY_GUIDE_CANONICAL_URL,
  FAMILY_GUIDE_DESCRIPTION,
  FAMILY_GUIDE_LAST_VERIFIED_AT,
  FAMILY_GUIDE_PATH,
  FAMILY_GUIDE_TITLE,
  familyMuseumProfiles,
  getFamilyGuideIndexabilityStatus,
} from '../../lib/familyGuide';

const checkedDate = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'long' }).format(new Date(`${FAMILY_GUIDE_LAST_VERIFIED_AT}T00:00:00Z`));
const visibleProfiles = familyMuseumProfiles.filter((profile) => profile.slug !== 'scheepvaartmuseum-amsterdam');
const mainProfiles = visibleProfiles.filter((profile) => profile.cardType === 'main');
const indexability = getFamilyGuideIndexabilityStatus();

const pageCopy = {
  nl: {
    details: 'Bekijk museumdetails',
    tickets: 'Bekijk tickets',
    partnerlink: 'Partnerlink',
    checked: 'Laatst gecontroleerd',
    verified: 'geverifieerde musea',
    h1: 'De beste kindvriendelijke musea in Amsterdam',
    intro: 'Amsterdam heeft musea waar kinderen kunnen experimenteren, ontdekken, luisteren, kijken of spelen. De beste keuze hangt vooral af van leeftijd, prikkelgevoeligheid, bezoekduur en hoeveel interactie je zoekt.',
    method: 'Redactionele volgorde: actieve interactie, duidelijke leeftijdsdoelgroep, structureel familieaanbod, praktische bruikbaarheid en actuele officiële bronnen. Affiliatevergoeding telt niet mee.',
    main: 'Aanbevelingen',
    conclusion: 'Conclusie:',
    why: 'Waarom leuk met kinderen',
    age: 'Leeftijd:',
    duration: 'Bezoekduur:',
    practical: 'Praktisch:',
    price: 'Prijsinformatie:',
    source: 'Gecontroleerd:',
    moreDetails: 'Waarom deze keuze?',
    officialSource: 'officiële bron',
    availability: 'Controleer tickets en beschikbaarheid',
    situations: 'Welk museum past bij jullie dag?',
    tips: 'Praktische tips',
    tipsText: 'Reken meestal 60 tot 180 minuten. Reserveer vooraf bij populaire musea, vakanties en kinderprogramma’s. Controleer bij kleine kinderen altijd kinderwagens, verschoonruimte, rustplekken en actuele agenda. Prijsinformatie verwijst bewust naar actuele ticketpagina’s wanneer exacte bedragen snel kunnen wijzigen.',
    faq: 'Veelgestelde vragen',
    situationsList: ['Veel zelf doen: NEMO of Wereldmuseum Junior.', 'Maar twee uur: Eye, Micropia of Joods Museum junior.', 'Met een peuter: controleer Eye Cinemini en houd het bezoek kort.', 'Verschillende leeftijden: NEMO of Rijksmuseum geeft de breedste marge.', 'Regenachtige dag: kies een museum met voldoende binnenactiviteit en reserveer vooraf.', 'Kunst zonder snel vervelen: Rijksmuseum met familiespel.', 'Tieners: Micropia, Eye, NEMO of Rijksmuseum.'],
    faqItems: [
      ['Welk museum in Amsterdam is het leukst voor kinderen?', 'Voor veel gezinnen is NEMO de veiligste allround keuze als kinderen vooral zelf willen doen. Wereldmuseum Junior en Joods Museum junior zijn sterker wanneer je een duidelijke junioromgeving zoekt.'],
      ['Wat is een goed museum in Amsterdam voor een kind van vier?', 'Kijk vooral naar korte, tastbare bezoeken. NEMO kan vanaf ongeveer vier jaar werken; Eye Cinemini is specifiek geschikt voor 2–6 jaar wanneer het programma loopt.'],
      ['Welk museum in Amsterdam is geschikt voor een peuter?', 'Voor peuters is een kort programma belangrijker dan een groot museum. Eye Cinemini is de duidelijkste keuze wanneer er een passende voorstelling is; controleer vooraf tijden en tickets.'],
      ['Wat is het meest interactieve museum in Amsterdam?', 'NEMO en Wereldmuseum Junior hebben de sterkste hands-on basis. Joods Museum junior is ook interactief, maar met een specifiekere thematische focus.'],
      ['Welke Amsterdamse musea zijn gratis voor kinderen?', 'Het Rijksmuseum vermeldt gratis toegang tot en met 17 jaar. Andere kinderprijzen en gratis leeftijden verschillen per museum; controleer de actuele ticketpagina voor je boekt.'],
      ['Moet je museumtickets voor kinderen vooraf reserveren?', 'Ja, vooral in weekenden, vakanties en bij programma’s zoals Cinemini of familierondleidingen. Bij populaire musea voorkomt vooraf reserveren teleurstelling.'],
      ['Welk museum in Amsterdam is leuk met tieners?', 'Micropia, NEMO, Eye en het Rijksmuseum kunnen goed werken met tieners, afhankelijk van hun interesse in wetenschap, film of kunst.'],
      ['Wat kun je met kinderen doen in Amsterdam als het regent?', 'Kies een museum met voldoende binnenactiviteit: NEMO voor experimenten, Wereldmuseum Junior voor actief ontdekken, of Eye voor een kort filmprogramma.'],
    ],
    breadcrumbGuide: 'Museumgids',
    breadcrumbCurrent: 'Kindvriendelijke musea in Amsterdam',
    via: 'via',
  },
  en: {
    details: 'View museum details',
    tickets: 'View tickets',
    partnerlink: 'Partner link',
    checked: 'Last checked',
    verified: 'verified museums',
    h1: 'The best kid-friendly museums in Amsterdam',
    intro: 'Amsterdam has museums where children can experiment, discover, listen, look and play. The best choice depends on age, sensory needs, visit length and how much interaction you want.',
    method: 'Editorial order is based on active interaction, clear age fit, structural family offer, practical usefulness and current official sources. Affiliate compensation never affects placement.',
    main: 'Recommendations',
    conclusion: 'Conclusion:',
    why: 'Why it is fun with children',
    age: 'Age:',
    duration: 'Visit length:',
    practical: 'Practical:',
    price: 'Child price info:',
    source: 'Checked:',
    moreDetails: 'Why this pick?',
    officialSource: 'official source',
    availability: 'Check tickets and availability',
    situations: 'Which museum fits your day?',
    tips: 'Practical tips',
    tipsText: 'Plan around 60 to 180 minutes. Book ahead for popular museums, holidays and family programmes. With small children, check strollers, changing facilities, quiet moments and the current agenda. Price information points to current ticket pages when exact prices may change quickly.',
    faq: 'Frequently asked questions',
    situationsList: ['Lots to do yourself: NEMO or Wereldmuseum Junior.', 'Only two hours: Eye, Micropia or Jewish Museum junior.', 'With a toddler: check Eye Cinemini and keep the visit short.', 'Different ages: NEMO or Rijksmuseum gives the broadest range.', 'Rainy day: choose a museum with enough indoor activity and book ahead.', 'Art without children getting bored quickly: Rijksmuseum with the family game.', 'Teenagers: Micropia, Eye, NEMO or Rijksmuseum.'],
    faqItems: [
      ['Which Amsterdam museum is most fun for children?', 'For many families NEMO is the safest all-round choice when children mainly want to do things themselves. Wereldmuseum Junior and Jewish Museum junior are stronger when you want a clear junior environment.'],
      ['What is a good Amsterdam museum for a four-year-old?', 'Look for short, tangible visits. NEMO can work from around age four; Eye Cinemini is specifically designed for ages 2–6 when the programme is on.'],
      ['Which Amsterdam museum is suitable for a toddler?', 'For toddlers, a short programme matters more than a large museum. Eye Cinemini is the clearest option when there is a suitable screening; check times and tickets first.'],
      ['What is the most interactive museum in Amsterdam?', 'NEMO and Wereldmuseum Junior have the strongest hands-on basis. Jewish Museum junior is also interactive, but with a more specific theme.'],
      ['Which Amsterdam museums are free for children?', 'The Rijksmuseum states free admission up to and including age 17. Other child prices and free ages differ per museum; check the current ticket page before booking.'],
      ['Should you reserve museum tickets for children in advance?', 'Yes, especially on weekends, holidays and for programmes such as Cinemini or family tours. Booking ahead helps avoid disappointment at popular museums.'],
      ['Which Amsterdam museum is fun with teenagers?', 'Micropia, NEMO, Eye and the Rijksmuseum can work well with teenagers depending on their interest in science, film or art.'],
      ['What can you do with children in Amsterdam when it rains?', 'Choose a museum with enough indoor activity: NEMO for experiments, Wereldmuseum Junior for active discovery, or Eye for a short film programme.'],
    ],
    via: 'via',
  },
};

const profileCopy = {
  'nemo-science-museum-amsterdam': {
    nl: { name: 'NEMO Science Museum', label: 'Veel zelf doen', reason: 'Veel proefjes en experimenten op één plek.', rank: 'meest uitgesproken hands-on profiel', why: 'Kinderen kunnen zelf experimenteren met wetenschap, techniek, licht en constructies, waardoor het bezoek draait om doen in plaats van lang stil kijken.', age: 'vanaf ca. 4 jaar, sterk voor 7–12 jaar', activities: ['experimenteren', 'demonstraties', 'zelf ontdekken'], practical: 'Vooraf reserveren is verstandig in weekenden en vakanties. Kan druk en prikkelrijk zijn.', price: 'Bekijk actuele kinderprijzen bij de ticketaanbieder.' },
    en: { name: 'NEMO Science Museum', label: 'Lots to do yourself', reason: 'Many experiments and hands-on exhibits in one place.', rank: 'the clearest hands-on profile', why: 'Children can experiment with science, technology, light and construction themselves, so the visit is less about standing still and looking for a long time.', age: 'from about 4 years; especially strong for 7–12', activities: ['experiments', 'demonstrations', 'self-guided discovery'], practical: 'Booking ahead is sensible on weekends and holidays. It can be busy and sensory-rich.', price: 'Check current child prices with the ticket provider.' },
  },
  'wereldmuseum-amsterdam': {
    nl: { name: 'Wereldmuseum', label: 'Beste voor veel zelf doen', reason: 'Junioraanbod is gebouwd rond aanraken, ervaren en meedoen.', rank: 'structureel kindermuseum met heldere leeftijdsdoelgroep', why: 'Wereldmuseum Junior is structureel opgezet rond zien, aanraken, ervaren en meedoen, met een duidelijke focus op kinderen van 6 tot 13 jaar.', age: '6–13 jaar', activities: ['meedoen in Junior-tentoonstelling', 'verhalen en opdrachten', 'zintuiglijke onderdelen'], practical: 'Reserveer vooraf voor Junior-programma’s en populaire dagen.', price: 'Bekijk actuele kinderprijzen bij de ticketaanbieder.' },
    en: { name: 'Wereldmuseum', label: 'Best for hands-on discovery', reason: 'The Junior offer is built around touching, experiencing and joining in.', rank: 'a structural children’s museum with a clear age focus', why: 'Wereldmuseum Junior is structurally designed around seeing, touching, experiencing and participating, with a clear focus on children aged 6 to 13.', age: '6–13 years', activities: ['Junior exhibition activities', 'stories and assignments', 'sensory elements'], practical: 'Book ahead for Junior programmes and popular days.', price: 'Check current child prices with the ticket provider.' },
  },
  'joods-museum-amsterdam': {
    nl: { name: 'Joods Museum', label: 'Beste juniorhuis', reason: 'De juniorafdeling is concreet, actief en overzichtelijk.', rank: 'permanente junioromgeving met concrete kinderactiviteiten', why: 'Joods Museum junior is ingericht als een huis waar kinderen voorwerpen mogen gebruiken, challah kunnen bakken en hun naam in Hebreeuws kunnen leren schrijven.', age: '6–12 jaar', activities: ['Joods Museum junior', 'huisopdrachten', 'muziek en taal'], practical: 'Vooraf reserveren aanbevolen bij gezinsactiviteiten.', price: 'Kinderen onder 6 jaar gratis volgens officiële familiepagina.' },
    en: { name: 'Jewish Museum', label: 'Best junior house', reason: 'The junior department is concrete, active and easy to navigate.', rank: 'a permanent junior environment with concrete children’s activities', why: 'Jewish Museum junior is set up like a house where children can use objects, bake challah and learn to write their name in Hebrew.', age: '6–12 years', activities: ['Jewish Museum junior', 'house-based assignments', 'music and language'], practical: 'Booking ahead is recommended for family activities.', price: 'Children under 6 are free according to the official family page.' },
  },
  'rijksmuseum-amsterdam': {
    nl: { name: 'Rijksmuseum', label: 'Kunst met opdracht', reason: 'Topstukken met familiespel en gratis toegang t/m 17 jaar.', rank: 'sterk wanneer gezinnen kunst willen zien met kindvriendelijke routes', why: 'Het Rijksmuseum koppelt topstukken aan familieprogramma’s, een familiespel en praktische gezinsinformatie, waardoor kunst kijken meer richting krijgt.', age: 'vanaf ca. 6 jaar; gratis t/m 17 jaar', activities: ['familiespel', 'familierondleiding', 'topstukken zoeken'], practical: 'Reserveer tijdslot vooraf; het museum kan druk zijn.', price: 'Gratis voor iedereen tot en met 17 jaar.' },
    en: { name: 'Rijksmuseum', label: 'Art with a task', reason: 'Masterpieces, a family game and free admission up to age 17.', rank: 'strong when families want to see art with child-friendly routes', why: 'The Rijksmuseum connects masterpieces with family programmes, a family game and practical family information, which gives children more direction while looking at art.', age: 'from about 6 years; free up to age 17', activities: ['family game', 'family tour', 'finding highlights'], practical: 'Reserve a timeslot in advance; the museum can be busy.', price: 'Free for everyone up to and including 17 years.' },
  },
  'eye-filmmuseum-amsterdam': {
    nl: { name: 'Eye Filmmuseum', label: 'Kort en filmisch', reason: 'Cinemini is kort en gemaakt voor 2–6 jaar.', rank: 'goed voor korte programma’s en jonge kinderen wanneer agenda past', why: 'Eye heeft structurele kinderfilms en Cinemini voor peuters en kleuters, met korte films en experimenten met licht en schaduw.', age: '2–6 jaar voor Cinemini; oudere kinderen per film of tentoonstelling', activities: ['Cinemini', 'kinderfilms', 'licht- en schaduwspel'], practical: 'Reserveer voor films en Cinemini.', price: 'Bekijk actuele prijs per film, tentoonstelling of activiteit.' },
    en: { name: 'Eye Filmmuseum', label: 'Short and cinematic', reason: 'Cinemini is short and made for ages 2–6.', rank: 'good for short programmes and young children when the agenda fits', why: 'Eye has structural children’s films and Cinemini for toddlers and preschoolers, with short films and experiments with light and shadow.', age: '2–6 years for Cinemini; older children depending on film or exhibition', activities: ['Cinemini', 'children’s films', 'light and shadow play'], practical: 'Book films and Cinemini ahead.', price: 'Check the current price per film, exhibition or activity.' },
  },
  'micropia-museum-amsterdam': {
    nl: { name: 'Micropia Museum', label: 'Nieuwsgierige onderzoekers', reason: 'Microben, microscopen en labverhalen passen goed bij oudere kinderen.', rank: 'compact en inhoudelijk sterk voor oudere kinderen', why: 'Micropia maakt microben zichtbaar met microscopen, interactieve displays en verhalen uit het lab; vooral sterk voor nieuwsgierige oudere kinderen.', age: 'vanaf ca. 8 jaar', activities: ['microscopen', 'labverhalen', 'interactieve displays'], practical: 'Online tickets zijn praktisch; combineer eventueel met ARTIS. Donkere ruimtes en microbiologie passen niet bij elk jong kind.', price: 'Bekijk actuele kinderprijzen bij de ticketaanbieder.' },
    en: { name: 'Micropia Museum', label: 'Curious researchers', reason: 'Microbes, microscopes and lab stories work well for older children.', rank: 'compact and content-rich for older children', why: 'Micropia makes microbes visible with microscopes, interactive displays and lab stories; it is especially strong for curious older children.', age: 'from about 8 years', activities: ['microscopes', 'lab stories', 'interactive displays'], practical: 'Online tickets are practical; you can combine with ARTIS. Dark rooms and microbiology may not suit every young child.', price: 'Check current child prices with the ticket provider.' },
  },
};

function getProfileText(profile, lang, key) {
  return profileCopy[profile.slug]?.[lang]?.[key] || profileCopy[profile.slug]?.nl?.[key] || profile[key] || '';
}

function getCreditSegments(slug, t) {
  const formatted = formatImageCredit(museumImageCredits[slug], t);
  return formatted?.segments || [];
}


function trackAttr(event, profile, section, extra = {}) {
  return {
    'data-analytics-event': event,
    'data-museum-code': profile.slug,
    'data-source-section': section,
    'data-ticket-partner-category': profile.ticketPartnerCategory,
    ...extra,
  };
}

function TicketCta({ profile, section, children, badgeText }) {
  return (
    <a
      className="ticket-button museum-guide-action-link family-guide__cta"
      href={profile.ticketUrl}
      rel={profile.ticketPartnerCategory === 'affiliate' ? 'sponsored noopener noreferrer' : 'noopener noreferrer'}
      target="_blank"
      {...trackAttr('family_ticket_cta_clicked', profile, section, { 'data-cta-position': section })}
    >
      <span className="ticket-button__label ticket-button__label--stacked">
        <span className="ticket-button__label-text">{children}</span>
        {profile.ticketPartnerCategory === 'affiliate' ? <span className="ticket-button__badge">{badgeText}</span> : null}
      </span>
    </a>
  );
}

function DetailLink({ profile, section, children }) {
  return (
    <Link className="ticket-button museum-guide-action-link family-guide__details-link" href={`/museum/${profile.slug}`} {...trackAttr('family_museum_details_clicked', profile, section)}>
      {children}
    </Link>
  );
}

function FamilyRecommendationCard({ profile, cp, lang, t, featured = false }) {
  const creditSegments = getCreditSegments(profile.slug, t);

  return (
    <article id={profile.slug} className={`family-guide__museum${featured ? ' family-guide__museum--featured' : ''}`}>
      <div className="family-guide__image">
        <Image src={museumImages[profile.slug]} alt={profile.imageAlt} width={720} height={420} />
        {creditSegments.length ? <p className="image-credit family-guide__image-credit">{creditSegments.map((segment, index) => <span key={`${profile.slug}-credit-${segment.key}-${index}`}>{index > 0 ? <span aria-hidden="true" className="image-credit-divider">•</span> : null}{segment.url ? <a className="image-credit-link" href={segment.url} target="_blank" rel="noreferrer">{segment.label}</a> : <span className="image-credit-part">{segment.label}</span>}</span>)}</p> : null}
      </div>
      <div className="family-guide__museum-body">
        <p className="family-guide__badge">{getProfileText(profile, lang, 'label')}</p>
        <h3>{getProfileText(profile, lang, 'name')}</h3>
        <p className="family-guide__reason">{getProfileText(profile, lang, 'reason')}</p>
        <dl className="family-guide__at-a-glance">
          <div><dt>{cp.age}</dt><dd>{getProfileText(profile, lang, 'age')}</dd></div>
          <div><dt>{cp.duration}</dt><dd>{profile.typicalVisitDurationMin}–{profile.typicalVisitDurationMax} min</dd></div>
        </dl>
        <details className="family-guide__details">
          <summary>{cp.moreDetails}</summary>
          <p><strong>{cp.conclusion}</strong> {getProfileText(profile, lang, 'rank')}.</p>
          <h4>{cp.why}</h4><p>{getProfileText(profile, lang, 'why')}</p>
          <ul>{getProfileText(profile, lang, 'activities').map((activity) => <li key={activity}>{activity}</li>)}</ul>
          <p><strong>{cp.practical}</strong> {getProfileText(profile, lang, 'practical')}</p>
          <p><strong>{cp.price}</strong> {getProfileText(profile, lang, 'price')}</p>
          <p><strong>{cp.source}</strong> {checkedDate} {cp.via} <a href={profile.familySourceUrl} rel="noopener noreferrer" target="_blank">{cp.officialSource}</a>.</p>
        </details>
        <div className="family-guide__actions"><TicketCta profile={profile} section="main_card" children={cp.availability} badgeText={cp.partnerlink} /><DetailLink profile={profile} section="main_card">{cp.details}</DetailLink><p className="ticket-button__note family-guide__card-affiliate-note"><span className="ticket-button__note-text"><span className="ticket-button__note-line">{t('ticketsAffiliateIntro')}</span><span className="ticket-button__note-line ticket-button__note-disclosure">{t('ticketsAffiliateDisclosure')} {t('ticketsAffiliatePricesMayVary')}</span></span></p></div>
      </div>
    </article>
  );
}

export default function FamilyFriendlyMuseumsAmsterdamPage() {
  const { lang, t } = useLanguage();
  const cp = pageCopy[lang] || pageCopy.nl;
  const itemList = visibleProfiles.map((profile, index) => ({ '@type': 'ListItem', position: index + 1, url: `${FAMILY_GUIDE_CANONICAL_URL}#${profile.slug}`, name: profile.slug }));
  const faqItems = cp.faqItems;
  const structuredData = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.museumbuddy.nl/' },
      { '@type': 'ListItem', position: 2, name: cp.breadcrumbGuide, item: 'https://www.museumbuddy.nl/museumgidsen-amsterdam' },
      { '@type': 'ListItem', position: 3, name: cp.breadcrumbCurrent, item: FAMILY_GUIDE_CANONICAL_URL },
    ]},
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: cp.h1, description: FAMILY_GUIDE_DESCRIPTION, url: FAMILY_GUIDE_CANONICAL_URL, mainEntity: { '@type': 'ItemList', itemListElement: itemList } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqItems.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) },
  ];

  return (
    <>
      <SEO title={FAMILY_GUIDE_TITLE} description={FAMILY_GUIDE_DESCRIPTION} canonical={FAMILY_GUIDE_PATH} image="/images/og-family-museums.svg" structuredData={structuredData} robots={indexability.robots} />
      <article className="family-guide" data-analytics-event="family_guide_viewed" data-language={lang}>
        <nav className="family-guide__breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>›</span><Link href="/museumgidsen-amsterdam">{cp.breadcrumbGuide}</Link><span>›</span><span>{cp.breadcrumbCurrent}</span></nav>
        <section className="page-intro family-guide__hero">
          <p className="family-guide__eyebrow">{cp.checked}: {checkedDate} · {visibleProfiles.length} {cp.verified}</p>
          <h1 className="page-title">{cp.h1}</h1>
          <p className="page-subtitle">{cp.intro}</p>
          <p className="family-guide__method">{cp.method}</p>
        </section>

        <section className="museum-guide-section" aria-labelledby="main-recommendations">
          <h2 id="main-recommendations">{cp.main}</h2>
          <div className="family-guide__recommendations">
            {mainProfiles.map((profile, index) => <FamilyRecommendationCard key={profile.slug} profile={profile} cp={cp} lang={lang} t={t} featured={index === 0} />)}
          </div>
        </section>

        <section className="museum-guide-section" aria-labelledby="situations"><h2 id="situations">{cp.situations}</h2><ul className="family-guide__situations">{cp.situationsList.map((item) => <li key={item}>{item}</li>)}</ul></section>

        <section className="museum-guide-section" aria-labelledby="tips"><h2 id="tips">{cp.tips}</h2><p>{cp.tipsText}</p><p className="ticket-button__note family-guide__affiliate"><span className="ticket-button__note-text"><span className="ticket-button__note-line ticket-button__note-disclosure">{t('ticketsAffiliateIntro')}<br />{t('ticketsAffiliateDisclosure')} {t('ticketsAffiliatePricesMayVary')}</span></span></p></section>

        <section className="museum-guide-section" aria-labelledby="faq"><h2 id="faq">{cp.faq}</h2>{faqItems.map(([question, answer]) => <details key={question} className="guide-faq-item" data-analytics-event="family_faq_opened"><summary>{question}</summary><p>{answer}</p></details>)}</section>
      </article>
    </>
  );
}
