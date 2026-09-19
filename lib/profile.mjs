// The founder profile: F1's six fields in, structured signals out.
//
// Person A owns this file. Its job is to turn what Aoife types into something
// that can be *joined* against the corpus — deterministically, before any model
// call. Everything here is pure functions and regexes: no network, no LLM, no cost.

export const STAGES = ['idea', 'building', 'launched', 'early-revenue', 'raising'];
export const GOALS  = ['users', 'pilot-customers', 'funding', 'press'];

export const SUPPORTED_CITY_TERMS = [
  'boston', 'cambridge', 'somerville', 'brookline', 'medford', 'malden',
  'everett', 'chelsea', 'quincy', 'newton', 'watertown', 'greater boston',
  // Boston neighbourhoods people type instead of "Boston"
  'allston', 'brighton', 'back bay', 'beacon hill', 'charlestown', 'dorchester',
  'east boston', 'fenway', 'hyde park', 'jamaica plain', 'mattapan',
  'mission hill', 'north end', 'roslindale', 'roxbury', 'seaport',
  'south boston', 'southie', 'south end', 'west roxbury', 'kendall',
  'davis square', 'union square', 'assembly',
];

/**
 * The city gate. We cover exactly one metro and say so out loud.
 * @returns {{supported: boolean, matched: string|null}}
 */
export function checkCity(input = '') {
  const s = String(input).toLowerCase();
  const matched = SUPPORTED_CITY_TERMS.find(t => s.includes(t)) ?? null;
  return { supported: matched !== null, matched };
}

// ---------------------------------------------------------------------------
// Signal vocabulary.
//
// Each signal is a tag that also appears on corpus entries, so matching is a
// set intersection rather than a fuzzy string compare. Add a term here and the
// join picks it up immediately — no model retraining, no prompt edit.
// ---------------------------------------------------------------------------

const SECTOR_TERMS = {
  climate:     ['climate', 'carbon', 'emissions', 'solar', 'energy', 'sustainab', 'clean tech', 'cleantech', 'ev ', 'battery'],
  ai:          ['ai ', 'a.i.', 'artificial intelligence', 'machine learning', ' ml ', 'llm', 'gpt', 'model', 'agent'],
  health:      ['health', 'medical', 'patient', 'clinic', 'therapy', 'mental health', 'wellness', 'fitness', 'biotech', 'pharma'],
  hardware:    ['hardware', 'device', 'robot', 'sensor', 'manufactur', 'physical product', 'prototype'],
  'deep-tech': ['research', 'lab', 'scientific', 'quantum', 'materials', 'phd'],
  consumer:    ['consumer', 'app for people', 'everyday', 'social app', 'dating', 'food', 'restaurant', 'fitness', 'travel', 'community app'],
  b2b:         ['b2b', 'business to business', 'saas', 'enterprise', 'teams', 'companies use', 'workflow', 'crm', 'dashboard for'],
  education:   ['education', 'student', 'learning', 'course', 'teach', 'school', 'tutor'],
  marketplace: ['marketplace', 'two-sided', 'buyers and sellers', 'gig', 'booking', 'platform connecting'],
};

const CUSTOMER_TERMS = {
  consumer:        ['people', 'consumers', 'users', 'residents', 'students', 'parents', 'commuters', 'anyone', 'individuals'],
  b2b:             ['businesses', 'companies', 'teams', 'startups', 'smb', 'small business', 'managers', 'enterprises'],
  'early-adopters':['early adopter', 'tech-savvy', 'beta', 'enthusiast'],
  neighbourhood:   ['neighbourhood', 'neighborhood', 'local residents', 'my street', 'my area'],
};

const CONSTRAINT_TERMS = {
  'non-technical': ['non-technical', 'not technical', "can't code", 'no engineer', 'no developer', 'no cto', 'need a technical'],
  bootstrapped:    ['bootstrap', 'no funding', 'self-funded', 'own money', 'no budget', 'broke'],
  'solo-founder':  ['solo', 'by myself', 'on my own', 'just me', 'single founder'],
  'women-founders':['woman founder', 'women founder', 'female founder', 'i am a woman'],
  underrepresented:['first-time founder', 'immigrant', 'underrepresented', 'minority-owned', 'first generation'],
};

