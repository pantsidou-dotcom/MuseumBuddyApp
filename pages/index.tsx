import { useState } from 'react';
import MuseumCard from '../components/MuseumCard';
import musea from '../data/musea.json';

interface Museum {
  id: number;
  name: string;
  image: string;
  description: string;
}

export default function Home() {
  const [query, setQuery] = useState('');

  const filteredMusea = (musea as Museum[]).filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Musea</h1>
        <input
          type="text"
          placeholder="Zoek museum..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </header>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMusea.map((museum) => (
          <MuseumCard key={museum.id} {...museum} />
        ))}
      </section>
    </main>
  );
}
