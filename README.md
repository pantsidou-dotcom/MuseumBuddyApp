# MuseumBuddyApp
![Museum Buddy logo](public/logo.svg)
![CI](https://github.com/<user>/MuseumBuddyApp/actions/workflows/ci.yml/badge.svg)
Deze CI-workflow voert de tests van het project uit zodat de badge de status van de build weergeeft.

## Project Structure



## Environment Variables

To run the app locally:

1. Copy `.env.example` to `.env.local` (this file is ignored by Git and should never be committed).
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
