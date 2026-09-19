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

---

# Person A, part two — the profile side

Person B sources the corpus. **Person A owns the founder, and the join between
the two.** Nothing here calls a model or the network; it's all deterministic and free.

```
intake (6 fields) ──▶ buildProfile()  ──▶ signals[]  ─┐
                                                       ├──▶ shortlist() ──▶ Person B's one model call
        Person B's corpus ──▶ adaptCorpus() ──────────┘
```

## `lib/profile.mjs` — the intake contract

`buildProfile(raw)` validates F1's six fields and returns them plus two derived things:

- **`signals[]`** — tags inferred from the free text (sector, customer type,
  constraints like `bootstrapped` / `non-technical` / `solo-founder`) combined with
  exact mappings from the `stage` and `goal` dropdowns. These are the same vocabulary
  as corpus tags, so matching is a set intersection, not a fuzzy compare.
- **`city_supported`** — the honesty gate. Accepts Boston, Cambridge, Somerville and
  22 Boston neighbourhoods. Everything else is `false` and must hit the waitlist path.

## `lib/corpus-adapter.mjs` — for Person B

`adaptCorpus(anything)` maps your field names onto the canonical ten and drops
entries with no URL, no `why_it_matters`, or a duplicate id. It already understands
`title`/`name`, `link`/`url`, `when`/`date`, `audience`/`who_it_serves`, and folds
`accelerator`/`investor`/`journalist` into `person_org`, `grant`/`newsletter`/
`subreddit` into `channel`. **If your shape doesn't map, tell me and I'll add it —
don't reshape your data to fit mine.**

## `lib/match.mjs` — the join

`buildGenerationInput(corpus, profile)` returns exactly what your model call needs:

```js
{ profile, candidates: [...20 scored entries], allowed_ids: [...] }
```

- **`candidates`** is a *balanced* shortlist (6 events / 8 orgs / 6 channels), not
  the raw top 20 — ten events and no channels is a worse plan even at higher scores.
- **`allowed_ids`** is your anti-hallucination assertion. The model may only return
  ids from this list; reject the response if it invents one.
- Each candidate carries `_match_score` and `_match_reasons` — a deterministic
  explanation of why it surfaced, independent of what the model claims.

Measured on the seed corpus: **60 entries (39k chars) → 20 candidates (15.6k chars),
a 60% smaller prompt** for the same plan.

## `lib/db.mjs` — persistence

`saveProfile`, `savePlan`, `seenItemIds`, `healthCheck`. All of them **degrade
instead of throwing** — no Supabase, no network, no problem, they return
`{saved:false}` and the demo continues. `seenItemIds()` is the hook for MVP+
(don't show the same item twice).

## Commands

```bash
npm run match      # end-to-end profile -> signals -> shortlist, no network
npm run health     # is Supabase wired up?
npm run validate   # structural gate on the corpus
npm run verify     # probe every corpus URL
npm run seed       # push corpus to Supabase
```

## Adversarial tests

```bash
npm test          # corpus validation + all 21 adversarial cases
npm run adversarial
```

Covers Person E's list — blank intake, nonsense product, B2B enterprise founder,
wrong city — plus the ones only visible from the code: prompt injection in the
intake text, 5k-character input, regex metacharacters, emoji-only fields, and an
empty corpus.

**The city gate is the one that matters.** The first version substring-matched,
so *"Boston, Lincolnshire, UK"* and *"Cambridge, England"* both received full
Massachusetts plans — the exact hallucinated-local-detail failure the build plan
names as our biggest credibility risk. It now word-boundary matches and then
checks for disqualifying geography, while `"Boston, MA"` and `"Cambridge, MA 02139"`
still pass. `checkCity()` returns a `reason` string suitable for showing the user.

There is exactly one city gate, in `lib/profile.mjs`. `lib/corpus.mjs` re-exports it.
