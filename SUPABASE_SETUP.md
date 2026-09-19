# Supabase setup — 10 minutes, one time

Verified 2026-09-19: `supabase/schema.sql` was executed against a real Postgres 
instance before this was written. It runs clean and the CHECK constraints reject 
bad data. You should not hit SQL errors.

---

## Step 1 — Create the project (3 min, mostly waiting)

1. Go to **https://supabase.com** → **Start your project** → sign in with GitHub.
2. **New project**.
   - **Name:** `misneach`
   - **Database Password:** click **Generate a password**, then **copy it somewhere**.
     You won't need it for our code (we use API keys), but you cannot see it again.
   - **Region:** `East US (North Virginia)` — closest to Boston.
   - **Plan:** Free.
3. **Create new project**, then wait ~2 minutes for it to provision.

## Step 2 — Create the tables (1 min)

1. Left sidebar → **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` in this repo, select all, copy.
3. Paste into the editor → **Run** (or Cmd+Enter).
4. Expect `Success. No rows returned.` Green NOTICE lines about things
   "does not exist, skipping" are normal on a first run — those are the
   idempotent `drop if exists` statements.
5. Sidebar → **Table Editor**. You should see three tables:
   `corpus_entries`, `founder_profiles`, `generated_plans`.

## Step 3 — Get your keys (1 min)

1. Sidebar → **Project Settings** (gear, bottom left) → **API Keys**.
2. You need three values:

| Where | What to copy |
|---|---|
| **Project URL** (Settings → Data API) | `https://xxxxx.supabase.co` |
| **anon / public** key | long `eyJ...` string — safe in the browser |
| **service_role / secret** key | long `eyJ...` string — **server only, never ship this** |

> If you see "Publishable"/"Secret" keys instead of "anon"/"service_role",
> Supabase renamed them. Publishable = anon, Secret = service_role.

## Step 4 — Put them in `.env` (1 min)

In the repo root:

```bash
cp .env.example .env
```

Open `.env` and paste your three values in. It should look like:

```
SUPABASE_URL=https://abcdefghijkl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
SUPABASE_ANON_KEY=eyJhbGciOi...
```

`.env` is gitignored. Confirm with `git status` — it must not appear.

## Step 5 — Seed and verify (2 min)

```bash
set -a && source .env && set +a && npm run seed
```

Expect: `Seeded 60 entries. Table now holds 60.`

Then:

```bash
set -a && source .env && set +a && npm run health
```

Expect: `Supabase OK — corpus_entries has 60 rows` and
`loadCorpus() returned 60 entries from: supabase`.

**If it says `from: local`**, the fallback kicked in — Supabase isn't reachable,
but nothing is broken. Check `SUPABASE_ANON_KEY` is set.

## Step 6 — Hand the anon key to Person C

The frontend needs **only** `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
Row Level Security is on, so that key can read the corpus and insert a profile,
and nothing else. **The `service_role` key must never reach the browser** — it
bypasses RLS entirely.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY` | env not loaded | Use `set -a && source .env && set +a` — a bare `source .env` doesn't export |
| `relation "corpus_entries" does not exist` | Step 2 not run, or run in the wrong project | Re-run `schema.sql` in SQL Editor |
| `new row violates row-level security policy` | using the anon key to write the corpus | Seeding needs `service_role` |
| `Seeded 60 ... Table now holds 0` | reading with a key that RLS blocks | Expected if `SUPABASE_ANON_KEY` is wrong; the seed itself still worked |
| Seed says `Refusing to seed an invalid corpus` | the JSON broke | Run `npm run validate` to see exactly which entry |

## Resetting

`schema.sql` starts with `drop table if exists ... cascade`. Re-running it wipes
all three tables and rebuilds them. Re-seed afterwards.
