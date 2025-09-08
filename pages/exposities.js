import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import ExpositionCard from '../components/ExpositionCard';

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

export default function Exposities({ exposities, error }) {
  if (error) {
    return (
      <>
        <Head>
          <title>Exposities — MuseumBuddy</title>
        </Head>
        <p>Er ging iets mis</p>
        <a href="/" style={{ display: 'inline-block', marginTop: '1rem' }}>&larr; Terug</a>
      </>
    );
  }

  const todayStr = todayYMD('Europe/Amsterdam');
  const today = new Date(todayStr + 'T00:00:00');

  return (
    <>
      <Head>
        <title>Exposities — MuseumBuddy</title>
        <meta name="description" content="Overzicht van lopende en komende exposities." />
      </Head>
      <h1 className="page-title">Exposities</h1>
      {!exposities || exposities.length === 0 ? (
        <p>Geen lopende of komende exposities.</p>
      ) : (
        <ul className="exposition-list">
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
    </>
  );
}

export async function getServerSideProps() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return { props: { exposities: [], error: true } };
  }

  const supabase = createClient(url, anon);
  const today = todayYMD('Europe/Amsterdam');

  const { data, error } = await supabase
    .from('exposities')
    .select('id, titel, start_datum, eind_datum, bron_url')
    .or(`eind_datum.gte.${today},eind_datum.is.null`)
    .order('start_datum', { ascending: true, nullsFirst: false });

  if (error) {
    return { props: { exposities: [], error: true } };
  }

  return {
    props: {
      exposities: data || [],
      error: false,
    },
  };
}

