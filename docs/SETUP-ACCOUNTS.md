# Turning on account sync

Free, permanently, on infrastructure the site already deploys to. **No third
Supabase project and no $25/month.** Netlify Blobs is a key-value store built
into every Netlify site, including the free plan, and the sessions are a cookie
this site signs itself.

Nothing here is needed to ship — signed out, the app works and stores locally.
The account panel simply says "not signed in" until these two variables exist.

## 1 · Google OAuth credentials

Google Cloud Console → **APIs & Services → Credentials → Create credentials →
OAuth client ID → Web application**.

- Authorised JavaScript origins: `https://sandhyakatha.com` (and the
  `.netlify.app` URL while the domain is still propagating)
- Authorised redirect URIs: `https://sandhyakatha.com/api/auth/callback`
  (plus `http://localhost:8888/api/auth/callback` for `netlify dev`)

On the OAuth consent screen, request **only** the `openid` and `email` scopes.
Nothing else is asked for and nothing else should be.

## 2 · Netlify environment variables

Site configuration → Environment variables:

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | from step 1 |
| `GOOGLE_CLIENT_SECRET` | from step 1 |
| `SESSION_SECRET` | 32+ random characters — `openssl rand -base64 48` |
| `SITE_URL` | `https://sandhyakatha.com`, or the netlify.app URL until the domain resolves |

Redeploy. That is the whole setup.

## What it costs

Nothing, at any plausible scale for this. Netlify's free plan covers 125k
function invocations a month; a family syncing twice a night uses about 60.
Blobs storage is a few kilobytes per family.

## How it works

- `/api/auth/start` redirects to Google. **No Google script ever loads in the
  page**, so Google does not see visitors who never sign in.
- `/api/auth/callback` exchanges the code server-side using the client secret
  and issues an HttpOnly, Secure, SameSite=Lax cookie signed with
  `SESSION_SECRET`. The browser never holds a token.
- `/api/profile` reads and writes one JSON blob per account, keyed by
  `google:<subject>` or `code:<recovery code>`.
- `/api/code` mints a 128-bit recovery code for parents who would rather not
  use Google. It is an account with no identity attached: we never learn who
  they are, and if they lose the code the history cannot be recovered — which
  the UI says plainly before creating one.

## Local development

Functions need `netlify dev`, not `vite`:

```bash
npm i -g netlify-cli
netlify dev            # serves the app and /api/* together on :8888
```

`npm run dev` still works for everything except the account panel.

## If you ever do have a spare Supabase project

`docs/alternative-supabase.sql` holds the equivalent table and RLS policy.
The client interface in `src/lib/sync.ts` is small enough to swap in an
afternoon — but there is no reason to.

## CORRECTIONS_KEY — reading what readers report

`/api/correction` accepts a report from anybody, with no account. Reading the
reports back needs one more Netlify environment variable:

    CORRECTIONS_KEY = <32+ random characters>

Then `npm run corrections` prints them, newest first, grouped by story. Put the
same value in a local `.env` (gitignored) so the script finds it. Without the
variable set, the read endpoint returns 404 and only writing works — which is
the safe default.
