#!/usr/bin/env node
// The UI, the backend validator and the database CHECK constraints must agree
// on the same enum values. They drifted once: the intake screen offered
// "Cofounders" and "Mentors", which neither of the other two accepted, so
// picking them threw inside buildProfile and generatePlanSafe quietly served
// the canned fallback plan instead of an error.
import { readFileSync } from 'node:fs';
import { STAGES, GOALS } from '../lib/profile.mjs';
import { normalizeStage, normalizeGoal } from '../lib/normalize.mjs';

const ts = readFileSync(new URL('../src/types.ts', import.meta.url), 'utf8');
const sql = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');

const listOf = (name) => {
  const block = new RegExp(`export const ${name} = \\[([^\\]]*)\\]`).exec(ts);
  if (!block) throw new Error(`${name} not found in src/types.ts`);
  return [...block[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
};
const checkValues = (column) => {
  const block = new RegExp(`${column}\\s+text not null check \\(${column} in([\\s\\S]*?)\\)`).exec(sql);
  if (!block) throw new Error(`CHECK constraint for ${column} not found in schema.sql`);
  return [...block[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
};

let fails = 0;
const check = (label, cond, detail = '') => {
  if (!cond) fails++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond ? '' : ` — ${detail}`}`);
};

for (const [label, options, valid, column] of [
  ['goal',  listOf('GOAL_OPTIONS'),  GOALS,  'goal'],
  ['stage', listOf('STAGE_OPTIONS'), STAGES, 'stage'],
]) {
  const normalise = label === 'goal' ? normalizeGoal : normalizeStage;
  const mapped = options.map(o => [o, normalise(o)]);

  const unmapped = mapped.filter(([, v]) => v === null).map(([o]) => o);
  check(`every ${label} option normalises`, unmapped.length === 0, unmapped.join(', '));

  const rejected = mapped.filter(([, v]) => v && !valid.includes(v)).map(([o, v]) => `${o}->${v}`);
  check(`every ${label} option is accepted by the validator`, rejected.length === 0, rejected.join(', '));

  const dbValues = checkValues(column);
  const notInDb = mapped.filter(([, v]) => v && !dbValues.includes(v)).map(([, v]) => v);
  check(`every ${label} option satisfies the DB CHECK constraint`, notInDb.length === 0, notInDb.join(', '));

  check(`validator and DB agree on the ${label} set`,
    valid.length === dbValues.length && valid.every(v => dbValues.includes(v)),
    `code=[${valid}] db=[${dbValues}]`);
}

console.log(`\n${fails} failure(s).`);
process.exit(fails ? 1 : 0);
