import { Suspense } from 'react';
import ExhibitionsPageClient from '../../components/ExhibitionsPageClient.jsx';
import { supabase as supabaseClient } from '../../lib/supabase';
import { normaliseExpositionRow } from '../../lib/expositionsUtils';
import { todayYMD } from '../../lib/homepageConfig';

export const revalidate = 900;

export const metadata = {
  title: 'Tentoonstellingen in Amsterdam | MuseumBuddy',
  description:
    'Bekijk actuele tentoonstellingen in Amsterdam en filter op gratis, kindvriendelijk en tijdelijke exposities.',
  openGraph: {
    title: 'Tentoonstellingen in Amsterdam | MuseumBuddy',
    description:
      'Bekijk actuele tentoonstellingen in Amsterdam en filter op gratis, kindvriendelijk en tijdelijke exposities.',
    type: 'website',
    url: 'https://museumbuddy.nl/exhibitions',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tentoonstellingen in Amsterdam | MuseumBuddy',
    description:
      'Bekijk actuele tentoonstellingen in Amsterdam en filter op gratis, kindvriendelijk en tijdelijke exposities.',
  },
};

async function fetchExhibitions() {
  if (!supabaseClient) {
    return { exhibitions: [], supabaseAvailable: false };
  }

  try {
    const today = todayYMD('Europe/Amsterdam');
    let expoQuery = supabaseClient
      .from('exposities')
      .select(
        'id, titel, start_datum, eind_datum, bron_url, beschrijving, omschrijving, gratis, free, kosteloos, freeEntry, kindvriendelijk, childFriendly, familievriendelijk, familyFriendly, tijdelijk, temporary, tijdelijkeTentoonstelling, temporaryExhibition, ticket_affiliate_url, ticket_url, museum_id'
      )
      .order('start_datum', { ascending: true });

    if (today) {
      expoQuery = expoQuery.or(`eind_datum.gte.${today},eind_datum.is.null`);
    }

    const { data: expoRows, error: expoError } = await expoQuery;

    if (expoError) {
      return { exhibitions: [], supabaseAvailable: false };
    }

    const museumIds = new Set();
    (expoRows || []).forEach((row) => {
      if (row?.museum_id) {
        museumIds.add(row.museum_id);
      }
    });

    let museumsMap = new Map();

    if (museumIds.size > 0) {
      const { data: museumRows, error: museumError } = await supabaseClient
        .from('musea')
        .select('id, naam, slug, ticket_affiliate_url, ticket_url')
        .in('id', Array.from(museumIds));

      if (!museumError && Array.isArray(museumRows)) {
        museumsMap = new Map(museumRows.map((museum) => [museum.id, museum]));
      }
    }

    const exhibitions = (expoRows || [])
      .map((row) => {
        const museum = museumsMap.get(row.museum_id) || null;
        const normalised = normaliseExpositionRow(row, museum?.slug);
        if (!normalised) return null;
        return {
          ...normalised,
          museumName: museum?.naam || null,
          museumTicketAffiliateUrl: museum?.ticket_affiliate_url || null,
          museumTicketUrl: museum?.ticket_url || null,
        };
      })
      .filter(Boolean);

    return { exhibitions, supabaseAvailable: true };
  } catch (error) {
    return { exhibitions: [], supabaseAvailable: false };
  }
}

export default async function ExhibitionsPage() {
  const { exhibitions, supabaseAvailable } = await fetchExhibitions();

  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" aria-live="polite" />}> 
      <ExhibitionsPageClient
        initialExhibitions={exhibitions}
        supabaseAvailable={supabaseAvailable}
      />
    </Suspense>
  );
}
