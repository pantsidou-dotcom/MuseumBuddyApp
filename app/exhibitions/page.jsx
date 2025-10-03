import { Suspense } from 'react';
import ExhibitionsPageClient from '../../components/ExhibitionsPageClient.jsx';
import { supabase as supabaseClient } from '../../lib/supabase';
import { normaliseExpositionRow } from '../../lib/expositionsUtils';
import { todayYMD } from '../../lib/homepageConfig';
import museumTicketUrls from '../../lib/museumTicketUrls';
import resolveMuseumSlug from '../../lib/resolveMuseumSlug';
import museumImages from '../../lib/museumImages';
import museumImageCredits from '../../lib/museumImageCredits';
import museumOpeningHours from '../../lib/museumOpeningHours';
import FALLBACK_MUSEUMS from '../../lib/museumFallbackData';

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
        const rawMuseumName =
          museum?.naam || row?.museum_naam || row?.museumName || row?.museum || null;
        const slugCandidates = [
          museum?.slug,
          row?.museum_slug,
          row?.museumSlug,
          row?.museum_slug_current,
          row?.museumSlugCurrent,
          normalised.museumSlug,
          row?.slug,
        ];
        let canonicalSlug = null;
        for (const candidate of slugCandidates) {
          canonicalSlug = resolveMuseumSlug(candidate, rawMuseumName);
          if (canonicalSlug) break;
        }
        if (!canonicalSlug) {
          canonicalSlug = resolveMuseumSlug(null, rawMuseumName);
        }

        const fallbackMuseum = canonicalSlug
          ? FALLBACK_MUSEUMS.find((item) => item.slug === canonicalSlug)
          : null;

        const city =
          row?.stad ||
          row?.city ||
          row?.museum_stad ||
          row?.museumCity ||
          fallbackMuseum?.stad ||
          null;
        const province =
          row?.provincie ||
          row?.province ||
          row?.museum_provincie ||
          row?.museumProvince ||
          fallbackMuseum?.provincie ||
          null;

        const normalisedOpeningHours = (() => {
          const candidate =
            row?.openingstijden ||
            row?.openingHours ||
            row?.opening_hours ||
            row?.museum_openingstijden ||
            row?.museumOpeningHours ||
            null;

          if (!candidate) return null;

          if (typeof candidate === 'string') {
            const trimmed = candidate.trim();
            if (!trimmed) return null;
            return { en: trimmed, nl: trimmed };
          }

          if (typeof candidate === 'object') {
            const enValue =
              candidate.en ||
              candidate.En ||
              candidate.EN ||
              candidate.english ||
              candidate.nl ||
              candidate.NL ||
              null;
            const nlValue =
              candidate.nl ||
              candidate.NL ||
              candidate.en ||
              candidate.En ||
              candidate.EN ||
              null;

            if (enValue || nlValue) {
              return {
                en: enValue || nlValue || null,
                nl: nlValue || enValue || null,
              };
            }
          }

          return null;
        })();

        const fallbackOpeningHours = canonicalSlug
          ? museumOpeningHours[canonicalSlug] || null
          : null;
        const openingHours = normalisedOpeningHours
          ? normalisedOpeningHours
          : fallbackOpeningHours
          ? {
              en: fallbackOpeningHours.en || fallbackOpeningHours.nl || null,
              nl: fallbackOpeningHours.nl || fallbackOpeningHours.en || null,
            }
          : null;

        const affiliateTicketUrl =
          normalised.ticketAffiliateUrl ||
          museum?.ticket_affiliate_url ||
          fallbackMuseum?.ticket_affiliate_url ||
          (canonicalSlug ? museumTicketUrls[canonicalSlug] : null);
        const defaultTicketUrl =
          normalised.ticketUrl ||
          museum?.ticket_url ||
          fallbackMuseum?.website_url ||
          (canonicalSlug ? museumTicketUrls[canonicalSlug] : null);

        const canonicalImage = canonicalSlug ? museumImages[canonicalSlug] || null : null;
        const canonicalCredit = canonicalSlug ? museumImageCredits[canonicalSlug] || null : null;

        return {
          ...normalised,
          museumSlug: canonicalSlug || normalised.museumSlug || null,
          museumName: rawMuseumName || fallbackMuseum?.naam || null,
          museumTicketAffiliateUrl: affiliateTicketUrl || null,
          museumTicketUrl: defaultTicketUrl || null,
          museumImage: canonicalImage,
          museumImageCredit: canonicalCredit,
          museumCity: city || null,
          museumProvince: province || null,
          museumOpeningHours: openingHours,
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
