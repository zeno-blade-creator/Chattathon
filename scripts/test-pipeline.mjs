#!/usr/bin/env node
// Smoke tests for the seam. Runs offline with the stub generator.
import { generateGtmPlan } from '../lib/pipeline.mjs';

let fails = 0;
const check = (label, cond, detail = '') => {
  if (!cond) fails++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond ? '' : ` — ${detail}`}`);
};

const good = {
  building: 'an app that helps people find pickup sports games nearby',
  city: 'Boston', neighbourhood: 'Jamaica Plain', stage: 'launched',
  customer: 'people in their 20s who just moved here', goal: 'users',
};
const opts = { skipSave: true, forceStub: true };

const ok = await generateGtmPlan(good, opts);
check('valid intake returns ok', ok.status === 'ok', ok.status);
check('ten items', ok.plan.items.length === 10, `${ok.plan.items.length}`);
check('five week-one actions', ok.plan.week_one.length === 5);
check('every item has why_you_why_now',
  ok.plan.items.every(i => i.why_you_why_now?.length > 30));
check('every item has a real url',
  ok.plan.items.every(i => /^https?:\/\//.test(i.url)));
check('person_org items carry a draft',
  ok.plan.items.filter(i => i.type === 'person_org').every(i => i.draft?.length > 60));
check('events carry an opener',
  ok.plan.items.filter(i => i.type === 'event').every(i => i.opener?.length > 10));
check('no invented ids survived', ok.meta.rejected_ids.length === 0);
check('week one is a few hours, not a job',
  ok.meta.total_minutes > 30 && ok.meta.total_minutes <= 360, `${ok.meta.total_minutes}min`);

const lisbon = await generateGtmPlan({ ...good, city: 'Lisbon', neighbourhood: null }, opts);
check('Lisbon hits the waitlist path', lisbon.status === 'unsupported_city', lisbon.status);

const ukBoston = await generateGtmPlan({ ...good, city: 'Boston, Lincolnshire, UK', neighbourhood: null }, opts);
check('UK Boston hits the waitlist path', ukBoston.status === 'unsupported_city', ukBoston.status);

const blank = await generateGtmPlan({}, opts);
check('blank intake is rejected with human errors',
  blank.status === 'invalid' && blank.errors.length >= 3);

// The guarantee: the model cannot smuggle in an item that isn't in the corpus.
const { enforceAllowedIds } = await import('../lib/generate.mjs');
const poisoned = enforceAllowedIds(
  { items: [{ id: 'evt-lisbon-fake-meetup' }, { id: 'evt-venture-cafe-thursday' }] },
  ['evt-venture-cafe-thursday']);
check('invented id is dropped',
  poisoned.items.length === 1 && poisoned._rejected_ids.includes('evt-lisbon-fake-meetup'));

console.log(`\n${fails} failure(s).`);
process.exit(fails ? 1 : 0);
