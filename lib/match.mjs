// The join: a founder profile on one side, the corpus on the other.
//
// This runs before the model call and costs nothing. It exists for two reasons:
//   1. Person B sends the model a relevant shortlist, not the whole corpus —
//      that's most of the token saving in the "one call per plan" story.
//   2. A deterministic score means we can explain *why* an item surfaced,
//      independent of whatever the model says.

import { deriveSignals } from './profile.mjs';

const WEIGHTS = {
  tagMatch:        3,   // per overlapping signal/tag — the main event
  goalTag:         2,   // extra for a tag that directly serves the stated goal
  textMatch:       1,   // per profile keyword found in who_it_serves/why_it_matters
  freeBonus:       2,   // bootstrapped founders need free things
  localBonus:      2,   // their own neighbourhood/city term appears on the entry
  deadlinePenalty: 0,   // placeholder: dated items rank higher only if relevant
  notLocalPenalty: -2,  // tagged 'not-local' — still useful, but not the pitch
};

const GOAL_TAGS = {
  users:             ['consumer', 'early-adopters', 'hyperlocal', 'launch', 'product-launch'],
  'pilot-customers': ['b2b', 'network', 'chamber', 'intro-path', 'business'],
  funding:           ['grant', 'non-dilutive', 'vc', 'accelerator', 'funding', 'competition'],
  press:             ['press', 'tip-line', 'local-media', 'achievable'],
};

const STOP = new Set(['the','and','for','with','that','this','from','into','your','our',
  'app','platform','people','who','are','you','a','an','of','to','in','on','it','is','my']);

const keywords = p => [...new Set(
  `${p.building} ${p.customer} ${p.already_tried ?? ''}`
    .toLowerCase().match(/[a-z]{4,}/g) ?? [])]
  .filter(w => !STOP.has(w));

/**
 * Score one corpus entry against one profile.
 * @returns {{score:number, reasons:string[]}}
 */
export function scoreEntry(entry, profile, signals) {
  let score = 0;
  const reasons = [];
  const tags = entry.tags ?? [];
  const goalTags = GOAL_TAGS[profile.goal] ?? [];

  const overlap = tags.filter(t => signals.includes(t));
  if (overlap.length) {
    score += overlap.length * WEIGHTS.tagMatch;
    reasons.push(`matches your ${overlap.join(', ')}`);
  }

  const goalOverlap = tags.filter(t => goalTags.includes(t));
  if (goalOverlap.length) {
    score += goalOverlap.length * WEIGHTS.goalTag;
    reasons.push(`serves your goal of ${profile.goal.replace('-', ' ')}`);
  }

  const haystack = `${entry.who_it_serves} ${entry.why_it_matters} ${entry.name}`.toLowerCase();
  const kwHits = keywords(profile).filter(w => haystack.includes(w));
  if (kwHits.length) {
    score += Math.min(kwHits.length, 4) * WEIGHTS.textMatch;
    reasons.push(`mentions ${kwHits.slice(0, 3).join(', ')}`);
  }

  if (signals.includes('bootstrapped') && /free/i.test(entry.cost)) {
    score += WEIGHTS.freeBonus;
    reasons.push('free, which matters on your budget');
  }

  const localTerm = (profile.neighbourhood ?? profile.city ?? '').toLowerCase().split(/\s+/)[0];
  if (localTerm && localTerm.length > 3 && haystack.includes(localTerm)) {
    score += WEIGHTS.localBonus;
    reasons.push(`in ${profile.neighbourhood ?? profile.city}`);
  }

  if (tags.includes('not-local')) score += WEIGHTS.notLocalPenalty;

  return { score, reasons };
}

/**
 * Rank the corpus for one profile and return a balanced shortlist.
 *
 * Balance matters: ten items that are all events is a worse plan than
 * four events, four orgs and two channels, even if the raw scores disagree.
 *
 * @param {object[]} corpus  canonical entries (see corpus-adapter.mjs)
 * @param {object}   profile output of buildProfile()
 * @param {{perBucket?: object, total?: number}} opts
 */
export function shortlist(corpus, profile, opts = {}) {
  const perBucket = opts.perBucket ?? { event: 6, person_org: 8, channel: 6 };
  const signals = profile.signals ?? deriveSignals(profile);

  const scored = corpus
    .map(e => ({ entry: e, ...scoreEntry(e, profile, signals) }))
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));

  const out = [];
  for (const [type, n] of Object.entries(perBucket)) {
    out.push(...scored.filter(s => s.entry.type === type).slice(0, n));
  }
  return out.sort((a, b) => b.score - a.score);
}

/**
 * What Person B hands to the model: the shortlist plus the profile, already
 * trimmed. Keeping this in one function means the token cost of a generation
 * is visible in one place.
 */
export function buildGenerationInput(corpus, profile, opts = {}) {
  const picked = shortlist(corpus, profile, opts);
  return {
    profile: {
      building: profile.building,
      city: profile.city,
      neighbourhood: profile.neighbourhood,
      stage: profile.stage,
      customer: profile.customer,
      goal: profile.goal,
      already_tried: profile.already_tried,
      signals: profile.signals,
    },
    candidates: picked.map(({ entry, score, reasons }) => ({
      ...entry,
      _match_score: score,
      _match_reasons: reasons,
    })),
    // The model may only rank and personalise these ids. Person B: assert this.
    allowed_ids: picked.map(p => p.entry.id),
  };
}
