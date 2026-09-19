// The seam. Intake in, finished plan out, one function.
//
// intake -> validate -> city gate -> corpus -> match -> generate -> join -> save
//
// Person C calls this (or the HTTP endpoint that wraps it) and renders the
// result. Nothing else needs to be understood to use it.

import { buildProfile } from './profile.mjs';
import { loadCorpus } from './corpus.mjs';
import { adaptCorpus } from './corpus-adapter.mjs';
import { buildGenerationInput } from './match.mjs';
import { generatePlan } from './generate.mjs';
import { saveProfile, savePlan } from './db.mjs';

const BUCKET_LABEL = {
  event: 'Events',
  person_org: 'People & orgs',
  channel: 'Channels & grants',
};

/**
 * @returns {Promise<
 *   | {status:'invalid', errors:string[]}
 *   | {status:'unsupported_city', city:string, reason:string, supported:string}
 *   | {status:'ok', plan:object, meta:object}>}
 */
export async function generateGtmPlan(intake, opts = {}) {
  const t0 = Date.now();

  // 1. Validate. Errors are already written for a human — render them as-is.
  let profile;
  try {
    profile = buildProfile(intake);
  } catch (err) {
    return { status: 'invalid', errors: err.errors ?? [err.message] };
  }

  // 2. The honesty gate. We cover one metro and say so rather than inventing.
  if (!profile.city_supported) {
    return {
      status: 'unsupported_city',
      city: profile.city,
      reason: profile.city_reason ?? 'outside our coverage',
      supported: 'Boston, Cambridge, Somerville and Greater Boston',
    };
  }

  // 3. Corpus (Supabase, or the bundled seed if it's unreachable).
  const { entries: raw, source } = await loadCorpus();
  const { entries: corpus, dropped } = adaptCorpus(raw);

  // 4. Deterministic shortlist. Free, and it shrinks the prompt by ~60%.
  const input = buildGenerationInput(corpus, profile, opts);

  // 5. One model call for all ten items, their reasons and every draft.
  const generated = await generatePlan(input, opts);

  // 6. Join the facts back on. The model supplied ids and prose only, so every
  //    name, URL, date and cost here comes from the verified corpus.
  const byId = new Map(input.candidates.map(c => [c.id, c]));
  const items = generated.items.map(item => {
    const e = byId.get(item.id);
    return {
      id: e.id,
      bucket: BUCKET_LABEL[e.type],
      type: e.type,
      name: e.name,
      url: e.url,
      when: e.date_or_cadence,
      cost: e.cost,
      contact_route: e.contact_route,
      why_you_why_now: item.why_you_why_now,
      draft: item.draft || null,
      opener: item.opener || null,
      match_score: e._match_score,
    };
  });

  const plan = { headline: generated.headline, items, week_one: generated.week_one };

  // 7. Persist. Never blocks, never throws.
  const saved = opts.skipSave ? { saved: false, id: null } : await saveProfile(profile);
  if (saved.id) await savePlan(saved.id, plan, { model: generated._model ?? generated._source });

  return {
    status: 'ok',
    plan,
    meta: {
      profile_id: saved.id,
      corpus_source: source,
      corpus_size: corpus.length,
      corpus_dropped: dropped.length,
      candidates_sent: input.candidates.length,
      generator: generated._source,
      model: generated._model ?? null,
      usage: generated._usage ?? null,
      rejected_ids: generated._rejected_ids ?? [],
      total_minutes: (generated.week_one ?? []).reduce((a, w) => a + (w.minutes ?? 0), 0),
      elapsed_ms: Date.now() - t0,
    },
  };
}
