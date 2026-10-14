# AdTech Journey

An onboarding platform that turns *The AdTech Book* (2026 edition) into a structured,
progress-tracked learning journey for new hires — with accounts, hands-on simulators and an
admin console for the people running onboarding.

## What this is

- **79 lessons across 11 sections**, mapped one-to-one onto the book's chapters — section 5 is
  always chapter 5. A 12th "appendix" section (AI in AdTech) sits outside the book and outside
  the headline percentage.
- **Simulation Lab** (`/lab`): one animated, hands-on simulator per section — run a 100 ms RTB
  auction, narrow an audience, build an identity graph, reconcile two reports — each with guided
  steps, a challenge, and an "Explain what I'm seeing" button that asks the AI assistant about
  the exact state on screen. Lessons and sections link to their simulator.
- **Accounts**: every page needs a sign-in. Progress, bookmarks, reading time, self-check
  ratings, simulator results and private notes are saved to the account.
- **Onboarding**: a short wizard (team, what you already know, weekly time) builds a personal
  path through the book with a projected finish date; then a product tour runs once. The
  dashboard shows the next lesson on that path, a weekly-goal ring, a streak, assignments,
  announcements and badges. Finishing the book unlocks a printable certificate.
- **Admin console** (`/admin`): who is active, an onboarding funnel, who needs a hand (and why),
  which lessons people struggle with, what they ask the assistant; manage people, cohorts,
  assignments, nudges, announcements and password help.

## How accounts work (no email, ever)

- **Admins add people** in *Admin → Add people*. Each account gets a generated temporary
  password, shown once, for the admin to share directly.
- **Anyone with an @iqm.com email can sign up** themselves (allowed domains live in the
  `app_settings` table).
- **First sign-in**: admin-created accounts must choose their own password; everyone saves a
  one-time **recovery code**, then does onboarding.
- **Forgot password**: email + recovery code + new password, self-service. Lost the code too?
  "I lost my code" puts a request in *Admin → Password help*, where an admin generates a new
  temporary password.
- **First admin**: `arjun.trivedi@iqm.com` becomes an admin on first sign-up (the
  `admin_bootstrap_emails` row in `app_settings`). Promote others from a person's page.

## Structure

```
src/curriculum/           The single source of truth for the book: parts -> sections -> lessons
src/components/lessons/   One file per lesson (frozen — see "Knowledge freeze")
src/components/journey/   Shell, sidebar, lesson chrome, notifications, badges, tour
src/simulations/          The Lab: registry, shared kit, one folder per simulator (logic.ts + Simulation.tsx)
src/pages/                Routes: journey, lab, account, onboarding, auth, admin
src/lib/auth/             AuthProvider, the account gate (redirect policy), error copy
src/lib/sync/             Progress sync: pure merge/diff + a persisted write queue
src/lib/admin/            Admin data access and the (tested) insight maths
src/demo/                 In-memory Supabase used by tests and `npm run dev:demo`
supabase/migrations/      Schema, row-level security and admin functions
supabase/functions/       Edge functions: adtech-chat, summarize-doc, admin-users, account-recovery
```

## Knowledge freeze

The book's content — `src/curriculum/data.ts`, `src/curriculum/chain.ts`,
`src/components/lessons/**`, `src/data/glossary.ts` and the search-index script — is hashed in
`src/test/knowledge-manifest.json`. `src/test/knowledge-freeze.test.ts` fails if any of it
changes. For an intentional content edit, run `node scripts/knowledge-manifest.mjs` in the same
commit.

## Development

```sh
npm i
npm run dev        # dev server against the Supabase project in .env / .env.local
npm run dev:demo   # dev server on an in-memory backend, signed in as a demo admin with seeded learners
npm test           # unit, render, design-rule, knowledge-freeze and database (PGlite) suites
npm run typecheck
npm run build
```

`src/test/db/` runs the real migrations in PGlite (Postgres in-process) on a small stand-in for
Supabase's `auth` schema, so the row-level-security contract is tested without Docker.
`node scripts/gen-db-types.mjs` regenerates `src/integrations/supabase/types.ts` the same way;
`supabase gen types typescript --linked` works too once logged in.

## Supabase setup

The project is **Adtech explorer** (`vnndkcsuzjrwoosatfke`).

```sh
supabase login
supabase link --project-ref vnndkcsuzjrwoosatfke
supabase db push
supabase functions deploy adtech-chat summarize-doc admin-users account-recovery
supabase secrets set GROQ_API_KEY=... GOOGLE_API_KEY=...
```

In the dashboard: **Authentication → Providers → Email → turn off "Confirm email"** (nothing is
emailed), and set **Authentication → URL configuration → Site URL** to the Vercel domain.

## Deployment

Deployed on Vercel from `main`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (public
values) in the Vercel project. No other secret belongs in the browser build.
