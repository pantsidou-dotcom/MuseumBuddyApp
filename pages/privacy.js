import Head from 'next/head';

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacyverklaring - MuseumBuddy</title>
        <meta
          name="description"
          content="Lees hoe MuseumBuddy met jouw persoonsgegevens omgaat."
        />
      </Head>
      <h1 className="page-title">Privacyverklaring</h1>
      <p>
        MuseumBuddy verwerkt zo min mogelijk persoonsgegevens. We gebruiken geen eigen
        trackingcookies of analytics.
      </p>
      <p>
        Wel kan het voorkomen dat externe partijen, zoals onze affiliatepartners, cookies
        plaatsen om te meten of een bezoek via onze link tot een aankoop of boeking leidt.
        Raadpleeg hun eigen privacybeleid voor meer informatie.
      </p>
      <h2>Welke gegevens wij verwerken</h2>
      <ul>
        <li>
          Technische gegevens die je browser automatisch meestuurt (IP-adres,
          browsertype, tijdstip). Deze gegevens worden uitsluitend gebruikt voor het
          veilig aanbieden van de site en niet voor profilering.
        </li>
        <li>Gegevens die je zelf verstrekt via e-mail of een formulier.</li>
      </ul>
      <h2>Grondslag en doel</h2>
      <p>
        Wij verwerken deze gegevens uitsluitend om de website goed te laten werken,
        vragen te beantwoorden en – indien van toepassing – affiliate inkomsten te kunnen
        ontvangen.
      </p>
      <h2>Bewaartermijnen</h2>
      <p>We bewaren gegevens niet langer dan nodig.</p>
      <h2>Delen met derden</h2>
      <p>
        We delen geen persoonsgegevens met derden, behalve voor hosting (Vercel),
        database (Supabase) en affiliatepartners, voor zover noodzakelijk voor het
        functioneren van de site.
      </p>
      <h2>Cookies</h2>
      <p>
        MuseumBuddy plaatst zelf geen cookies voor marketing of analyse. Onze
        affiliatepartners kunnen dat wel doen zodra je op een affiliate-link klikt. Je
        kunt cookies altijd wissen of blokkeren via je browserinstellingen.
      </p>
      <h2>Jouw rechten</h2>
      <p>
        Je hebt recht op inzage, correctie en verwijdering van jouw persoonsgegevens.
        Mail naar <a className="link-accent" href="mailto:info@museumbuddy.nl">info@museumbuddy.nl</a>.
      </p>
      <h2>Verwerkingsverantwoordelijke</h2>
      <p>
        MuseumBuddy
        <br />
        E-mail:{' '}
        <a className="link-accent" href="mailto:info@museumbuddy.nl">
          info@museumbuddy.nl
        </a>
      </p>
    </>
  );
}

