# Hyperlocal GTM Copilot — Misneach Build Plan

*One-line pitch:* The growth hire a pre-seed founder can't afford — it tells you the five people, events and channels **in your city** to hit this week, and writes the pitch for each one.

---

## 1. Eligibility line (say this in the first 30 seconds)

> **Persona:** Aoife, non-technical solo founder of a consumer app, 0–12 months old, pre-seed or bootstrapped, based in [CITY]. No growth hire, no agency, under €500/month of marketing spend. She is her own product manager, support desk and marketer.
>
> **Bottleneck:** Local go-to-market targeting. Every week she has to answer "who do I talk to, where do I show up, and what do I say?" — and she answers it by tab-hopping across Eventbrite, Meetup, LinkedIn, accelerator sites, council grant pages and local press, then staring at a blank email. It costs her 6–8 hours a week, and more often she just skips it, which is worse.

Both the persona and the bottleneck are named explicitly. Do not soften this into "founders are busy."

**The value claim:** 6–8 hrs/week of research and drafting → ~20 minutes of reviewing a ready-made plan. A contract growth marketer doing this runs $50–75/hr, i.e. a $1,200–2,400/month role. Present that as *our estimate, validated with N founders today* — see Person E's job.

---

## 2. The one real differentiator

The AI is not the moat. Any model can write an outreach email.

**The moat is a hand-curated, verified local corpus for one city.** Real event names with real dates. Real accelerators, meetups, coworking spaces, local journalists' beats, community Slacks and subreddits, grant deadlines. A generic LLM hallucinates these, and a local judge will catch it in ten seconds.

Consequence: **we support exactly one city on demo day, and we fail loudly and gracefully outside it.** If someone types Lisbon, we say "we cover [CITY] today — here's the waitlist" instead of inventing a Lisbon meetup. That honesty *is* a selling point. Say it out loud in the pitch.

---

## 3. MVP — the minimum that makes this work

Four features. Nothing else ships today.

**F1 — Intake (one screen, 6 fields).**
What you're building · your city/neighbourhood · stage · who your customer is · your goal for the next 90 days (users / pilot customers / funding / press) · anything you've already tried.
No accounts, no onboarding flow, no settings page.

**F2 — The Local Opportunity List.**
Ten ranked items pulled from the seeded corpus and matched to the profile, in three buckets:
- **Events** — go to this, on this date, because this crowd is your customer.
- **People & orgs** — this accelerator / community lead / local journalist covers exactly your space.
- **Channels** — this subreddit, this local newsletter, this Slack, this grant.

Each item carries a **"why you, why now"** line. That line is the product. Without it we're a directory.

**F3 — The pitch, pre-written.**
Every person/org item has a ready-to-send 80-word email or DM, personalised to *their* product and *that* recipient's focus. Copy button. Each event has a one-line "what to say when you walk up to someone."

**F4 — The Week One Plan.**
Five actions, time-boxed, in order, with the total hours. "Tuesday, 20 min: send these two emails. Thursday 6pm: this event, bring these cards." Copyable as text.

**Build if and only if there's time left (MVP+):** mark items done/sent/skipped so a second generation avoids repeats. This is what makes it feel like a weekly service rather than a one-shot toy, but it is not required to demo.

**Explicitly out of scope today:** logins, CRM sync, calendar integration, reminders, multi-city, scraping individual people's profiles, resume mode, payments, mobile app.

---

## 4. Cost efficiency (judges will ask)

- The corpus is **pre-seeded and cached**, not fetched live. Zero search cost at demo time, zero latency risk on stage.
- **One model call per plan**, not one per item. Ask for structured JSON containing all ten items, their reasons and all their drafts in a single response. Batching is the whole trick.
- Rough per-generation cost: order of a few cents. Say "pennies per founder per week, so the free tier is sustainable" — and be ready to show the batching in the code if pressed.
- Regenerating costs the same as generating, so a weekly cadence is cheap. That's the business model slide: a plan a week, not a one-off report.

---

## 5. Who does what (5 people, ~6 hours)

Three build, two sell and validate. Everyone commits to their own lane; no one waits on anyone else for the first two hours.

