# MuseumBuddyApp
<!-- No-op commit marker: no functional changes -->
![Museum Buddy logo](public/logo.svg)
![CI](https://github.com/<user>/MuseumBuddyApp/actions/workflows/ci.yml/badge.svg)
Deze CI-workflow voert de tests van het project uit zodat de badge de status van de build weergeeft.

## Project Structure



## Environment Variables

To run the app locally:

1. Copy `.env.example` to `.env.local`.
2. Fill in the values for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

These variables are required for the application to connect to Supabase and should also be added to your Vercel project settings for both build and runtime.

## GitHub webhook secret rotation (incident Jan 2026)

GitHub reported that for a subset of deliveries between **September 11, 2025** and **January 26, 2026**, a webhook secret could appear in the `X-Github-Encoded-Secret` header.
If your repository webhook was in scope, treat the secret as compromised and rotate it immediately.

### Steps for this repository

1. Open repository settings:
   - `https://github.com/pantsidou-dotcom/MuseumBuddyApp/settings/hooks`
2. Locate webhook ID `573139046`.
3. Generate a new secret locally:
   ```bash
   openssl rand -hex 32
   ```
4. Edit the webhook and replace the secret with the generated value.
5. Save and re-send a recent delivery to confirm signature validation still passes.

### Receiver hardening checklist

- Verify incoming signatures using `X-Hub-Signature-256` and a constant-time comparison.
- Remove `X-Github-Encoded-Secret` from request/header logs if your ingestion pipeline stored it.
- Purge historical logs containing leaked secrets from the affected date window.

GitHub docs:
- Edit webhook: https://docs.github.com/en/webhooks/using-webhooks/editing-webhooks
- Validate deliveries: https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries

## Deduplicate musea table

A helper script is available to remove duplicate `museum_id` entries from the Supabase `musea` table and enforce a `UNIQUE` constraint.

```
export SUPABASE_URL="<project-url>"
export SUPABASE_SERVICE_KEY="<service-role-key>"
python scripts/supabase_dedup.py
```

The script fetches all rows, keeps only unique `museum_id` values, writes the cleaned data back, and ensures the constraint exists to prevent future duplicates.
