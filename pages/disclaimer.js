import SEO from '../components/SEO';
import { useLanguage } from '../components/LanguageContext';

export default function DisclaimerPage() {
  const { lang } = useLanguage();
  const title =
    lang === 'en'
      ? 'Terms & Disclaimer - MuseumBuddy'
      : 'Algemene voorwaarden & Disclaimer - MuseumBuddy';
  const description =
    lang === 'en'
      ? 'Read the terms and disclaimer of MuseumBuddy.'
      : 'Lees de algemene voorwaarden en disclaimer van MuseumBuddy.';
  return (
    <>
      <SEO title={title} description={description} />
      {lang === 'en' ? (
        <>
          <h1 className="page-title">Terms & Disclaimer</h1>
          <p>
            MuseumBuddy strives to provide current and accurate information but cannot
            guarantee that all data is complete or error-free. Use of the information is
            entirely at your own risk.
          </p>
          <p>
            MuseumBuddy is not liable for direct or indirect damages arising from the
            use of this website or information from external websites to which it links.
          </p>
          <p>
            All content on this website is protected by copyright. Nothing may be
            copied or distributed without prior written permission.
          </p>
          <p>
            MuseumBuddy collaborates with Supabase, Vercel and various affiliate
            partners. Some links on this website are affiliate links. This means we may
            receive a small commission if you book or buy something through such a link,
            at no extra cost to you.
          </p>
          <p>
            This website is intended solely as an informative guide. You remain
            responsible for your choices, bookings and for checking up-to-date
            information with the relevant museums or providers.
          </p>
          <p>
            These terms are governed exclusively by Dutch law. Disputes will be
            submitted to the competent court in the Netherlands.
          </p>
          <p>
            MuseumBuddy may change these terms. The most current version can always be
            found on this website.
          </p>
          <p>
            For questions you can email{' '}
            <a className="link-accent" href="mailto:info@museumbuddy.nl">
              info@museumbuddy.nl
            </a>
          </p>
        </>
      ) : (
        <>
          <h1 className="page-title">Algemene voorwaarden & Disclaimer</h1>
          <p>
            MuseumBuddy streeft naar actuele en juiste informatie, maar kan niet
            garanderen dat alle gegevens volledig of foutloos zijn. Het gebruik van de
            informatie is volledig voor eigen risico van de gebruiker.
          </p>
          <p>
            MuseumBuddy is niet aansprakelijk voor directe of indirecte schade die
            ontstaat door het gebruik van deze website of door informatie van externe
            websites waarnaar wordt gelinkt.
          </p>
          <p>
            Alle inhoud op deze website is auteursrechtelijk beschermd. Niets mag zonder
            voorafgaande schriftelijke toestemming worden gekopieerd of verspreid.
          </p>
          <p>
            MuseumBuddy werkt samen met Supabase, Vercel en diverse affiliatepartners.
            Sommige links op deze website zijn affiliate-links. Dit betekent dat wij een
            kleine commissie kunnen ontvangen als je via zo’n link iets boekt of koopt,
            zonder extra kosten voor jou.
          </p>
          <p>
            Deze website is uitsluitend bedoeld als informatieve gids. Je blijft altijd
            zelf verantwoordelijk voor je keuzes, boekingen en het controleren van
            actuele gegevens bij de betreffende musea of aanbieders.
          </p>
          <p>
            Op deze voorwaarden is uitsluitend Nederlands recht van toepassing.
            Geschillen worden voorgelegd aan de bevoegde rechter in Nederland.
          </p>
          <p>
            MuseumBuddy kan deze voorwaarden wijzigen. De meest actuele versie is
            altijd te vinden op deze website.
          </p>
          <p>
            Voor vragen kun je mailen naar{' '}
            <a className="link-accent" href="mailto:info@museumbuddy.nl">
              info@museumbuddy.nl
            </a>
          </p>
        </>
      )}
    </>
  );
}

