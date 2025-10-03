import type { Metadata } from 'next';
import { EntityGrid } from '@/components/EntityGrid';
import { mapExhibitionToCardData } from '@/lib/adapters';
import { exhibitions } from '@/lib/data/exhibitions';
import { museumsById } from '@/lib/data/museums';

export const metadata: Metadata = {
  title: 'Tentoonstellingen in Amsterdam',
  description:
    'Alle actuele tentoonstellingen van Amsterdamse musea in één overzicht. Bekijk highlights, tags en plan je bezoek direct.',
  alternates: {
    canonical: '/tentoonstellingen',
  },
  openGraph: {
    title: 'Tentoonstellingen in Amsterdam',
    description:
      'Alle actuele tentoonstellingen van Amsterdamse musea in één overzicht. Bekijk highlights, tags en plan je bezoek direct.',
    url: '/tentoonstellingen',
  },
};

function ExhibitionsHero() {
  return (
    <header className="rounded-3xl bg-white px-6 py-10 shadow-card md:px-10" aria-labelledby="tentoonstellingen-heading">
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Nu te zien</p>
        <h1 id="tentoonstellingen-heading" className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
          Tentoonstellingen die je niet wilt missen
        </h1>
        <p className="text-base text-slate-600">
          Van interactieve wetenschap tot meeslepende kunstinstallaties: ontdek wat er nu speelt per museum en klik meteen door naar meer informatie.
        </p>
      </div>
    </header>
  );
}

export default function ExhibitionsPage() {
  const items = exhibitions.map((exhibition) => mapExhibitionToCardData(exhibition, museumsById));

  return (
    <main className="flex flex-col gap-12">
      <ExhibitionsHero />
      <section className="space-y-6" aria-labelledby="exhibition-grid-heading">
        <div className="flex flex-col gap-2">
          <h2 id="exhibition-grid-heading" className="text-2xl font-semibold text-slate-900">
            Alle tentoonstellingen
          </h2>
          <p className="text-sm text-slate-600">
            Dezelfde kaartopmaak als de homepage, zodat je intuïtief kunt vergelijken en plannen.
          </p>
        </div>
        <EntityGrid gridLabel="Tentoonstellingen" items={items} />
      </section>
    </main>
  );
}
