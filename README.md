Test
# MuseumBuddyApp
![CI](https://github.com/<user>/MuseumBuddyApp/actions/workflows/ci.yml/badge.svg)
Deze CI-workflow voert de tests van het project uit zodat de badge de status van de build weergeeft.

## Project Structure



## Environment Variables

To run the app locally:

1. Copy `.env.example` to `.env.local`.
2. Fill in the values for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

These variables are required for the application to connect to Supabase and should also be added to your Vercel project settings for both build and runtime.
