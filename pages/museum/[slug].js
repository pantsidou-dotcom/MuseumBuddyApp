import Head from 'next/head';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import museumImages from '../../lib/museumImages';
import museumNames from '../../lib/museumNames';
import ExpositionCard from '../../components/ExpositionCard';

function formatDate(d) {
  if (!d) return '';
  try {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return d;
  }
}

function todayYMD(tz = 'Europe/Amsterdam') {
  const fmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date());
}

export default function MuseumDetail({ museum, exposities, error }) {
  if (error) {
    return (
      <>
        <Head>
          <title>Museum — MuseumBuddy</title>
        </Head>
        <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
          <p>Er ging iets mis</p>
          <a href="/" style={{ display: 'inline-block', marginTop: '1rem' }}>
            &larr; Terug
          </a>
        </main>
      </>
    );
  }

  const todayStr = todayYMD('Europe/Amsterdam');
  const today = new Date(todayStr + 'T00:00:00');
  const name = museum ? museumNames[museum.slug] || museum.naam : '';

  return (
    <>
      <Head>
        <title>{name ? `${name} — MuseumBuddy` : 'Museum — MuseumBuddy'}</title>
        <meta name="description" content={`Informatie en exposities van ${name || 'museum'}.`} />
      </Head>

      <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
        <a href="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>
          &larr; Terug
        </a>

        <h1 style={{ margin: '0 0 0.25rem' }}>{name}</h1>
        <p style={{ marginTop: 0, color: '#666' }}>
          {[museum.stad, museum.provincie].filter(Boolean).join(', ')}
        </p>

        {museumImages[museum.slug] && (
          <div style={{ position: 'relative', width: '100%', height: 300, margin: '1rem 0' }}>
            <Image
              src={museumImages[museum.slug]}
              alt={name}
              fill
              sizes="(max-width: 800px) 100vw, 800px"
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
          {museum.website_url && (
            <a
              href={museum.website_url}
              target="_blank"
              rel="noreferrer"
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #ddd', borderRadius: 8, textDecoration: 'none' }}
            >
              Website
            </a>
          )}
          {museum.ticket_affiliate_url && (
            <a
              href={museum.ticket_affiliate_url}
              target="_blank"
              rel="noreferrer"
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #ddd', borderRadius: 8, textDecoration: 'none' }}
            >
              Tickets (affiliate)
            </a>
          )}
        </div>

        <h2>Exposities</h2>
        {!exposities || exposities.length === 0 ? (
          <p>Geen lopende of komende exposities.</p>
        ) : (
          <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {exposities.map((e) => {
              const start = e.start_datum ? new Date(e.start_datum + 'T00:00:00') : null;
              const end = e.eind_datum ? new Date(e.eind_datum + 'T00:00:00') : null;

              let status = '';
              if (start && start > today) status = 'Komt eraan';
              else if ((!start || start <= today) && (!end || end >= today)) status = 'Loopt nu';

              const periode = [formatDate(e.start_datum), formatDate(e.eind_datum)]
                .filter(Boolean)
                .join(' – ');

              return (
                <li key={e.id}>
                  <ExpositionCard exposition={e} status={status} periode={periode} />
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}

export async function getServerSideProps(context) {
  const { slug } = context.params || {};
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    context.res.statusCode = 500;
    return { props: { museum: null, exposities: [], error: true } };
  }

  const supabase = createClient(url, anon);

  const { data: museum, error: museumError } = await supabase
    .from('musea')
    .select('id, naam, stad, provincie, website_url, ticket_affiliate_url, slug')
    .eq('slug', slug)
    .single();

  if (museumError) {
    if (museumError.code === 'PGRST116') {
      return { notFound: true };
    }
    context.res.statusCode = 500;
    return { props: { museum: null, exposities: [], error: true } };
  }

  const today = todayYMD('Europe/Amsterdam'); // "YYYY-MM-DD"
  const { data: exposities, error: exError } = await supabase
    .from('exposities')
    .select('id, titel, start_datum, eind_datum, bron_url')
    .eq('museum_id', museum.id)
    .or(`eind_datum.gte.${today},eind_datum.is.null`)
    .order('start_datum', { ascending: true, nullsFirst: false });

  if (exError) {
    context.res.statusCode = 500;
    return { props: { museum: null, exposities: [], error: true } };
  }

  return {
    props: {
      museum,
      exposities: exposities || [],
      error: false,
    },
  };
}
