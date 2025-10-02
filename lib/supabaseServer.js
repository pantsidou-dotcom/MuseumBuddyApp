import { createClient } from '@supabase/supabase-js';

function getServerSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null;
}

function getServerSupabaseKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    null
  );
}

const SHARED_OPTIONS = {
  auth: {
    persistSession: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'museum-buddy-server',
    },
  },
};

export function createServerSupabaseClient() {
  const url = getServerSupabaseUrl();
  const key = getServerSupabaseKey();

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, SHARED_OPTIONS);
}
