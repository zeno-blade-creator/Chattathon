<h1 align="center">Inreach</h1>

<p align="center">
  <strong>The growth hire a pre-seed founder can't afford.</strong><br>
  It tells you the ten people, events and channels <em>in your city</em> to hit this week —<br>
  and writes the pitch for every one of them.
</p>

<p align="center">
  <a href="https://zeno-blade-creator.github.io/Chattathon/"><strong>Try the demo →</strong></a>
</p>

---

## The problem

Every week, a solo founder has to answer three questions:

> **Who do I talk to? Where do I show up? What do I say?**

She answers them by tab-hopping across Eventbrite, Meetup, LinkedIn, accelerator
sites, council grant pages and local press — then staring at a blank email.

It costs **6–8 hours a week.** More often she skips it, which is worse.

A contract growth marketer does this for $50–75/hr. That's a **$1,200–2,400/month
role** that a pre-seed founder simply does not have.

## What Inreach does

Six questions. About two minutes. You get:

**1. Ten ranked local opportunities** — events to attend, people and orgs to
contact, channels where your customers already are. Every one carries a
**"why you, why now"** line that ties *your* product, stage and customer to
*that* specific room. That line is the product. Without it we're a directory.

**2. The pitch, already written.** Every person and org comes with a
ready-to-send 80-word email. Not a template — written for your product and
their focus. Every event comes with the one sentence to say walking up to a
stranger.

**3. A five-step week.** Time-boxed, in order, with the total hours.
*"Tuesday, 30 min: send these two emails. Thursday 6pm: this event."*

## Why it can't make things up

This is the part that matters, and it's enforced in code rather than promised
in a prompt.

**The model is never trusted with a fact.** It receives a shortlist of verified
opportunities and returns only *judgement* — a ranking, a reason, a draft —
keyed by id. Every factual field on the page (name, URL, date, cost, how to get
in touch) is copied from the verified record *after* the model answers. Any id
the model returns that wasn't on the shortlist is dropped on the floor.

An invented meetup cannot reach the page, because the model was never the thing
that supplied the meetups.

Two sources feed it, both real:

| Source | What it is |
|---|---|
| **The corpus** | 60 hand-curated Boston entries, every URL opened and checked by a human |
| **Live discovery** | Retrieved from the web at request time for the long tail — a specific campus club, an event happening this month. Badged `live`. |

**And we cover exactly one city.** Type Lisbon and Inreach says *"we cover
Boston today"* instead of inventing a Lisbon meetup. That honesty is a feature
we pitch, not an error state.

## Proof it's actually generating

Two different founders, same system, **zero overlap** in ten results:

| | Grid-scale battery startup, raising | Dog-grooming marketplace, idea stage |
|---|---|---|
| **1** | Greentown Labs | Nextdoor — Boston neighbourhoods |
| **2** | The Engine (MIT tough-tech fund) | r/BostonSocialClub |
| **3** | MassVentures (state-backed) | SCORE Boston — free mentorship |

## Run it

```bash
npm install
cp .env.example .env     # add your Gemini, Tavily and Supabase keys
npm run server           # generation server on :8787
npm run web              # the app on :8081
```

The app has a **Live AI / Demo** switch. Demo serves a recorded plan instantly
and offline — insurance for a bad network on stage.

## How it fits together

```
  Expo app ──profile──▶ generation server ──▶ Gemini   (ranks, writes, never invents)
  (no keys)  ◀──plan──   (:8787, holds keys) ──▶ Tavily  (live local discovery)
                                │
                                └──▶ Supabase  (60-entry corpus, profiles, saved plans)
```

The server exists for one reason: **API keys are passwords, and anything in the
app bundle is public.** The app only ever sends a profile.

## Honest limits

- **One city.** Boston, Cambridge, Somerville and neighbours. By design, and we
  say so out loud rather than faking coverage.
- **The corpus is hand-built.** City one is manual on purpose — we learn the
  schema before we automate it. Ask us how entry #61 gets made; we have an answer.
- **A plan takes 20–40 seconds.** One batched model call, roughly a third of a
  cent. Regenerating weekly costs the same, which is the business model.

## Roadmap

**Next:** weekly regeneration that remembers what you already did, so it becomes
a service rather than a report. **Then:** a second city, proving the corpus
process is repeatable. **Later:** outcome tracking — which events and emails
actually produced customers, fed back into the ranking.

---

<p align="center"><sub>
Built at Chattathon · <a href="docs/CORPUS.md">Corpus &amp; data contract</a> ·
<a href="docs/HANDOFF.md">Generation layer</a> · <a href="SUPABASE_SETUP.md">Database setup</a>
</sub></p>
