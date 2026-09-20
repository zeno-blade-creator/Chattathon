# Build decisions — Misneach, 19 Sep 2026

Every choice below was made during the build, with the reason. Where something
is unverified or was cut, it says so.

---

## 1. One city, and we fail loudly outside it

**Chose Boston.** The plan's persona was Irish; the team, the judges and the
founders available for validation calls are not.

**Why it matters:** the corpus is the moat, and a corpus is only a moat if it's
real. A generic model hallucinates a Lisbon meetup; a local judge catches that
in ten seconds.

**Consequence we accepted:** type any other city and you get a waitlist, not a
plan. That refusal is a feature and belongs in the pitch.

> *Say:* "We cover one city properly rather than fifty badly. Type Lisbon and
> we'll tell you we don't cover it — we won't invent a meetup."

---

## 2. Hand-verified corpus, with a stated verification standard

**60 Boston entries** — 15 events, 29 people/orgs, 16 channels/grants.

**The standard: every entry has a working URL.** Not asserted — probed. 11
failed the first pass and each was chased down rather than dropped:

- Dead origins replaced (Venture Lane, Roxbury Innovation Center)
- Boston New Technology's own domain is defunct; its Meetup group is live, so
  the entry points there
- Wrong paths corrected (Babson WIN Lab, BPL Kirstein, boston.gov funding)
- **5 sites alive but WAF-blocking scripted requests** (SCORE, Universal Hub,
  BizJournals ×2, Product Hunt) were checked by hand in a browser and recorded
  in `data/verified-manually.json` with the date and the reason

> *Say:* "60 entries, 60 live URLs. Five of them a bot can't check, so a human
> did, and we wrote down which and why."

---

## 3. Only public organisational contact routes

Contact forms, published tip lines, community mod inboxes. **No scraped
personal emails, no LinkedIn harvesting.**

> *Say, if asked about data ethics:* "Every contact route is a public
> organisational one. We never scraped a person."

---

## 4. Supabase + a versioned JSON seed, not one or the other

The corpus is the source of truth **in the repo**; a seed script pushes it to
Postgres. The app reads Supabase and **falls back to the bundled JSON** if it
can't.

**Why both:** a real database answers the scale question; the versioned file
means the moat is code-reviewed and survives dead venue wifi.

Measured: with Supabase unreachable the fallback used to take **7.1 seconds**
because the client retries internally and ignores a per-request abort. Bounded
the whole attempt instead — now **2.0 seconds**. Online is unchanged at 350ms.

---

## 5. Row Level Security, and the bug it exposed

`anon` can read the corpus and insert a profile. It cannot write the corpus and
cannot read anyone's profile back.

Testing the policies with the **real anon key** — rather than trusting the SQL —
found a bug that passed every local test: `insert().select()` needs a SELECT
policy to return the row, and we deliberately don't grant one, so one founder
can't read the previous founder's intake. Fixed by generating the id
client-side. It would have broken the intake screen in the browser while
working perfectly in every test run with the service key.

---

## 6. The join is deterministic, and runs before the model

Free text in, structured signals out. "no budget, it's just me and I can't code"
becomes `bootstrapped, solo-founder, non-technical`. Those are the same
vocabulary as corpus tags, so matching is a set intersection, not a fuzzy
compare — and it is explainable without asking the model anything.

The shortlist is **balanced** (roughly 6 events / 8 orgs / 6 channels), not the
raw top 20: ten events and no channels is a worse plan even at higher scores.

**Measured: 60 entries → 20 candidates, a 60% smaller prompt** for the same plan.
That's most of the cost story, and it costs nothing to run.

---

## 7. The anti-hallucination guarantee is structural, not a prompt

**The model never writes a name, URL, date or cost.** It receives candidates and
returns corpus ids plus prose. Every fact on the page is joined back from the
verified corpus by id.

It isn't that we asked it nicely. **There is no field in the output schema where
a fake event could go.** On top of that, `allowed_ids` enforcement drops any id
that wasn't in the shortlist and reports what it dropped.

> *Say:* "A prompt is not a security boundary. The model can't name an event —
> it can only point at one we verified."

**Known limit, stated honestly:** the prose fields (`why_you_why_now`, drafts)
*are* free text and nothing checks them. We caught the model writing "BUild Lab
sits on Commonwealth Avenue and organisers from adjacent campuses meet weekly"
when the corpus says only "runs open coaching hours." Mitigated in the prompt,
not eliminated. This is the biggest remaining credibility risk and we know it.

---

## 8. The city gate refuses same-named cities

The first version substring-matched, so **"Boston, Lincolnshire, UK" received a
full Massachusetts plan.** So did "Cambridge, England" and "Somerville, NJ."

Now word-boundary matched with a disqualifying-geography check. The same bug
existed separately in the frontend guard — which is the one the app actually
calls, so the backend fix wasn't protecting the demo at all.

> *Say, and let them try it:* "Type 'Boston, Lincolnshire, UK'. We refuse it by
> name. The coverage claim is enforced, not asserted."

---

## 9. Nothing that persists is allowed to break the demo

Saving a profile or a plan **returns `{saved:false}` rather than throwing.**
Every model call is bounded: 45 seconds across the whole retry matrix, not 60
seconds per request — which was 4 models × 2 attempts = **8 minutes** worst case
while the loading animation finished in 3.4 seconds.

When live generation fails we serve a recorded plan **and say so on screen**.
It was previously presented as the founder's own, which on the public GitHub
Pages build meant every single visitor.

---

## 10. Team decision: their generation layer won

Two generation layers existed — a Gemini one and a Claude one written in
parallel. Theirs was already wired to the shipped Expo app, so **theirs took
every collision and the duplicate was deleted.** Roughly an hour of work binned
to avoid two seams an hour before freeze.

---

## Cost

One model call per plan — all ten items, every reason, every draft in a single
response, with the prompt already cut 60% by the deterministic shortlist. The
corpus is pre-seeded and cached, so there is **zero search cost and zero latency
risk at demo time**.

---

## What we have not verified

- **The live Gemini and Tavily path has never run on our machine** — no keys
  locally, so every run in this session used the fallback generator. In
  particular the fix that makes discovery results reachable by the model is
  unproven; check `meta.liveUsed > 0` on a real run.
- Founder validation calls are Person E's, not reflected here.

## Tests

**62, all offline and free.** They exist where something already drifted once:
the `allowed_ids` contract, the model-call budget, UI↔validator↔database enum
agreement, the corpus-count claim, and the city gate.
