import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ScrollButton } from '@/components/ScrollButton';
import { EntityGrid } from '@/components/EntityGrid';
import { mapMuseumToCardData } from '@/lib/adapters';
import { museums } from '@/lib/data/museums';


export const metadata: Metadata = {
  title: 'Ontdek musea in Amsterdam',
  description:
    'Bekijk een zorgvuldig samengestelde lijst met musea in Amsterdam. Filter op sfeer, ontdek highlights en plan jouw culturele dag uit.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Ontdek musea in Amsterdam',
    description:
      'Blader door de beste musea van Amsterdam en vind snel welke bij jou past met MuseumBuddy.',
  },
};

function HeroActions() {
  return (
    <div className="flex flex-wrap gap-4">
      <ScrollButton
        targetId="musea"
        label="Ontdek musea"
        className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-ink focus-visible:outline focus-visible:outline-brand"
      />
      <Link
        href="/tentoonstellingen"
        prefetch
        className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-brand"
      >
        Bekijk tentoonstellingen
      </Link>
    </div>
  );
}

function Hero() {
  return (
    <header className="rounded-3xl bg-white px-6 py-10 shadow-card md:px-10" aria-labelledby="hero-heading">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">MuseumBuddy</p>
          <h1 id="hero-heading" className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
            De slimste start voor je volgende museumbezoek
          </h1>
          <p className="text-base text-slate-600">
            Ontdek in een oogopslag welke musea nu de moeite waard zijn. Met korte samenvattingen, heldere labels en directe
            doorklik naar tickets.
          </p>
        </div>
        <HeroActions />
      </div>
    </header>
  );
}

function MuseaSection() {
  const items = museums.map(mapMuseumToCardData);

  return (
    <section id="musea" className="scroll-mt-24 space-y-6" aria-labelledby="musea-heading" tabIndex={-1}>
      <div className="flex flex-col gap-2">
        <h2 id="musea-heading" className="text-2xl font-semibold text-slate-900">
          Musea in Amsterdam
        </h2>
        <p className="text-sm text-slate-600">
          Een actuele selectie van 12 musea: van publieksfavorieten tot verborgen parels, altijd met praktische informatie binnen handbereik.
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-slate-500">Laden...</div>}>
        <EntityGrid gridLabel="Musea" items={items} />
      </Suspense>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="flex flex-col gap-12" role="main">
      <Hero />
      <MuseaSection />
    </main>
  );
}
