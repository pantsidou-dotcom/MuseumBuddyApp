import Head from 'next/head';

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacyverklaring - MuseumBuddy</title>
        <meta name="description" content="Lees hoe MuseumBuddy met jouw persoonsgegevens omgaat." />
      </Head>
      <h1 className="page-title">Privacyverklaring</h1>
      <p>
        Bij MuseumBuddy nemen we jouw privacy serieus. In deze privacyverklaring leggen we uit welke
        persoonsgegevens we verzamelen en hoe we deze gebruiken.
      </p>
      <h2>Welke gegevens verzamelen wij?</h2>
      <p>
        We verzamelen alleen persoonsgegevens die je zelf aan ons verstrekt, bijvoorbeeld wanneer je
        contact met ons opneemt via e-mail.
      </p>
      <h2>Waarvoor gebruiken wij je gegevens?</h2>
      <p>
        De gegevens gebruiken wij uitsluitend om je vragen te beantwoorden en om onze dienst te
        verbeteren.
      </p>
      <h2>Hoe lang bewaren wij je gegevens?</h2>
      <p>
        Wij bewaren je gegevens niet langer dan noodzakelijk is voor het doel waarvoor ze zijn
        verzameld.
      </p>
      <h2>Contactgegevens</h2>
      <p>
        MuseumBuddy B.V.<br />
        Keizersgracht 123<br />
        1015 CJ Amsterdam<br />
        Nederland<br />
        E-mail: info@museumbuddy.nl<br />
        KvK-nummer: 12345678
      </p>
      <h2>Wijzigingen</h2>
      <p>
        Deze privacyverklaring kan van tijd tot tijd worden gewijzigd. Controleer deze pagina daarom
        regelmatig voor updates.
      </p>
    </>
  );
}