### Person A — Corpus / Data Lead *(build)*
Owns the moat. By T+3 hours, **40–60 verified entries** for one city in a single JSON file, agreed schema, no exceptions:
`{type, name, url, date_or_cadence, who_it_serves, tags[], why_it_matters, cost, contact_route}`
Split roughly: 15 events, 20 people/orgs, 15 channels/grants. Every entry must have a working URL — that's the verification standard.
**Rule: only public organisational contact routes.** Company contact pages, "email us" addresses, public community mods, journalists' published tip lines. No scraped personal emails, no LinkedIn harvesting. If a judge asks about data ethics, this is the answer.

### Person B — Generation Layer *(build)*
Owns the prompt and the output contract. Takes the intake profile + the corpus, returns one JSON blob: ranked items, "why you, why now" lines, and all drafts. Hard requirements:
- The model may only rank and personalise entries from the corpus. It must never invent an event, org or date. State this in the system prompt and again as a post-generation check.
- Every field validated before render; malformed JSON falls back to a cached demo plan so the stage demo cannot break.
Ship a stubbed version by T+1.5 so Person C isn't blocked.

### Person C — Interface *(build)*
Intake screen → loading state → the plan. Three views, one page. Priority order: (1) the plan is legible and screenshot-able, (2) copy buttons on every draft work, (3) it looks deliberate. Use hardcoded sample output until B's layer lands. If you have spare cycles at the end, build the done/skipped toggles.

### Person D — Pitch & Demo *(sell)*
Owns the deck and the 90-second live path. Deck is 6 slides maximum:
1. Aoife and her 6–8 lost hours (persona + bottleneck, named)
2. What she does today (the tab-hopping screenshot — make it ugly)
3. Live demo
4. Why hyperlocal is hard and why our curated corpus is the moat
5. Time and cost saved + what founders told us (Person E's quotes)
6. Roadmap: next city, weekly cadence, the honest limits
Run the demo on a **recorded backup video** as insurance, and rehearse it three times minimum before the final hour.

### Person E — Validation & QA *(sell)*
Two jobs, both high-scoring:
1. **Get 3 real local founders on a 10-minute call today.** Show them the plan output. Ask: would you have found these yourself? how long would it have taken? would you send this email as written? Capture one usable quote and one honest criticism. Real user quotes beat any feature we could add in the same hours.
2. **Adversarial QA from T+4:** try the wrong city, a blank intake, a nonsense product, a B2B enterprise founder. Anything that produces a hallucinated event or a cringe email goes straight to B. You are the last line before the judges.

---

## 6. Clock

| Time | Milestone |
|---|---|
| T+0:30 | Persona, city and corpus schema locked. Everyone starts. |
| T+1:30 | B's stub returns fake JSON; C renders it. E has first founder call booked. |
| T+3:00 | Corpus at 40+ entries. Real generation working end to end on one profile. |
| T+4:00 | **Feature freeze.** Only bug fixes and copy after this. |
| T+4:30 | Backup demo video recorded. Deck drafted. |
| T+5:30 | Three full rehearsals. E's quotes in the deck. |
| T+6:00 | Ship. |

---

## 7. Roadmap (one slide, one line each)

- **Next:** weekly regeneration with memory of what you already did — the plan becomes a service, not a report.
- **Then:** second city, proving the corpus process is repeatable rather than hand-built.
- **Later:** outcome tracking — which events and emails actually produced customers, fed back into ranking.
- **Someday:** personal-profile mode (upload a CV, find local side projects and collaborators).

One caution on that last one: it serves a job-seeker, not a founder. Mention it as a single line if asked about expansion — building the story around it splits the pitch and weakens the persona we just spent five slides establishing.

---

## 8. Known risks, stated before the judges state them

1. **Hallucinated local detail** — mitigated by corpus-only generation plus a validation pass. Biggest single credibility risk.
2. **Corpus doesn't scale by hand** — true today. Honest answer: city one is manual on purpose, and we learn the schema before we automate it.
3. **Outreach quality** — the drafts have to be sendable, not obviously AI. E's founder calls are the test: "would you send this as written?"
4. **Is this a vitamin?** — counter with the founder quotes about the hours lost, not with our own estimate.
