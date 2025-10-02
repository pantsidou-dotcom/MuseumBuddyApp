import { Suspense } from 'react';
import HomePageClient from '../components/HomePageClient.jsx';
import { supabase as supabaseClient } from '../lib/supabase';
import {
  BASE_MUSEUM_COLUMNS,
  OPTIONAL_MUSEUM_COLUMNS,
  sortMuseums,
} from '../lib/homepageConfig';

export const revalidate = 1800;

async function fetchInitialMuseums() {
  if (!supabaseClient) {
    return { initialMuseums: [], initialError: 'missingSupabase' };
  }

  try {
    const columnsWithOptional = `${BASE_MUSEUM_COLUMNS}, ${OPTIONAL_MUSEUM_COLUMNS}`;

    let { data, error } = await supabaseClient
      .from('musea')
      .select(columnsWithOptional)
      .order('naam', { ascending: true });

    if (error && error.message && /column|identifier|relationship/i.test(error.message)) {
      ({ data, error } = await supabaseClient
        .from('musea')
        .select(BASE_MUSEUM_COLUMNS)
        .order('naam', { ascending: true }));
    }

    if (error) {
      return { initialMuseums: [], initialError: 'queryFailed' };
    }

    const filtered = (data || []).filter((m) => m.slug !== 'amsterdam-tulip-museum-amsterdam');
    return { initialMuseums: sortMuseums(filtered), initialError: null };
  } catch (err) {
    return { initialMuseums: [], initialError: 'unknown' };
  }
}

export default async function Page() {
  const { initialMuseums, initialError } = await fetchInitialMuseums();
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" aria-live="polite" />}>
      <HomePageClient initialMuseums={initialMuseums} initialError={initialError} />
    </Suspense>
  );
}
