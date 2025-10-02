import { Suspense } from 'react';
import ExhibitionsPageClient from '../../components/ExhibitionsPageClient.jsx';
import { supabase as supabaseClient } from '../../lib/supabase';
import { normaliseExpositionRow } from '../../lib/expositionsUtils';
import { todayYMD } from '../../lib/homepageConfig';
import museumTicketUrls from '../../lib/museumTicketUrls';
import resolveMuseumSlug from '../../lib/resolveMuseumSlug';

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
    const { data: expoRows, error: expoError } = await supabaseClient
      .from('exposities')
      .select('*');

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

    const today = todayYMD('Europe/Amsterdam');

    const exhibitions = (expoRows || [])
      .map((row) => {
        const museum = museumsMap.get(row.museum_id) || null;
        const normalised = normaliseExpositionRow(row, museum?.slug);
        if (!normalised) return null;
        const canonicalSlug = resolveMuseumSlug(normalised.museumSlug, museum?.naam || row?.museum_naam);
        const affiliateTicketUrl =
          normalised.ticketAffiliateUrl ||
          museum?.ticket_affiliate_url ||
          (canonicalSlug ? museumTicketUrls[canonicalSlug] : null);
        return {
          ...normalised,
          museumSlug: canonicalSlug || normalised.museumSlug || null,
          museumName: museum?.naam || null,
          museumTicketAffiliateUrl: affiliateTicketUrl || null,
          museumTicketUrl: museum?.ticket_url || null,
        };
      })
      .filter(Boolean)
      .filter((expo) => {
        if (!today) return true;
        if (expo.eind_datum && expo.eind_datum < today) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aStart = a.start_datum || '';
        const bStart = b.start_datum || '';
        if (aStart && bStart) {
          return aStart.localeCompare(bStart);
        }
        if (aStart) return -1;
        if (bStart) return 1;
        return String(a.titel).localeCompare(String(b.titel));
      });

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