// Goal is a dropdown, so this mapping is exact rather than inferred.
const GOAL_SIGNALS = {
  users:              ['consumer', 'early-adopters', 'free', 'reddit', 'social', 'hyperlocal', 'launch'],
  'pilot-customers':  ['b2b', 'chamber', 'network', 'business', 'community', 'intro-path'],
  funding:            ['grant', 'non-dilutive', 'vc', 'accelerator', 'funding', 'deadline', 'competition'],
  press:              ['press', 'tip-line', 'local-media', 'launch', 'achievable', 'product-launch'],
};

// Stage tells us what's realistic, not what sector they're in.
const STAGE_SIGNALS = {
  idea:            ['free', 'mentorship', 'advising', 'workshop', 'beginner'],
  building:        ['free', 'mentorship', 'feedback', 'networking', 'technical'],
  launched:        ['product-launch', 'press', 'consumer', 'early-adopters', 'speaking-slot'],
  'early-revenue': ['grant', 'business', 'chamber', 'b2b', 'awards'],
  raising:         ['vc', 'seed', 'pre-seed', 'accelerator', 'warm-intro', 'funding'],
};

const hit = (text, terms) => terms.some(t => text.includes(t));

function derive(text, table) {
  return Object.entries(table).filter(([, terms]) => hit(text, terms)).map(([k]) => k);
}

/**
 * Turn the six intake fields into the signal set used to match the corpus.
 * Deterministic and free — this is what lets Person B send a shortlist to the
 * model instead of all 60 entries.
 */
export function deriveSignals(profile) {
  const blob = [profile.building, profile.customer, profile.already_tried]
    .filter(Boolean).join(' ').toLowerCase();

  const signals = new Set([
    ...derive(blob, SECTOR_TERMS),
    ...derive(profile.customer?.toLowerCase() ?? '', CUSTOMER_TERMS),
    ...derive(blob, CONSTRAINT_TERMS),
    ...(GOAL_SIGNALS[profile.goal] ?? []),
    ...(STAGE_SIGNALS[profile.stage] ?? []),
  ]);

  // Geography is a signal too: a Cambridge founder should see Cambridge things first.
  const { matched } = checkCity(`${profile.city ?? ''} ${profile.neighbourhood ?? ''}`);
  if (matched) signals.add(matched.replace(/\s+/g, '-'));

  // If nothing sector-ish matched, assume consumer — that's our persona's default,
  // and an empty signal set would make the match layer return noise.
  if (![...signals].some(s => ['consumer', 'b2b'].includes(s))) signals.add('consumer');

  return [...signals].sort();
}

/** @returns {string[]} human-readable errors; empty means valid. */
export function validateProfile(p) {
  const errs = [];
  const req = { building: 'what you\'re building', city: 'your city',
                customer: 'who your customer is' };
  for (const [f, label] of Object.entries(req)) {
    if (!p?.[f] || !String(p[f]).trim()) errs.push(`Tell us ${label}.`);
  }
  if (p?.building && String(p.building).trim().length < 12) {
    errs.push('Give us a sentence on what you\'re building, not just a name.');
  }
  if (!STAGES.includes(p?.stage)) errs.push(`Stage must be one of: ${STAGES.join(', ')}.`);
  if (!GOALS.includes(p?.goal))   errs.push(`Goal must be one of: ${GOALS.join(', ')}.`);
  return errs;
}

/** Validate, normalise and enrich. Throws on invalid input. */
export function buildProfile(raw) {
  const errs = validateProfile(raw);
  if (errs.length) {
    const e = new Error('Invalid profile');
    e.errors = errs;
    throw e;
  }
  const { supported, matched } = checkCity(`${raw.city} ${raw.neighbourhood ?? ''}`);
  const profile = {
    building:      String(raw.building).trim(),
    city:          String(raw.city).trim(),
    neighbourhood: raw.neighbourhood ? String(raw.neighbourhood).trim() : null,
    stage:         raw.stage,
    customer:      String(raw.customer).trim(),
    goal:          raw.goal,
    already_tried: raw.already_tried ? String(raw.already_tried).trim() : null,
  };
  return {
    ...profile,
    signals: deriveSignals(profile),
    city_supported: supported,
    city_matched: matched,
  };
}
