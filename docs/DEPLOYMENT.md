# Deployment

Nook is a standard Next.js 15 app. These steps use Vercel; any Node host works the same way.

Finish [Setup](SETUP.md) first (Supabase project, migrations, auth settings). Deploying does not change the database.

## 1. Deploy

1. Import the repository into Vercel. The framework preset (Next.js), build command (`npm run build`) and output are the defaults.
2. Add the environment variables to **Project → Settings → Environment Variables**:

   | Variable | Notes |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Copy from Supabase. Do not retype it. |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional. Turns on the Cloudflare Turnstile bot check on sign-up, sign-in and password reset. Also enable CAPTCHA protection in Supabase (Authentication, Attack Protection) with the matching secret, or the check does nothing. Rebuild after changing it. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Optional. The address shown on the Contact page. |
| `NEXT_PUBLIC_STORAGE_MAX_FILE_MB` | Optional. Largest single file in MB (default 50, the free Supabase plan's limit). Set 100 after upgrading to allow 100 MB videos. Rebuild after changing it. |
| `NEXT_PUBLIC_SITE_URL` | Your production address, for example `https://chat.example.com`. Used for canonical links, the sitemap, `robots.txt`, link previews and structured data. On Vercel the project's production domain is used when this is not set; without either, those are left out rather than pointing at a wrong host. |
   | `SUPABASE_SERVICE_ROLE_KEY` | Secret. Mark it **Sensitive**. Vercel warns ("Needs Attention") on secret-looking variables that are not. |
   | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Optional. Recommended once you run more than one instance. |

3. Deploy.

**`NEXT_PUBLIC_*` values are baked in at build time.** Editing one in Vercel changes nothing until you redeploy.

If any Supabase variable is missing in a production build, every request returns HTTP 500 "Server misconfiguration". That is deliberate: the app refuses to run with authentication silently disabled.

## 2. Point Supabase at the live site

In Supabase → **Authentication → URL Configuration**:

- **Site URL**: your production address.
- **Redirect URLs**: add `https://<your-domain>/auth/confirm`.

If you use Google sign-in, the Google client's redirect URI stays the Supabase callback URL; nothing on Google's side depends on your domain.

### Vercel Deployment Protection

Vercel can put a login wall in front of a deployment ("Vercel Authentication", part of *Deployment Protection*). It is on by default for preview deployments, and can be on for production depending on the plan and settings. Anyone who is not a member of your Vercel team then sees **"You Need Access. This Vercel deployment is protected"**, even after signing in to the app with Google. (This is what [issue #6](https://github.com/Rhytam23/social/issues/6) reported.)

To let your users in:

1. In Vercel go to **Project → Settings → Deployment Protection**. For **Production**, turn Vercel Authentication off (or use the option that protects only preview deployments).
2. Share the **production domain** (Project → Settings → Domains). Per-deployment and branch URLs such as `<project>-<hash>-<team>.vercel.app` stay protected.
3. Set Supabase's **Site URL** and **Redirect URLs** to that same public domain. After Google or email sign-in, Supabase sends people to the Site URL whenever the address they started from is not in the Redirect URLs list, so a protected address there sends every user to Vercel's wall.

### Calls need a relay on some networks

Calls use WebRTC. Between two ordinary home networks they connect with the built-in public STUN server. For strict corporate or mobile networks, run a TURN server (for example coturn, or a hosted provider) and set `TURN_URLS` plus `TURN_SHARED_SECRET` (or `TURN_USERNAME` and `TURN_CREDENTIAL`) in the server environment. The relay only sees encrypted media.

## 3. Preview deployments

Preview deployments use whatever variables are set for the Preview environment. If they point at your production Supabase project, every pull request preview reads and writes production data. Use a separate Supabase project for Preview if that matters.

## 4. Pre-release checklist

**Build and tests**
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` all pass
- [ ] No secrets in git (`.env*` files are ignored except `.env.example`; the service-role key is only in host settings). If a secret was ever committed, it must be **rotated**: removing it from the code does not remove it from git history

**Database and Supabase**
- [ ] All migrations `001` to `028` applied in order (run the check queries in [Setup](SETUP.md#3-run-the-database-migrations)); `017` and `018` carry security fixes, `019` powers the admin error log
- [ ] Realtime is on for `messages`, and Realtime Authorization is set up so the private typing and call channels work
- [ ] `select username, is_admin from profiles;` shows only the people who should be admin (the first account created is admin)
- [ ] Storage buckets exist; `encrypted_attachments` is private
- [ ] **Confirm email** is on; Site URL and Redirect URLs are the production ones
- [ ] Custom SMTP is configured (the default mailer is heavily rate limited)

**Behaviour** (manual, see [Testing](TESTING.md#manual-checklist))
- [ ] Sign up, confirm email, sign in, sign out, sign in again
- [ ] Two accounts message each other live and after a refresh
- [ ] A third account cannot read their conversation
- [ ] Attachment and voice note round trip
- [ ] Layout at 390px wide and at desktop width

**Analytics**
- [ ] Vercel, Project, Analytics: click **Enable**. The code is already in the app (production builds only); until you enable it no data is collected. Check the Analytics tab after a day.

**Abuse protection** (settings you apply; the app cannot do these for you)
- [ ] Host firewall or attack-challenge mode is available and you know how to turn it on (Vercel Firewall, or Cloudflare in front)
- [ ] Supabase, Authentication, Rate Limits reviewed, minimum password length set, custom SMTP configured
- [ ] Optional: Upstash Redis variables set so rate limits are shared across instances; a CAPTCHA on sign-up if bots appear

**Operations**
- [ ] `/privacy` and `/terms` reviewed for your deployment
- [ ] Someone knows how to roll back (below)

## 5. Bundle size

The main page loads about 380 kB of JavaScript on first load, mostly the libsodium WebAssembly module. Keep that in mind for slow connections.

## 6. Incident and rollback

- **Bad release**: redeploy the previous build from the host's deployment list. Migrations are forward-only, so avoid shipping a schema change and the code that needs it in a way that can't be rolled back independently.
- **Leaked service-role key or any other secret**: rotate it at the source (Supabase → Project Settings → API for the service-role key; the provider's console for a database password or `JWT_SECRET`), update the host's variable, redeploy. Treat anything that ever appeared in public git history as permanently public.
- **Compromised admin account**: in the SQL Editor run `update public.profiles set is_admin = false where id = '<user id>';` and delete or disable the user under Authentication → Users.
- **A user lost their key**: their old messages cannot be recovered on a new device without the key backup file and passphrase. This is inherent to end-to-end encryption. With the backup they can link a new browser; without it "Start fresh" creates a new key.
- **Under flood**: turn on the host's attack-challenge mode or Cloudflare, tighten Supabase Auth rate limits, and look at which route is being hit before changing code.

## 7. Known operational limits

- Rate limiting is per address and per account and, without Upstash, per server instance. It stops cheap floods, not a volumetric DDoS. See [Security](SECURITY.md#denial-of-service).
- There is no CI pipeline in the repository yet; run the checks above before merging.
