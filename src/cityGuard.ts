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

export { SUPPORTED_CITY };

export interface CityCheck {
  /** True when we can generate a real plan for this input. */
  covered: boolean;
  /** True before the founder has typed anything — not an error state. */
  empty: boolean;
}

export function checkCity(input: string): CityCheck {
  const normalised = input.trim().toLowerCase();
  if (!normalised) return { covered: false, empty: true };
  // Substring match so "Boston — Allston & Cambridge" and "allston, ma" both pass.
  const covered = COVERED.some((c) => normalised.includes(c));
  return { covered, empty: false };
}
