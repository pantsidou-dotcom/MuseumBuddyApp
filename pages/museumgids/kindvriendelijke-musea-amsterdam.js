import Image from 'next/image';
import Link from 'next/link';
import SEO from '../../components/SEO';
import { useLanguage } from '../../components/LanguageContext';
import museumImages from '../../lib/museumImages';
import {
  FAMILY_AFFILIATE_DISCLOSURE,
  FAMILY_GUIDE_CANONICAL_URL,
  FAMILY_GUIDE_DESCRIPTION,
  FAMILY_GUIDE_LAST_VERIFIED_AT,
  FAMILY_GUIDE_PATH,
  FAMILY_GUIDE_TITLE,
  familyAgeGroups,
  familyMuseumProfiles,
  getFamilyGuideIndexabilityStatus,
} from '../../lib/familyGuide';

const checkedDate = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'long' }).format(new Date(`${FAMILY_GUIDE_LAST_VERIFIED_AT}T00:00:00Z`));
const mainProfiles = familyMuseumProfiles.filter((profile) => profile.cardType === 'main');
const otherProfiles = familyMuseumProfiles.filter((profile) => profile.cardType !== 'main');
const indexability = getFamilyGuideIndexabilityStatus();

function trackAttr(event, profile, section, extra = {}) {
  return {
    'data-analytics-event': event,
    'data-museum-code': profile.slug,
    'data-source-section': section,
    'data-ticket-partner-category': profile.ticketPartnerCategory,
    ...extra,
  };
}

function TicketCta({ profile, section, children = 'Bekijk tickets' }) {
  return (
    <a
      className="family-guide__button family-guide__button--primary"
      href={profile.ticketUrl}
      rel={profile.ticketPartnerCategory === 'affiliate' ? 'sponsored noopener noreferrer' : 'noopener noreferrer'}
      target="_blank"
      {...trackAttr('family_ticket_cta_clicked', profile, section, { 'data-cta-position': section })}
    >
      {children}
    </a>
  );
}

function DetailLink({ profile, section }) {
  return (
    <Link className="family-guide__button family-guide__button--secondary" href={`/museum/${profile.slug}`} {...trackAttr('family_museum_details_clicked', profile, section)}>
      Bekijk museumdetails
    </Link>
  );
}

