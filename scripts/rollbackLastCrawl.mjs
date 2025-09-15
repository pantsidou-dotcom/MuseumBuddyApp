import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ Missing SUPABASE_URL or service role key environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function fetchLatestCrawlTimestamp() {
  const { data, error } = await supabase
    .from('exposities')
    .select('last_crawled_at')
    .not('last_crawled_at', 'is', null)
    .order('last_crawled_at', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Could not fetch latest crawl timestamp: ${error.message}`);
  }

  return data && data.length > 0 ? data[0].last_crawled_at : null;
}

async function countRowsWithTimestamp(timestamp) {
  const { count, error } = await supabase
    .from('exposities')
    .select('*', { head: true, count: 'exact' })
    .eq('last_crawled_at', timestamp);

  if (error) {
    throw new Error(`Could not count rows for timestamp ${timestamp}: ${error.message}`);
  }

  return count || 0;
}

async function deleteRowsWithTimestamp(timestamp) {
  const { data, error } = await supabase
    .from('exposities')
    .delete()
    .eq('last_crawled_at', timestamp)
    .select('id');

  if (error) {
    throw new Error(`Deleting rows for timestamp ${timestamp} failed: ${error.message}`);
  }

  return data ? data.length : 0;
}

async function main() {
  console.log('🔍 Looking up latest crawler results...');
  const latestTimestamp = await fetchLatestCrawlTimestamp();

  if (!latestTimestamp) {
    console.log('ℹ️  No crawler results found with a last_crawled_at value.');
    return;
  }

  const rowCount = await countRowsWithTimestamp(latestTimestamp);

  if (rowCount === 0) {
    console.log(`ℹ️  No rows found for timestamp ${latestTimestamp}. Nothing to remove.`);
    return;
  }

  console.log(`🗑️  Removing ${rowCount} rows from last crawl at ${latestTimestamp}...`);
  const removedCount = await deleteRowsWithTimestamp(latestTimestamp);

  console.log(`✅ Removed ${removedCount} rows created at ${latestTimestamp}.`);
}

main().catch((err) => {
  console.error('❌ Failed to rollback last crawl:', err.message);
  process.exit(1);
});
