Test
# MuseumBuddyApp
![CI](https://github.com/<user>/MuseumBuddyApp/actions/workflows/ci.yml/badge.svg)
Deze CI-workflow voert de tests van het project uit zodat de badge de status van de build weergeeft.

## Project Structure

- `lib/` contains JavaScript helpers.
- `components/` contains React components used throughout the app.

## Environment Variables

Add the following variables in your Vercel project settings for both build and runtime:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

These are required for the application to connect to Supabase.
