// The generation layer. Profile in, Plan out.
//
// The no-hallucination guarantee is structural, not a promise in a prompt.
// The model is never trusted with a fact. It receives candidates and returns
// ONLY judgement — a rank, a "why you, why now" line, a draft, an opener —
// keyed by corpus id. Every factual field on the rendered plan (name, url,
// date, cost, contact route) is copied out of the corpus afterwards, so an
// invented event cannot reach the page even if the model tries to invent one.
// Ids the model returns that were not in allowed_ids are dropped on the floor.

import { buildProfile, checkCity } from './profile.mjs';
import { buildGenerationInput }    from './match.mjs';
import { generateJSON, GeminiError } from './gemini.mjs';
import { normalizeIntake }         from './normalize.mjs';
import { discoverLocal }           from './tavily.mjs';
import { readFileSync }            from 'node:fs';

const SYSTEM = `You are the growth strategist for a hyperlocal go-to-market copilot.

You are given ONE founder profile and a shortlist of VERIFIED local opportunities
(events, people/orgs, channels). Your job is judgement, not research.

HARD RULES — these are checked in code after you answer:
1. You may ONLY reference ids from allowed_ids. Never invent an event, an
   organisation, a person, a date, a URL or a price. If you are unsure, use
   fewer items.
2. Do not restate names, dates, URLs or costs. They are supplied. You write only
   why_you_why_now, draft, opener and rank.
2b. YOUR PROSE IS NOT EXEMPT FROM RULE 1. The structured fields are joined from
   the corpus, but why_you_why_now, draft and opener are free text and nothing
   checks them. Every factual claim you make there — a street, a neighbourhood,
   who attends, how often it meets, how many people come, what they work on —
   must already appear in that candidate's own fields. If the candidate does not
   say it, you do not know it. Write about the founder and the fit, which you
   can reason about, not about the venue, which you cannot. "Their open coaching
   hours are the cheapest advice you can get at your stage" is grounded;
   "it sits on Commonwealth Avenue and student organisers from adjacent campuses
   meet there weekly" is invention, and a local judge will catch it.
3. "why_you_why_now" is the product. It must join THIS founder's product, stage,
   customer and goal to THIS specific opportunity. "Great networking event" is a
   failure. "The Thursday crowd is half Northeastern undergrads building consumer
   apps — that is your first 50 users standing in one room, and it runs again in
   six days" is the standard. One or two sentences. Never generic.
4. Drafts are for person_org items. <=80 words, plain, specific, sendable by a
   real person with no edits. No "I hope this email finds you well", no
   "revolutionary", no em-dash-heavy AI cadence. Name what you want in one line.
5. Events get an "opener": the single sentence to say walking up to a stranger.
6. Return EXACTLY 10 items, ranked 1..10, best first. Aim for a mix of roughly
   4 events, 4 people/orgs and 2 channels. Use the allowed_ids you were given —
   there are always enough. Returning fewer than 10 is a failure.
7. EVERY person_org item MUST have a draft. No exceptions. That pre-written
   message is the single feature founders came for; an org with no draft is a
   directory listing and we are not a directory.
8. The week_one plan is FIVE actions, ordered, realistic for one week, each
   time-boxed. Anchor any event action to that event's real day.

Some candidates are marked source:"live" — found on the web just now rather than
hand-curated. Prefer a live item over a curated one when it is MORE SPECIFIC to
this founder: a campus entrepreneurship club for a student founder beats a
general city-wide meetup. Include at least one live item if any is genuinely
relevant. Their date_or_cadence is often unknown; say "check the page" rather
than inventing a date.

Stage awareness matters: an idea-stage founder needs conversations and
cofounders; a raising-stage founder needs investor rooms and warm intros. Rank
accordingly.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  required: ['headline', 'items', 'week_one'],
  properties: {
    headline: { type: 'string' },
    items: {
      type: 'array',
      minItems: 8,
      maxItems: 10,
      items: {
        type: 'object',
        required: ['id', 'rank', 'why_you_why_now'],
      propertyOrdering: ['id', 'rank', 'why_you_why_now', 'opener', 'draft'],
        properties: {
          id:   { type: 'string' },
          rank: { type: 'integer' },
          why_you_why_now: { type: 'string' },
          opener: { type: 'string' },
          draft: {
            type: 'object',
            required: ['channel', 'body'],
            properties: {
              channel: { type: 'string', enum: ['email', 'dm', 'post'] },
              subject: { type: 'string' },
              body:    { type: 'string' },
            },
          },
        },
      },
    },
    week_one: {
      type: 'object',
      required: ['actions'],
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            required: ['day', 'duration', 'title', 'detail'],
            properties: {
              day: { type: 'string' }, duration: { type: 'string' },
              time: { type: 'string' }, title: { type: 'string' },
              detail: { type: 'string' },
              itemIds: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
  },
};

const minutesOf = d => {
  const h = /(\d+)\s*(h|hr|hour)/i.exec(d ?? '');
  const m = /(\d+)\s*(m|min)/i.exec(d ?? '');
  return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0);
};

const humanTime = total => {
  if (!total) return '0 min';
  const h = Math.floor(total / 60), m = total % 60;
  return [h ? `${h} hr` : null, m ? `${m} min` : null].filter(Boolean).join(' ');
};

/**
 * @param {object[]} corpus  canonical corpus entries
 * @param {object}   intake  raw intake from the UI (labels allowed)
 * @returns {Promise<{plan:object, meta:object}>}
 */
export async function generatePlan(corpus, intake, opts = {}) {
  const { ok, problems, profile: normalised } = normalizeIntake(intake);
  if (!ok) { const e = new Error(problems.join('; ')); e.code = 'BAD_INTAKE'; throw e; }

  const city = checkCity(`${normalised.city ?? ''} ${normalised.neighbourhood ?? ''}`);
  if (!city.supported) { const e = new Error(`We cover Boston today, not ${normalised.city}.`);
    e.code = 'CITY_UNSUPPORTED'; e.city = normalised.city; throw e; }

  const profile = buildProfile(normalised);
  const input   = buildGenerationInput(corpus, profile, opts);

  // The curated corpus is the spine; Tavily adds the long tail it cannot cover
  // by hand (a specific campus club, an event happening this month). Both are
  // real retrieved URLs, so the model still never authors a fact.
  const discover = opts.discoverLocal ?? discoverLocal;
  const live = opts.live === false ? [] : await discover(profile);
  const candidates = [...input.candidates, ...live];
  const allowed    = new Set(candidates.map(c => c.id));
  const byId       = new Map(candidates.map(c => [c.id, c]));

  const callModel = opts.generateJSON ?? generateJSON;
  const { data, usage, model } = await callModel({
    system: SYSTEM,
    schema: RESPONSE_SCHEMA,
    user: JSON.stringify({
      profile: input.profile,
      // Must include the live ids, not just input.allowed_ids. The enforcement
      // pass below already accepts them, so omitting them here told the model
      // the opposite of what the code permits — Rule 1 ("only ids from
      // allowed_ids") then silently vetoed every Tavily result, and discovery
      // was paid for and discarded.
      allowed_ids: [...allowed],
      candidates: candidates.map(({ _match_score, _match_reasons, ...c }) => c),
    }),
  });

  // --- the enforcement pass -------------------------------------------------
  const rejected = [];
  const items = (data.items ?? [])
    .filter(it => {
      if (allowed.has(it?.id)) return true;
      rejected.push(it?.id ?? '(no id)');
      return false;
    })
    .map(it => {
      const entry = byId.get(it.id);
      return {
        // FACTS — from the corpus, never from the model
        id: entry.id,
        type: entry.type,
        name: entry.name,
        url: entry.url,
        date_or_cadence: entry.date_or_cadence,
        who_it_serves: entry.who_it_serves,
        tags: entry.tags ?? [],
        why_it_matters: entry.why_it_matters,
        cost: entry.cost,
        contact_route: entry.contact_route,
        ...(entry.source === 'live' ? { source: 'live' } : {}),
        // JUDGEMENT — from the model
        rank: Number(it.rank) || 99,
        why_you_why_now: String(it.why_you_why_now ?? '').trim(),
        ...(it.opener ? { opener: String(it.opener).trim() } : {}),
        ...(it.draft?.body ? { draft: {
          channel: ['email', 'dm', 'post'].includes(it.draft.channel) ? it.draft.channel : 'email',
          ...(it.draft.subject ? { subject: String(it.draft.subject) } : {}),
          body: String(it.draft.body).trim(),
        } } : {}),
      };
    })
    .filter(it => it.why_you_why_now.length > 0)   // an item without the line is not a product
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 10)
    .map((it, i) => ({ ...it, rank: i + 1 }));

  if (items.length < 3) { const e = new Error(`only ${items.length} valid items survived`);
    e.code = 'THIN_PLAN'; throw e; }

  // Ids that survived enforcement — week-one actions may only reference these.
  // (Named liveIds previously, which read as "the Tavily ones"; it is all of them.)
  const keptIds = new Set(items.map(i => i.id));
  const actions = (data.week_one?.actions ?? []).slice(0, 5).map((a, i) => ({
    id: `act-${i + 1}`,
    day: String(a.day ?? '').trim(),
    duration: String(a.duration ?? '20 min').trim(),
    ...(a.time ? { time: String(a.time) } : {}),
    title: String(a.title ?? '').trim(),
    detail: String(a.detail ?? '').trim(),
    itemIds: (a.itemIds ?? []).filter(id => keptIds.has(id)),
  })).filter(a => a.title && a.detail);

  const plan = {
    city: 'Boston',
    generatedAt: new Date().toISOString(),
    headline: String(data.headline ?? '').trim() || `Your week in Boston`,
    items,
    week_one: {
      actions,
      total_time: humanTime(actions.reduce((s, a) => s + minutesOf(a.duration), 0)),
    },
  };

  const orgs = items.filter(i => i.type === 'person_org');
  return { plan, meta: {
    model, usage, rejected,
    candidates: candidates.length,
    liveFound: live.length,
    liveUsed: items.filter(i => i.source === 'live').length,
    itemIds: items.map(i => i.id),
    // F3 coverage: a person_org with no draft is the one quality failure the
    // schema cannot catch, so it is reported rather than hidden.
    draftsMissing: orgs.filter(i => !i.draft).map(i => i.id),
  } };
}

export { GeminiError };


/**
 * What the server actually calls. A live demo must not show a stack trace, so
 * anything short of an unsupported city degrades to the last known-good plan
 * recorded by scripts/build-fallback.mjs.
 */
export async function generatePlanSafe(corpus, intake, opts = {}) {
  try {
    const r = await generatePlan(corpus, intake, opts);
    return { ...r, status: 'ready', fallbackUsed: false };
  } catch (err) {
    if (err.code === 'CITY_UNSUPPORTED') throw err;   // an honest answer, not a failure
    try {
      const plan = JSON.parse(readFileSync(new URL('../fixtures/fallback-plan.json', import.meta.url)));
      return { plan, meta: { error: err.message }, status: 'ready', fallbackUsed: true };
    } catch {
      throw err;
    }
  }
}
