import TicketLandingTemplate from '../components/TicketLandingTemplate';
import museumTicketUrls from '../lib/museumTicketUrls';

const DETAIL_PAGE_URL = '/museum/ons-lieve-heer-op-solder-amsterdam';
const TICKET_URL = museumTicketUrls['ons-lieve-heer-op-solder-amsterdam'];

const practicalItems = [
  { label: 'Prijsindicatie', value: '± €16–€18 p.p.' },
  { label: 'Locatie', value: 'Amsterdam (centrum)' },
  { label: 'Bezoektijd', value: 'Gemiddeld 1–1,5 uur' },
  { label: 'Reserveren', value: 'Aanbevolen' },
  { label: 'Beste moment', value: 'Doordeweeks in de ochtend' },
  { label: 'Geschikt voor kinderen', value: 'Ja, vanaf ca. 8 jaar' },
];

const infoBlocks = [
  {
    title: 'Tickets en beschikbaarheid',
    text: 'Dit museum is populair bij bezoekers die een compacte, historische ervaring zoeken. Controleer vooraf beschikbare tijdsloten om teleurstelling te voorkomen.',
  },
  {
    title: 'Openingstijden',
    text: 'Openingstijden kunnen verschillen per dag en seizoen. Kijk altijd kort voor vertrek naar de meest actuele openingstijden.',
  },
  {
    title: 'Drukte / beste moment',
    text: 'Op weekdagen is het meestal rustiger dan in het weekend. Vroege tijdsloten geven vaak de meest ontspannen bezoekervaring.',
  },
  {
    title: 'Hoe lang je nodig hebt',
    text: 'Voor de meeste bezoekers is 1 tot 1,5 uur voldoende om het museum rustig te bekijken, inclusief de zolderkerk.',
  },
  {
    title: 'Voor wie dit museum geschikt is',
    text: 'Geschikt voor liefhebbers van Amsterdamse geschiedenis, erfgoed en religieuze cultuur. Ook interessant voor gezinnen met oudere kinderen.',
  },
];

export default function OnsLieveHeerOpSolderTicketsPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Ons’ Lieve Heer op Solder tickets, openingstijden en praktische info',
    description:
      'Praktische informatie voor je bezoek aan Ons’ Lieve Heer op Solder in Amsterdam: tickets, openingstijden, beste moment en bezoektijd.',
    url: 'https://museumbuddy.nl/ons-lieve-heer-op-solder-tickets',
    inLanguage: 'nl-NL',
    mainEntity: {
      '@type': 'TouristAttraction',
      name: "Ons' Lieve Heer op Solder",
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Amsterdam',
        addressCountry: 'NL',
      },
    },
  };

  return (
    <TicketLandingTemplate
      title="Ons Lieve Heer op Solder tickets | Praktische info & openingstijden"
      description="Bekijk snel de belangrijkste praktische info voor Ons’ Lieve Heer op Solder: tickets, openingstijden, drukte en bezoektijd."
      canonical="/ons-lieve-heer-op-solder-tickets"
      h1="Ons’ Lieve Heer op Solder tickets, openingstijden en praktische info"
      intro="Hier vind je in één oogopslag de belangrijkste informatie voor je bezoek. Zo kun je rustig vergelijken en daarna de ticketopties bekijken die bij je planning passen."
      primaryCtaLabel="Bekijk beschikbaarheid"
      primaryCtaHref={TICKET_URL}
      detailPageHref={DETAIL_PAGE_URL}
      detailPageLabel="Bekijk de museum detailpagina"
      practicalItems={practicalItems}
      infoBlocks={infoBlocks}
      ticketSectionText="Wil je je bezoek plannen? Via onze partner kun je actuele ticketopties bekijken en direct controleren welke momenten nog beschikbaar zijn."
      affiliateNote="Soms ontvangen we een kleine vergoeding als je via een partner boekt. Dit kost jou niets extra's."
      structuredData={structuredData}
    />
  );
}
