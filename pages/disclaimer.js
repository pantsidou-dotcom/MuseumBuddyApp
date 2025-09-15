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
        MuseumBuddy streeft naar actuele en juiste informatie, maar kan niet garanderen dat alle gegevens volledig of foutloos zijn.
      </p>
      <p>
        MuseumBuddy is niet aansprakelijk voor directe of indirecte schade die ontstaat door het gebruik van deze website of door informatie van externe websites waarnaar wordt gelinkt.
      </p>
      <p>
        Alle inhoud is auteursrechtelijk beschermd. Niets mag zonder toestemming worden gekopieerd of verspreid.
      </p>
      <p>
        Wij werken samen met Supabase, Vercel en affiliate partners.
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

