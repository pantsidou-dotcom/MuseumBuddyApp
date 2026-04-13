import Link from 'next/link';
import SEO from './SEO';
import Button from './ui/Button';

function PracticalSummary({ items }) {
  return (
    <section className="ticket-landing__summary" aria-label="Praktische samenvatting">
      {items.map((item) => (
        <article key={item.label} className="ticket-landing__summary-item">
          <p className="ticket-landing__summary-label">{item.label}</p>
          <p className="ticket-landing__summary-value">{item.value}</p>
        </article>
      ))}
    </section>
  );
}

function QuickInfoBlocks({ blocks }) {
  return (
    <section className="ticket-landing__section" aria-labelledby="ticket-landing-visit-info">
      <h2 id="ticket-landing-visit-info">Wat je wilt weten voor je bezoek</h2>
      <div className="ticket-landing__blocks">
        {blocks.map((block) => (
          <article key={block.title} className="ticket-landing__block">
            <h3>{block.title}</h3>
            <p>{block.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function TicketLandingTemplate({
  title,
  description,
  canonical,
  h1,
  intro,
  primaryCtaLabel,
  primaryCtaHref,
  detailPageHref,
  detailPageLabel,
  practicalItems,
  infoBlocks,
  ticketSectionText,
  affiliateNote,
  structuredData,
}) {
  return (
    <>
      <SEO title={title} description={description} canonical={canonical} structuredData={structuredData} />

      <section className="ticket-landing__hero">
        <h1>{h1}</h1>
        <p>{intro}</p>
        <div className="ticket-landing__hero-actions">
          <Button href={primaryCtaHref} size="lg" className="ticket-landing__cta" rel="sponsored noopener" target="_blank">
            {primaryCtaLabel}
          </Button>
          {detailPageHref ? (
            <Link href={detailPageHref} className="ticket-landing__secondary-link">
              {detailPageLabel}
            </Link>
          ) : null}
        </div>
      </section>

      <PracticalSummary items={practicalItems} />

      <QuickInfoBlocks blocks={infoBlocks} />

      <section className="ticket-landing__section ticket-landing__ticket-box" aria-labelledby="ticket-landing-tickets">
        <h2 id="ticket-landing-tickets">Tickets en beschikbaarheid</h2>
        <p>{ticketSectionText}</p>
        <div className="ticket-landing__hero-actions">
          <Button href={primaryCtaHref} size="lg" className="ticket-landing__cta" rel="sponsored noopener" target="_blank">
            Bekijk actuele ticketopties
          </Button>
          <Button
            href={primaryCtaHref}
            variant="secondary"
            size="lg"
            className="ticket-landing__cta"
            rel="sponsored noopener"
            target="_blank"
          >
            Controleer beschikbaarheid
          </Button>
        </div>
        {affiliateNote ? <p className="ticket-landing__affiliate-note">{affiliateNote}</p> : null}
      </section>

      <section className="ticket-landing__section" aria-labelledby="ticket-landing-more-info">
        <h2 id="ticket-landing-more-info">Meer informatie</h2>
        <ul className="ticket-landing__links">
          <li>
            <Link href={detailPageHref}>Lees meer over het museum</Link>
          </li>
          <li>
            <Link href={detailPageHref}>Bekijk alle praktische informatie</Link>
          </li>
          <li>
            <Link href="/beste-musea-amsterdam">Ontdek meer musea in Amsterdam</Link>
          </li>
        </ul>
      </section>
    </>
  );
}
