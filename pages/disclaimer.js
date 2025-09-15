import Head from 'next/head';

export default function DisclaimerPage() {
  return (
    <>
      <Head>
        <title>Algemene voorwaarden & Disclaimer - MuseumBuddy</title>
        <meta
          name="description"
          content="Lees de algemene voorwaarden en disclaimer van MuseumBuddy."
        />
      </Head>
      <h1 className="page-title">Algemene voorwaarden & Disclaimer</h1>
      <p>
        MuseumBuddy streeft naar actuele en juiste informatie, maar kan niet garanderen
        dat alle gegevens volledig of foutloos zijn. Het gebruik van de informatie is
        volledig voor eigen risico van de gebruiker.
      </p>
      <p>
        MuseumBuddy is niet aansprakelijk voor directe of indirecte schade die ontstaat
        door het gebruik van deze website of door informatie van externe websites waarnaar
        wordt gelinkt.
      </p>
      <p>
        Alle inhoud op deze website is auteursrechtelijk beschermd. Niets mag zonder
        voorafgaande schriftelijke toestemming worden gekopieerd of verspreid.
      </p>
      <p>
        MuseumBuddy werkt samen met Supabase, Vercel en diverse affiliatepartners. Sommige
        links op deze website zijn affiliate-links. Dit betekent dat wij een kleine
        commissie kunnen ontvangen als je via zo’n link iets boekt of koopt, zonder extra
        kosten voor jou.
      </p>
      <p>
        Deze website is uitsluitend bedoeld als informatieve gids. Je blijft altijd zelf
        verantwoordelijk voor je keuzes, boekingen en het controleren van actuele
        gegevens bij de betreffende musea of aanbieders.
      </p>
      <p>
        Op deze voorwaarden is uitsluitend Nederlands recht van toepassing. Geschillen
        worden voorgelegd aan de bevoegde rechter in Nederland.
      </p>
      <p>
        MuseumBuddy kan deze voorwaarden wijzigen. De meest actuele versie is altijd te
        vinden op deze website.
      </p>
      <p>
        Voor vragen kun je mailen naar{' '}
        <a className="link-accent" href="mailto:info@museumbuddy.nl">
          info@museumbuddy.nl
        </a>
      </p>
    </>
  );
}