export default function FamilyFriendlyMuseumsAmsterdamPage() {
  const { lang } = useLanguage();
  const itemList = familyMuseumProfiles.map((profile, index) => ({ '@type': 'ListItem', position: index + 1, url: `${FAMILY_GUIDE_CANONICAL_URL}#${profile.slug}`, name: profile.slug }));
  const faqItems = [
    ['Welk museum in Amsterdam is het leukst voor kinderen?', 'Voor veel gezinnen is NEMO de veiligste allround keuze als kinderen vooral zelf willen doen. Wereldmuseum Junior en Joods Museum junior zijn sterker wanneer je een duidelijke junioromgeving zoekt.'],
    ['Wat is een goed museum in Amsterdam voor een kind van vier?', 'Kijk vooral naar korte, tastbare bezoeken. NEMO kan vanaf ongeveer vier jaar werken; Eye Cinemini is specifiek geschikt voor 2–6 jaar wanneer het programma loopt.'],
    ['Welk museum in Amsterdam is geschikt voor een peuter?', 'Voor peuters is een kort programma belangrijker dan een groot museum. Eye Cinemini is de duidelijkste keuze wanneer er een passende voorstelling is; controleer vooraf tijden en tickets.'],
    ['Wat is het meest interactieve museum in Amsterdam?', 'NEMO en Wereldmuseum Junior hebben de sterkste hands-on basis. Joods Museum junior is ook interactief, maar met een specifiekere thematische focus.'],
    ['Welke Amsterdamse musea zijn gratis voor kinderen?', 'Het Rijksmuseum vermeldt gratis toegang tot en met 17 jaar. Andere kinderprijzen en gratis leeftijden verschillen per museum; controleer de actuele ticketpagina voor je boekt.'],
    ['Moet je museumtickets voor kinderen vooraf reserveren?', 'Ja, vooral in weekenden, vakanties en bij programma’s zoals Cinemini of familierondleidingen. Bij populaire musea voorkomt vooraf reserveren teleurstelling.'],
    ['Welk museum in Amsterdam is leuk met tieners?', 'Micropia, NEMO, Eye en het Rijksmuseum kunnen goed werken met tieners, afhankelijk van hun interesse in wetenschap, film of kunst.'],
    ['Wat kun je met kinderen doen in Amsterdam als het regent?', 'Kies een museum met voldoende binnenactiviteit: NEMO voor experimenten, Wereldmuseum Junior voor actief ontdekken, of Eye voor een kort filmprogramma.'],
  ];
  const structuredData = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://museumbuddy.nl/' },
      { '@type': 'ListItem', position: 2, name: 'Museumgids', item: 'https://museumbuddy.nl/museumgidsen-amsterdam' },
      { '@type': 'ListItem', position: 3, name: 'Kindvriendelijke musea in Amsterdam', item: FAMILY_GUIDE_CANONICAL_URL },
    ]},
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'De beste kindvriendelijke musea in Amsterdam', description: FAMILY_GUIDE_DESCRIPTION, url: FAMILY_GUIDE_CANONICAL_URL, mainEntity: { '@type': 'ItemList', itemListElement: itemList } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqItems.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) },
  ];

  return (
    <>
      <SEO title={FAMILY_GUIDE_TITLE} description={FAMILY_GUIDE_DESCRIPTION} canonical={FAMILY_GUIDE_PATH} image="/images/og-family-museums.svg" structuredData={structuredData} robots={indexability.robots} />
      <article className="family-guide" data-analytics-event="family_guide_viewed" data-language={lang}>
        <nav className="family-guide__breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>›</span><Link href="/museumgidsen-amsterdam">Museumgids</Link><span>›</span><span>Kindvriendelijke musea in Amsterdam</span></nav>
        <section className="family-guide__hero">
          <p className="family-guide__eyebrow">Laatst gecontroleerd: {checkedDate} · {indexability.recommendableCount} geverifieerde musea</p>
          <h1>De beste kindvriendelijke musea in Amsterdam</h1>
          <p>Amsterdam heeft musea waar kinderen kunnen experimenteren, ontdekken, luisteren, kijken of spelen. De beste keuze hangt vooral af van leeftijd, prikkelgevoeligheid, bezoekduur en hoeveel interactie je zoekt.</p>
          <p className="family-guide__method">Redactionele volgorde: actieve interactie, duidelijke leeftijdsdoelgroep, structureel familieaanbod, praktische bruikbaarheid en actuele officiële bronnen. Affiliatevergoeding telt niet mee.</p>
        </section>

        <section className="family-guide__quick" aria-labelledby="quick-picks"><h2 id="quick-picks">Snel kiezen</h2><div className="family-guide__quick-grid">
          {[
            ['Beste allround keuze', mainProfiles[0], 'Veel proefjes en experimenten op één plek.'],
            ['Beste voor veel zelf doen', mainProfiles[1], 'Junioraanbod is gebouwd rond aanraken, ervaren en meedoen.'],
            ['Beste voor jonge kinderen', mainProfiles[4], 'Cinemini is kort en gemaakt voor 2–6 jaar.'],
            ['Beste met oudere kinderen', mainProfiles[5], 'Microben, microscopen en labverhalen passen goed bij nieuwsgierige oudere kinderen.'],
            ['Beste voor kunst met kinderen', mainProfiles[3], 'Topstukken met familiespel en gratis toegang t/m 17 jaar.'],
          ].map(([title, profile, reason]) => <article key={title} className="family-guide__quick-card"><h3>{title}</h3><p><strong>{profile.slug.replace(/-/g, ' ').replace('amsterdam','')}</strong></p><p>{reason}</p><p>{profile.recommendedAgeLabel}</p><TicketCta profile={profile} section="quick_pick" /></article>)}
        </div></section>

        <section aria-labelledby="age-choice"><h2 id="age-choice">Kies op leeftijd</h2><p>Leeftijd is een indicatie: interesse, prikkelgevoeligheid en actuele activiteiten verschillen per kind.</p><div className="family-guide__chips" role="tablist" aria-label="Leeftijdsindicatie">
          {familyAgeGroups.map((group) => <a key={group.key} role="tab" className="family-guide__chip" href={`#age-${group.key}`} data-analytics-event="family_age_filter_selected" data-age-category={group.key}>{group.label}</a>)}
        </div>{familyAgeGroups.map((group) => <section key={group.key} id={`age-${group.key}`} className="family-guide__age-block"><h3>{group.label}</h3><p>{group.description}</p><p>{familyMuseumProfiles.filter((p) => p.ageGroups.includes(group.key)).map((p) => p.slug.replace(/-/g, ' ').replace('amsterdam','')).join(' · ')}</p></section>)}</section>

        <section aria-labelledby="comparison"><h2 id="comparison">Vergelijk kindvriendelijke musea</h2><div className="family-guide__table-wrap" data-analytics-event="family_comparison_used"><table><thead><tr><th>Museum</th><th>Vooral geschikt voor</th><th>Leeftijd</th><th>Interactief</th><th>Duur</th><th>Kinderprijs/gratis</th><th>Reserveren</th><th>Buurt</th></tr></thead><tbody>{familyMuseumProfiles.map((p) => <tr key={p.slug}><td><a href={`#${p.slug}`}>{p.slug.replace(/-/g, ' ').replace('amsterdam','')}</a></td><td>{p.label}</td><td>{p.recommendedAgeLabel}</td><td>{p.interactiveLevel}</td><td>{p.typicalVisitDurationMin}–{p.typicalVisitDurationMax} min</td><td>{p.freeChildAgeInformation || p.childTicketInformation}</td><td>{p.reservationRecommendation}</td><td>{p.neighbourhood}</td></tr>)}</tbody></table></div></section>

        <section aria-labelledby="main-recommendations"><h2 id="main-recommendations">Belangrijkste aanbevelingen</h2>{mainProfiles.map((profile) => <article key={profile.slug} id={profile.slug} className="family-guide__museum"><div className="family-guide__image"><Image src={museumImages[profile.slug]} alt={profile.imageAlt} width={720} height={420} /></div><div><p className="family-guide__badge">{profile.label}</p><h3>{profile.slug.replace(/-/g, ' ').replace('amsterdam','')}</h3><p><strong>Conclusie:</strong> {profile.rankReason}.</p><h4>Waarom leuk met kinderen</h4><p>{profile.whyFunForChildren}</p><ul>{profile.handsOnActivities.map((activity) => <li key={activity}>{activity}</li>)}</ul><p><strong>Leeftijd:</strong> {profile.recommendedAgeLabel}</p><p><strong>Bezoekduur:</strong> {profile.typicalVisitDurationMin}–{profile.typicalVisitDurationMax} minuten</p><p><strong>Praktisch:</strong> {profile.reservationRecommendation} {profile.noiseOrSensoryInformation || ''}</p><p><strong>Prijsinformatie:</strong> {profile.freeChildAgeInformation || profile.childTicketInformation}</p><p><strong>Gecontroleerd:</strong> {checkedDate} via <a href={profile.familySourceUrl} rel="noopener noreferrer" target="_blank">officiële bron</a>.</p><div className="family-guide__actions"><TicketCta profile={profile} section="main_card" children="Controleer tickets en beschikbaarheid" /><DetailLink profile={profile} section="main_card" /></div></div></article>)}</section>

        <section aria-labelledby="other-options"><h2 id="other-options">Overige goede keuzes</h2><div className="family-guide__other-grid">{otherProfiles.map((profile) => <article key={profile.slug}><h3>{profile.slug.replace(/-/g, ' ').replace('amsterdam','')}</h3><p>{profile.whyFunForChildren}</p><p>Voor {profile.recommendedAgeLabel}; niet de eerste keuze omdat {profile.rankReason}.</p><TicketCta profile={profile} section="other_card" /></article>)}</div></section>

        <section aria-labelledby="situations"><h2 id="situations">Welk museum past bij jullie dag?</h2><ul className="family-guide__situations"><li>Veel zelf doen: <a href="#nemo-science-museum-amsterdam">NEMO</a> of <a href="#wereldmuseum-amsterdam">Wereldmuseum Junior</a>.</li><li>Maar twee uur: Eye, Micropia of Joods Museum junior.</li><li>Met een peuter: controleer Eye Cinemini en houd het bezoek kort.</li><li>Verschillende leeftijden: NEMO of Rijksmuseum geeft de breedste marge.</li><li>Regenachtige dag: kies een museum met voldoende binnenactiviteit en reserveer vooraf.</li><li>Kunst zonder snel vervelen: Rijksmuseum met familiespel.</li><li>Tieners: Micropia, Eye, NEMO of Rijksmuseum.</li></ul></section>

        <section aria-labelledby="tips"><h2 id="tips">Praktische tips</h2><p>Reken meestal 60 tot 180 minuten. Reserveer vooraf bij populaire musea, vakanties en kinderprogramma’s. Controleer bij kleine kinderen altijd kinderwagens, verschoonruimte, rustplekken en actuele agenda. Prijsinformatie verwijst bewust naar actuele ticketpagina’s wanneer exacte bedragen snel kunnen wijzigen.</p><p className="family-guide__affiliate">{FAMILY_AFFILIATE_DISCLOSURE}</p></section>

        <section aria-labelledby="faq"><h2 id="faq">Veelgestelde vragen</h2>{faqItems.map(([question, answer]) => <details key={question} className="guide-faq-item" data-analytics-event="family_faq_opened"><summary>{question}</summary><p>{answer}</p></details>)}</section>
        <section className="family-guide__bottom-cta"><h2>Klaar om te kiezen?</h2><p>Begin met de vergelijking of open direct de ticketpagina van je voorkeursmuseum. MuseumBuddy verkoopt zelf geen tickets.</p><TicketCta profile={mainProfiles[0]} section="bottom_cta" children="Bekijk tickets voor NEMO" /></section>
      </article>
    </>
  );
}
