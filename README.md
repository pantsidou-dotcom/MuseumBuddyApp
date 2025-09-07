# MuseumBuddyApp
![Museum Buddy logo](public/logo.svg)
![CI](https://github.com/<user>/MuseumBuddyApp/actions/workflows/ci.yml/badge.svg)
Deze CI-workflow voert de tests van het project uit zodat de badge de status van de build weergeeft.

## Project Structure



## Environment Variables

To run the app locally:

1. Copy `.env.example` to `.env.local`.
2. Fill in the values for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

These variables are required for the application to connect to Supabase and should also be added to your Vercel project settings for both build and runtime.

## Deduplicate musea table

A helper script is available to remove duplicate `museum_id` entries from the Supabase `musea` table and enforce a `UNIQUE` constraint.

```
export SUPABASE_URL="<project-url>"
export SUPABASE_SERVICE_KEY="<service-role-key>"
python scripts/supabase_dedup.py
```

The script fetches all rows, keeps only unique `museum_id` values, writes the cleaned data back, and ensures the constraint exists to prevent future duplicates.

## Image crawler

A TypeScript script extracts a preferred image from a museum website and stores only the remote URL in the `musea` table.

```
npx ts-node scripts/image-crawler.ts <museum_id> <museum_url> [attribution]
```

Environment variables `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY` must be set so the script can update the `image_url`, `image_source` and optional `attribution` columns for the given museum.

The Next.js configuration disables built-in image optimization so these remote images are never proxied or cached by the app; the browser loads them directly from the museum's own servers.
