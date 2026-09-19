/**
 * We cover exactly one city. Outside it we say so plainly rather than
 * inventing a meetup — that honesty is part of the pitch, so the check lives
 * in its own module and is deliberately conservative.
 */

import { SUPPORTED_CITY } from './data/samplePlan';

/**
 * Boston proper plus the neighbourhoods and adjacent cities the corpus
 * genuinely covers. Anything here is treated as in-area.
 */
const COVERED = [
  'boston',
  'cambridge',
  'somerville',
  'allston',
  'brighton',
  'brookline',
  'charlestown',
  'dorchester',
  'roxbury',
  'jamaica plain',
  'south boston',
  'southie',
  'east boston',
  'back bay',
  'fenway',
  'seaport',
  'medford',
  'malden',
  'everett',
  'chelsea',
  'quincy',
  'newton',
  'watertown',
  'waltham',
];

/**
 * There is a Boston in Lincolnshire, a Cambridge in England, a Somerville in
 * New Jersey and a Newton in Kansas. A bare substring match sends all of them a
 * Massachusetts plan — the exact hallucinated-local-detail failure this gate
 * exists to prevent. So: word-boundary matching, then a check for geography
 * that rules Massachusetts out.
 */
const DISQUALIFIERS = [
  'uk', 'u.k.', 'england', 'britain', 'british', 'scotland', 'wales', 'ireland',
  'lincolnshire', 'canada', 'ontario', 'quebec', 'australia', 'new zealand',
  'ecuador', 'india', 'germany', 'france', 'spain', 'portugal', 'netherlands',
  'brazil', 'mexico', 'japan', 'china', 'singapore', 'south africa', 'nigeria',
  'kenya', 'philippines', 'poland', 'sweden', 'norway', 'denmark', 'finland',
  'new york', 'new jersey', 'pennsylvania', 'ohio', 'indiana', 'georgia',
  'texas', 'california', 'florida', 'virginia', 'maryland', 'minnesota',
  'wisconsin', 'illinois', 'michigan', 'alabama', 'tennessee', 'kentucky',
  'new hampshire', 'vermont', 'maine', 'connecticut', 'rhode island', 'kansas',
  'ny', 'nj', 'nh', 'vt', 'ct', 'ri', 'me', 'pa', 'oh', 'ga', 'tx', 'ca', 'fl',
];

/** If they said Massachusetts, believe them over a stray token like "ME". */
const QUALIFIERS = ['massachusetts', ' ma', 'ma,', ', ma', 'mass.', 'new england'];

const wordRe = (term: string) =>
  new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');

export { SUPPORTED_CITY };

export interface CityCheck {
  /** True when we can generate a real plan for this input. */
  covered: boolean;
  /** True before the founder has typed anything — not an error state. */
  empty: boolean;
  /** Which covered term matched, when covered. */
  matched?: string;
  /** Why we rejected a same-named city elsewhere, suitable for showing the user. */
  reason?: string;
}

export function checkCity(input: string): CityCheck {
  const normalised = input.trim().toLowerCase();
  if (!normalised) return { covered: false, empty: true };

  // Word-boundary, so "Boston — Allston & Cambridge" and "allston, ma" still
  // pass while "Bostonia, Ecuador" does not.
  const matched = COVERED.find((c) => wordRe(c).test(normalised));
  if (!matched) return { covered: false, empty: false };

  const saidMass = QUALIFIERS.some((q) => normalised.includes(q));
  const blocker = saidMass ? undefined : DISQUALIFIERS.find((d) => wordRe(d).test(normalised));
  if (blocker) {
    return { covered: false, empty: false, reason: `looks like ${matched} in ${blocker}, not Massachusetts` };
  }
  return { covered: true, empty: false, matched };
}
