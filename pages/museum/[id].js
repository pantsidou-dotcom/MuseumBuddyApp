import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';

export default function MuseumPage({ museum, error }) {
  if (error) {
    return (
      <>
        <p><Link className="backlink" href="/">&larr; Terug naar overzicht</Link></p>
        <h1 className="detail-title">Museum niet gevonden</h1>
        <p className="detail-sub">{error}</p>
      </>
    );
  }

  if (!museum) {
    return (
      <>
        <p><Link className="backlink" href="/">&larr; Terug naar overzicht</Link></p>
        <h1 className="detail-title">Museum niet gevonden</h1>
        <p className="detail-sub">Controleer de link of ga terug naar het overzicht.</p>
      </>
    );
  }

  return (
    <>
      <p><Link className="backlink" href="/">&larr; Terug naar overzicht</Link></p>
      <h1 className="detail-title">{museum.title}</h1>
      <p className="detail-sub">{museum.city}</p>

    {museum.image && (
      <div className="hero">
        <Image
          src={museum.image.startsWith('/') ? museum.image : `/${museum.image}`}
          alt={museum.title}
          fill
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
      </div>
    )}
      {museum.description && (
        <p className="description" style={{ marginTop: 16 }}>
          {museum.description}
        </p>
      )}

      {museum.url && (
        <p style={{ marginTop: 16 }}>
          <a className="link-accent" href={museum.url} target="_blank" rel="noreferrer">Website openen</a>
        </p>
      )}
    </>
  );
}

export async function getServerSideProps({ params }) {
  if (!supabase) {
    const errorMsg =
      'Supabase client not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.';
    console.error('[Supabase] detail client error:', errorMsg);
    return { props: { museum: null, error: errorMsg } };
  }

  const { data, error } = await supabase
    .from('musea')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error) {
    console.error('[Supabase] detail query error:', error.message);
  }

  const museum = data
    ? {
        id: data.id,
        title: data.naam,
        city: data.stad || '',
        description: data.beschrijving || data.description || '',
        url: data.website_url || data.url || '',
        image: data.image || data.image_url || '',
      }
    : null;

  return { props: { museum, error: error ? error.message : null } };
}
