import { loadExhibitions } from '../../lib/exhibitions';
import { createServerSupabaseClient } from '../../lib/supabaseServer';

function resolveStatus(error) {
  if (!error) {
    return 200;
  }

  if (error === 'missingSupabase') {
    return 503;
  }

  if (error === 'queryFailed' || error === 'museumQueryFailed') {
    return 502;
  }

  if (error === 'apiFailed') {
    return 502;
  }

  return 500;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'methodNotAllowed', exhibitions: [] });
  }

  const serverSupabase = createServerSupabaseClient();
  const { exhibitions, error } = await loadExhibitions(serverSupabase);

  const status = resolveStatus(error);

  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
  return res.status(status).json({ exhibitions, error });
}
