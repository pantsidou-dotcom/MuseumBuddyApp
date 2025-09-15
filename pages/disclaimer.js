import Head from 'next/head';

export default function DisclaimerPage() {
  return (
    <>
      <Head>
        <title>Disclaimer</title>
      </Head>

      <h1 className="page-title">Disclaimer</h1>

      <section>
        <h2>Algemene voorwaarden</h2>
        <p>
          Door deze website te gebruiken gaat u akkoord met de algemene
          voorwaarden van Museum Buddy. De informatie op deze website kan te
          allen tijde worden gewijzigd zonder voorafgaande kennisgeving.
        </p>
      </section>

      <section>
        <h2>Aansprakelijkheidsdisclaimer</h2>
        <p>
          De inhoud van deze site is met de grootst mogelijke zorg samengesteld.
          Desondanks kan het voorkomen dat informatie onvolledig of onjuist is.
          Gebruik van de geboden informatie is volledig voor eigen risico.
          Museum Buddy aanvaardt geen aansprakelijkheid voor eventuele
          schade die ontstaat door het gebruik van deze website.
        </p>
      </section>

      <section>
        <h2>Affiliate disclaimer</h2>
        <p>
          Sommige links op deze website zijn affiliate links. Wanneer u via een
          dergelijke link een aankoop doet, kan Museum Buddy een commissie
          ontvangen zonder extra kosten voor u. Deze inkomsten helpen ons de
          website te onderhouden.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Heeft u vragen? Neem dan contact met ons op via
          {' '}
          <a href="mailto:info@museumbuddy.app">info@museumbuddy.app</a>.
        </p>
        <p>KvK-nummer: 12345678</p>
      </section>
    </>
  );
}

