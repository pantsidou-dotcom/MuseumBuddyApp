import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase as supabaseClient } from '../../lib/supabase';
import SEO from '../../components/SEO';
import { useLanguage } from '../../components/LanguageContext';

export default function MuseumDetail() {
  const router = useRouter();
  const { t } = useLanguage();
  const { slug } = router.query || {};
  const [museum, setMuseum] = useState(null);
  const [exposities, setExposities] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!router.isReady || !slug) return;
    if (!supabaseClient) {
      setError('missingSupabase');
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const { data: museum, error: museumError } = await supabaseClient
          .from('musea')
          .select('id, naam, stad, provincie, website_url, ticket_affiliate_url, slug')
          .eq('slug', slug)
          .single();

        if (museumError) {
          if (!cancelled) setError('notFound');
          return;
        }

        const { data: exRows } = await supabaseClient
          .from('exposities')
          .select('id, titel, begin_datum, eind_datum')
          .eq('museum_id', museum.id);

        if (!cancelled) {
          setMuseum(museum);
          setExposities(exRows || []);
          setError(null);
        }
      } catch {
        if (!cancelled) setError('unknown');
      }
    };

    load();
    return () => { cancelled = true; };
  }, [router.isReady, slug]);

  if (error === 'notFound') {
    return (
      <main className="container" style={{ maxWidth: 800 }}>
        <h1>{t('notFound') || 'Not found'}</h1>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container" style={{ maxWidth: 800 }}>
        <p>{t('somethingWrong')}</p>
      </main>
    );
  }

  if (!museum) {
    return (
      <main className="container" style={{ maxWidth: 800 }}>
        <p>{t('loading') || 'Loading...'}</p>
      </main>
    );
  }

  return (
    <>
      <SEO title={museum.naam} description={museum.naam} />
      <main className="container" style={{ maxWidth: 800 }}>
        <h1>{museum.naam}</h1>
        <p>
          {museum.stad}, {museum.provincie}
        </p>

        {exposities.length > 0 ? (
          <>
            <h2>{t('expositions')}</h2>
            <ul>
              {exposities.map((e) => (
                <li key={e.id}>
                  {e.titel} — {e.begin_datum} / {e.eind_datum || 'open eind'}
