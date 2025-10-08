# Environment setup

This project relies on a Supabase backend. Local development requires a `.env.local` file containing the public project URL and the anon key. The real values should **never** live in git history.

## 1. Create your local env file

```bash
cp .env.example .env.local
```

The example file intentionally contains empty placeholders so secrets do not leak.

## 2. Retrieve the Supabase credentials

1. Sign in to the Supabase dashboard and open the project used for MuseumBuddy.
2. Navigate to **Project Settings → API**.
3. Copy the **Project URL** value into `NEXT_PUBLIC_SUPABASE_URL`.
4. Copy the **anon public** key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

> ℹ️ If you do not have access to the Supabase project, request the credentials from the project maintainers. They are also stored alongside the production deployment secrets in the team's password manager.

## 3. Keep credentials out of Git

- `.env.local` is ignored via `.gitignore` and must not be committed.
- Run `git status` before pushing to ensure the file is not staged.
- If you accidentally add the file, remove it with:

  ```bash
  git rm --cached .env.local
  ```

## 4. Update deployment platforms

The same values are required in Vercel (or your hosting provider) for both build and runtime environments. After updating the keys in Supabase, make sure to update the environment variables on the deployment platform as well.

