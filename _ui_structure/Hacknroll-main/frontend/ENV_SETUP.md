## Env setup (Auth)

Your UI currently uses **Supabase Auth** (see `frontend/lib/app-context.tsx`) and your API routes use:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, **never** `NEXT_PUBLIC`)

### 1) Create `frontend/.env.local`

Create a file at `frontend/.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
```

Where to get them:

- Supabase Dashboard → **Project Settings** → **API**
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (**keep secret**)

### 2) Supabase Auth settings (recommended for dev)

Because the app signs up users as `username@darepot.local`:

- Supabase Dashboard → **Authentication** → **Providers** → **Email**
  - Ensure **Email** provider is enabled
  - For easiest local dev, turn off **Confirm email** (otherwise sign-up may require email delivery)

Also ensure your local URL is allowed:

- Supabase Dashboard → **Authentication** → **URL Configuration**
  - Add `http://localhost:3000` to allowed URLs (Site URL / Redirect URLs)

### Optional: legacy/custom auth env vars

There are older endpoints under `frontend/app/api/auth/*` that use a custom Postgres-backed session cookie.
The current UI does **not** use these routes, but if you do, you’ll need:

- `DATABASE_URL` (postgres connection string)
- `SESSION_SECRET` (HMAC secret for session tokens)

Generate a `SESSION_SECRET` locally:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```


