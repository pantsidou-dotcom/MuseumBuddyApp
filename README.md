# MuseumBuddyApp
![Museum Buddy logo](public/logo.svg)
![CI](https://github.com/<user>/MuseumBuddyApp/actions/workflows/ci.yml/badge.svg)
Deze CI-workflow voert de tests van het project uit zodat de badge de status van de build weergeeft.

## Project Structure



## Environment Variables

To run the app locally:

1. Copy `.env.example` to `.env.local` (this file is ignored by Git and should never be committed).
2. Replace the placeholder values (`your_supabase_url` and `your_supabase_anon_key`) with the real credentials.
3. Follow the [environment setup guide](docs/environment-setup.md) if you need help retrieving the Supabase values or updating your deployment settings.

These variables are required for the application to connect to Supabase and should also be added to your Vercel project settings for both build and runtime.

## Deduplicate musea table

A helper script is available to remove duplicate `museum_id` entries from the Supabase `musea` table and enforce a `UNIQUE` constraint.

```
export SUPABASE_URL="<project-url>"
export SUPABASE_SERVICE_KEY="<service-role-key>"
python scripts/supabase_dedup.py
```

The script fetches all rows, keeps only unique `museum_id` values, writes the cleaned data back, and ensures the constraint exists to prevent future duplicates.
