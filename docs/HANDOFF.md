# Contract for A (backend) and C (frontend) — from B (generation)

Repo: https://github.com/zeno-blade-creator/Chattathon
Branch with this contract: `main`. My work lands on `feat/ai-generation-layer`.

**Build to this shape and we merge in ten minutes instead of an hour.**

## Person A — backend / login / Supabase
1. Run `supabase/schema.sql` in the Supabase SQL editor, unedited. Three tables:
   `profiles` (intake), `plans` (what I write), `item_status` (checklist).
2. Send me, in a DM, not a commit:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-side only — it bypasses RLS, so it must never
     reach the frontend bundle)
   Person C gets the **anon** key instead.
3. Do not rename columns. If you need a new field, add it — additive is free, renames break me.
4. `plans.payload` is a single `jsonb` blob matching `contracts/plan.schema.json`. You do
   not need to model it relationally. Don't.

## Person C — frontend
1. `contracts/plan.schema.json` is the exact shape you will receive. Build against
   `fixtures/sample-plan.json` (committed on my branch) **right now** — do not wait for me.
2. Three states to render: `pending` (loading), `ready` (the plan), `failed`.
3. `coverage.city_supported === false` → render the honest "we cover Boston today" state,
   not an empty plan. This is a feature we pitch, not an error.
4. Per item you get: `name`, `url`, `why_you_why_now` (the hero line — make it prominent),
   `date_or_cadence`, `location` for the map pin, `contact_route`, and `pitch.body`
   (needs a copy button). `verified: true` can carry a small badge.
5. `week_one[]` is the checklist. `item_id` is stable — write toggles to `item_status`.

## Shared rules
- Every `url` is real and fetched. Nothing on the page is invented. If we can't source it,
  it doesn't render. That claim is our whole credibility with the judges.
- City is locked to Boston for the demo. Anything else returns `city_supported: false`.
- `stage` (idea|building|launched|revenue|raising) changes which items rank, so the intake
  form must collect it.
