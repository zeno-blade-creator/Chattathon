# Generation layer (Person B) — how to run it and how to call it

## Run it
```bash
npm install
node --env-file=.env server.mjs      # http://localhost:8787
```
`.env` needs `GEMINI_API_KEY`, `TAVILY_API_KEY`, `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. It is gitignored. Keep it that way.

## Call it
```
POST http://localhost:8787/generate     { building, city, neighbourhood?, stage, customer, goal, tried? }
GET  http://localhost:8787/health
```
Responses:
- `{ status:'ready', plan, profileId, fallbackUsed, ms }` — `plan` matches `src/types.ts`
- `{ status:'unsupported_city', city, message }` — render the honest waitlist state
- `{ status:'failed', error }` — 500, should not happen; the fallback catches first

Takes **~20–25s**. The loading screen needs to survive that.

## Why there is a server at all
API keys are passwords. Anything in the Expo bundle is public, and this repo is
public. The server holds the keys; the app only ever sends a profile. It also
holds the Supabase *service* key, which is how plans can be read back — the
anon key deliberately cannot.

## The no-hallucination guarantee, mechanically
The model is never trusted with a fact. It receives candidates and returns only
judgement — `rank`, `why_you_why_now`, `draft`, `opener` — keyed by id. Every
factual field (`name`, `url`, `date_or_cadence`, `cost`, `contact_route`) is
copied from the corpus *after* the model answers. Ids that were not in
`allowed_ids` are dropped. An invented event cannot reach the page.

Two sources, both real:
- **corpus** — 60 hand-verified Boston entries in Supabase. The spine.
- **`source:'live'`** — found via Tavily at request time (campus clubs, this
  month's events). Real retrieved URLs, never authored. Badge these differently
  if you like.

## What Person C still needs to change
1. `STAGE_OPTIONS` / `GOAL_OPTIONS` must submit the enum values, not the labels:
   `'Just an idea'→'idea'`, `'Building it'→'building'`, `'Launched, few users'→'launched'`,
   `'Launched, growing'→'early-revenue'`, plus a new `'raising'`.
   Goals: `'users' | 'pilot-customers' | 'funding' | 'press' | 'cofounders' | 'mentors'`.
   The server normalises labels anyway, but the database CHECK is the real gate.
2. Replace the `SAMPLE_PLAN` import in `App.tsx` with a POST to `/generate`.
3. Handle `status:'unsupported_city'`.

## What Person A still needs to run
`supabase/002-generation-layer.sql` — additive. Widens the `goal` CHECK (the UI
can currently submit values that fail it, and cofounder/mentor goals were
missing), adds `item_status` for the checklist, adds `status`/`fallback_used`
to `generated_plans`.
