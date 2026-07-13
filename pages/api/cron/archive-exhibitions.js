import { createClient } from '@supabase/supabase-js';
import { buildExhibitionArchiveUpdate, DUTCH_TIME_ZONE } from '../../../lib/exhibitionStatus.js';

function isAuthorized(req) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const header = req.headers.authorization || '';
  return header === `Bearer ${expected}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  if (!isAuthorized(req)) return res.status(401).json({ error: 'unauthorized' });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(500).json({ error: 'supabase_not_configured' });

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from('exposities')
    .select('*');

  if (error) return res.status(500).json({ error: 'select_failed' });

  const now = new Date();
  const updatedIds = [];
  const archivedIds = [];

  for (const row of data || []) {
    const update = buildExhibitionArchiveUpdate(row, { now, timeZone: DUTCH_TIME_ZONE });
    const willArchive = update.archived_at && !row.archived_at;
    const { error: updateError } = await supabase.from('exposities').update(update).eq('id', row.id);
    if (updateError) return res.status(500).json({ error: 'update_failed', id: row.id });
    updatedIds.push(row.id);
    if (willArchive) archivedIds.push(row.id);
  }

  console.info('archive-exhibitions cron', { updatedCount: updatedIds.length, archivedCount: archivedIds.length, updatedIds, archivedIds });
  return res.status(200).json({ updatedCount: updatedIds.length, archivedCount: archivedIds.length, updatedIds, archivedIds });
}
