# Hyperlocal GTM Copilot — Corpus & Database (Person A)

The moat: **60 hand-curated, URL-verified Boston entries.** Versioned JSON is the
source of truth; Supabase is the serving layer.

## For Person B — your contract

```js
import { loadCorpus, isSupportedCity } from './lib/corpus.mjs';

const { entries, source } = await loadCorpus();   // 60 entries, Supabase or local fallback
```

Each entry has **exactly these ten fields** and nothing else:

| field | notes |
|---|---|
| `id` | `evt-` / `org-` / `chn-` + slug. **Use this to reference an item — never re-type a name.** |
| `type` | `event` \| `person_org` \| `channel` |
| `name`, `url` | verbatim. Do not rewrite. |
| `date_or_cadence` | Often a cadence ("Weekly, Thursdays 3–8pm"), not a date. **Never convert a cadence into a specific date** — that is the hallucination we lose on. |
| `who_it_serves`, `tags[]`, `why_it_matters`, `cost`, `contact_route` | |

Anti-hallucination rules baked into the data:
- Where I could not verify a specific date, the field says *"Annual, typically September"*.
  That imprecision is load-bearing. Pass it through; don't sharpen it.
- `contact_route` is **public organisational routes only** — contact forms, published
  tip lines, mod inboxes. No personal emails, no LinkedIn scraping. That's the answer
  if a judge asks about data ethics.
- `isSupportedCity(input)` accepts Boston/Cambridge/Somerville/Brookline. Everything
  else must hit the waitlist path, not a generated plan.

## Commands

```bash
npm run validate   # structural gate, offline, instant
npm run verify     # probes every URL, rewrites last_verified; exits 1 on any dead link
npm run seed       # validate then upsert into Supabase (needs service_role key)
```

## Supabase setup (2 minutes, one-time)

1. Create a free project at supabase.com (name it whatever; pick the closest region).
2. **SQL Editor → New query →** paste `supabase/schema.sql` → Run.
3. **Project Settings → API**, copy the values into a `.env` (see `.env.example`).
4. `set -a && source .env && set +a && npm run seed`

RLS is on: the `anon` key can only `SELECT`. Writes require `service_role`, which
must never reach the browser.

## Corpus stats

| | count |
|---|---|
| events | 15 |
| people & orgs | 29 |
| channels & grants | 16 |
| **total** | **60** |
| URLs live at last check | **60/60** |

Five entries are hand-verified rather than probe-verified because their WAF 403s
scripted requests — see `data/verified-manually.json` for which, and why.
