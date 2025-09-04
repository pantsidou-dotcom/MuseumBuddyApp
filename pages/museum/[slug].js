import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

function formatDate(d) {
  if (!d) return '';
  try {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return d;
  }
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

  return (
    <>
      <Head>
        <title>{museum?.naam ? `${museum.naam} — MuseumBuddy` : 'Museum — MuseumBuddy'}</title>
        <meta name="description" content={`Informatie en exposities van ${museum?.naam || 'museum'}.`} />
      </Head>

      <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
        <h1 style={{ margin: '0 0 0.25rem' }}>{museum.naam}</h1>
        <p style={{ marginTop: 0, color: '#666' }}>
          {[museum.stad, museum.provincie].filter(Boolean).join(', ')}
        </p>

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
          <p>Geen exposities gevonden.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {exposities.map((e) => {
              const periode = [formatDate(e.start_datum), formatDate(e.eind_datum)]
                .filter(Boolean)
                .join(' – ');
              const inhoud = (
                <div>
                  <div style={{ fontWeight: 600 }}>{e.titel}</div>
                  <div style={{ color: '#666', fontSize: 14 }}>{periode}</div>
                </div>
              );
              return (
                <li key={e.id} style={{ borderBottom: '1px solid #eee', padding: '0.75rem 0' }}>
                  {e.bron_url ? (
                    <a
                      href={e.bron_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {inhoud}
                    </a>
                  ) : (
                    inhoud
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <a href="/" style={{ display: 'inline-block', marginTop: '1rem' }}>
          &larr; Terug
        </a>
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

  const { data: exposities, error: exError } = await supabase
    .from('exposities')
    .select('id, titel, start_datum, eind_datum, bron_url')
    .eq('museum_id', museum.id)
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

