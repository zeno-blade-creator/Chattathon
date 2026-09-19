// The boundary between what a human clicks and what the database accepts.
//
// The intake screen shows "Pilot customers"; founder_profiles.goal has a CHECK
// constraint that only accepts 'pilot-customers'. Every insert from the UI as
// written today fails. Person C is fixing the screen to submit codes, but this
// layer stays: it is the difference between a bad request and a 500, and it
// costs nothing.

import { STAGES, GOALS } from './profile.mjs';

const STAGE_MAP = {
  'just an idea': 'idea',
  'idea': 'idea',
  'building it': 'building',
  'building': 'building',
  'launched, few users': 'launched',
  'launched': 'launched',
  'launched, growing': 'early-revenue',
  'early revenue': 'early-revenue',
  'early-revenue': 'early-revenue',
  'raising': 'raising',
  'fundraising': 'raising',
};

const GOAL_MAP = {
  'users': 'users',
  'pilot customers': 'pilot-customers',
  'pilot-customers': 'pilot-customers',
  'funding': 'funding',
  'press': 'press',
};
// Note: no entries here for cofounders / mentors / advisors / hiring. Mapping a
// label to a value the CHECK constraint rejects turns a clean "unrecognised
// goal" into a throw inside buildProfile, which generatePlanSafe then hides
// behind the fallback plan. Add the value to GOALS and the constraint first.

const norm = s => String(s ?? '').trim().toLowerCase();

/** @returns {string|null} a value the CHECK constraint will accept, or null. */
export function normalizeStage(input) {
  const k = norm(input);
  if (STAGES.includes(k)) return k;
  return STAGE_MAP[k] ?? null;
}

/** @returns {string|null} a value the CHECK constraint will accept, or null. */
export function normalizeGoal(input) {
  const k = norm(input);
  if (GOALS.includes(k)) return k;
  return GOAL_MAP[k] ?? null;
}

/**
 * Accepts the frontend's IntakeProfile (which calls it `tried`, not
 * `already_tried`) and returns the shape lib/profile.mjs expects.
 */
export function normalizeIntake(raw = {}) {
  const stage = normalizeStage(raw.stage);
  const goal  = normalizeGoal(raw.goal);
  const problems = [];
  if (!raw.building?.trim()) problems.push('building is required');
  if (!raw.city?.trim())     problems.push('city is required');
  if (!raw.customer?.trim()) problems.push('customer is required');
  if (!stage) problems.push(`unrecognised stage: ${JSON.stringify(raw.stage)}`);
  if (!goal)  problems.push(`unrecognised goal: ${JSON.stringify(raw.goal)}`);

  return {
    ok: problems.length === 0,
    problems,
    profile: {
      building:      raw.building?.trim() ?? '',
      city:          raw.city?.trim() ?? '',
      neighbourhood: raw.neighbourhood?.trim() || raw.neighborhood?.trim() || null,
      stage,
      customer:      raw.customer?.trim() ?? '',
      goal,
      // the UI calls this `tried`; the column is `already_tried`
      already_tried: (raw.already_tried ?? raw.tried ?? '').trim() || null,
    },
  };
}
