import Head from 'next/head';
import { useLanguage } from '../components/LanguageContext';

export default function PrivacyPage() {
  const { lang } = useLanguage();
  return (
    <>
      <Head>
        <title>
          {lang === 'en'
            ? 'Privacy Policy - MuseumBuddy'
            : 'Privacyverklaring - MuseumBuddy'}
        </title>
        <meta
          name="description"
          content={
            lang === 'en'
              ? 'Learn how MuseumBuddy handles your personal data.'
              : 'Lees hoe MuseumBuddy met jouw persoonsgegevens omgaat.'
          }
        />
      </Head>
      {lang === 'en' ? (
        <>
          <h1 className="page-title">Privacy Policy</h1>
          <p>
            MuseumBuddy processes as little personal data as possible. We do not use
            our own tracking cookies or analytics.
          </p>
          <p>
            However, external parties, such as our affiliate partners, may place
            cookies to measure whether a visit through our link leads to a purchase or
            reservation. Consult their own privacy policies for more information.
          </p>
          <h2>What data we process</h2>
          <ul>
            <li>
              Technical data automatically sent by your browser (IP address, browser
              type, time). These data are used solely to securely provide the site and
              not for profiling.
            </li>
            <li>Data you provide yourself via email or a form.</li>
          </ul>
          <h2>Legal basis and purpose</h2>
          <p>
            We process this data only to operate the website properly, answer
            questions and, where applicable, to receive affiliate income.
          </p>
          <h2>Retention periods</h2>
          <p>We do not store data longer than necessary.</p>
          <h2>Sharing with third parties</h2>
          <p>
            We do not share personal data with third parties, except for hosting
            (Vercel), database (Supabase) and affiliate partners, insofar as necessary
            for the functioning of the site.
          </p>
          <h2>Cookies</h2>
          <p>
            MuseumBuddy itself does not place cookies for marketing or analysis. Our
            affiliate partners may do so once you click an affiliate link. You can
            always delete or block cookies via your browser settings.
          </p>
          <h2>Your rights</h2>
          <p>
            You have the right to access, rectify and delete your personal data. Email
            <a className="link-accent" href="mailto:info@museumbuddy.nl">
              info@museumbuddy.nl
            </a>
            .
          </p>
          <h2>Controller</h2>
          <p>
            MuseumBuddy
            <br />
            Email{' '}
            <a className="link-accent" href="mailto:info@museumbuddy.nl">
              info@museumbuddy.nl
            </a>
          </p>
        </>
      ) : (
        <>
          <h1 className="page-title">Privacyverklaring</h1>
          <p>
            MuseumBuddy verwerkt zo min mogelijk persoonsgegevens. We gebruiken geen
            eigen trackingcookies of analytics.
          </p>
          <p>
            Wel kan het voorkomen dat externe partijen, zoals onze affiliatepartners,
            cookies plaatsen om te meten of een bezoek via onze link tot een aankoop of
            boeking leidt. Raadpleeg hun eigen privacybeleid voor meer informatie.
          </p>
          <h2>Welke gegevens wij verwerken</h2>
          <ul>
            <li>
              Technische gegevens die je browser automatisch meestuurt (IP-adres,
              browsertype, tijdstip). Deze gegevens worden uitsluitend gebruikt voor
              het veilig aanbieden van de site en niet voor profilering.
            </li>
            <li>Gegevens die je zelf verstrekt via e-mail of een formulier.</li>
          </ul>
          <h2>Grondslag en doel</h2>
          <p>
            Wij verwerken deze gegevens uitsluitend om de website goed te laten
            werken, vragen te beantwoorden en – indien van toepassing – affiliate
            inkomsten te kunnen ontvangen.
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
            affiliatepartners kunnen dat wel doen zodra je op een affiliate-link
            klikt. Je kunt cookies altijd wissen of blokkeren via je
            browserinstellingen.
          </p>
          <h2>Jouw rechten</h2>
          <p>
            Je hebt recht op inzage, correctie en verwijdering van jouw
            persoonsgegevens. Mail naar{' '}
            <a className="link-accent" href="mailto:info@museumbuddy.nl">
              info@museumbuddy.nl
            </a>
            .
          </p>
          <h2>Verwerkingsverantwoordelijke</h2>
          <p>
            MuseumBuddy
            <br />
            E-mail{' '}
            <a className="link-accent" href="mailto:info@museumbuddy.nl">
              info@museumbuddy.nl
            </a>
          </p>
        </>
      )}
    </>
  );
}

