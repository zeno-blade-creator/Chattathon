#!/usr/bin/env node
// Regression tests for the generation layer. No API keys: the model call and
// Tavily are injected, so this runs offline and free in the normal suite.
import { loadCorpusLocal } from '../lib/corpus.mjs';
import { adaptCorpus } from '../lib/corpus-adapter.mjs';
import { generatePlan } from '../lib/generate.mjs';

const { entries: corpus } = adaptCorpus(loadCorpusLocal());
let fails = 0;
const check = (label, cond, detail = '') => {
  if (!cond) fails++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond ? '' : ` — ${detail}`}`);
};

const INTAKE = {
  building: 'an app that helps people find pickup sports games in their neighbourhood',
  city: 'Boston', neighbourhood: 'Jamaica Plain', stage: 'launched',
  customer: 'people in their 20s who just moved to the city', goal: 'users',
};

const FAKE_LIVE = [{
  id: 'live-northeastern-edu-entrepreneurs-club', type: 'person_org',
  name: 'Northeastern Entrepreneurs Club', url: 'https://www.northeastern.edu/eclub',
  date_or_cadence: 'Check the page for current dates',
  who_it_serves: 'student founders', tags: ['live'], why_it_matters: 'campus club',
  cost: 'See page', contact_route: 'Public page', source: 'live',
}];

// Capture what the model is actually sent, and reply with a valid plan.
let sent = null;
const fakeModel = async ({ user }) => {
  sent = JSON.parse(user);
  // Pick the live id plus nine curated ones — a model that has been told live
  // items are selectable would do exactly this.
  const liveIds = sent.allowed_ids.filter(i => i.startsWith('live-'));
  const ids = [...liveIds, ...sent.allowed_ids.filter(i => !i.startsWith('live-'))].slice(0, 10);
  return {
    model: 'fake', usage: {},
    data: {
      headline: 'Your week in Boston',
      items: ids.map((id, i) => ({
        id, rank: i + 1, why_you_why_now: `Specific reason number ${i + 1} for this founder.`,
        draft: { channel: 'email', body: 'A short, plausible outreach note.' },
      })),
      week_one: { actions: [{ day: 'Tuesday', duration: '20 min', title: 'Send two emails',
                              detail: 'Send the drafted emails.', itemIds: [ids[0]] }] },
    },
  };
};

const opts = { generateJSON: fakeModel, discoverLocal: async () => FAKE_LIVE };
const { plan, meta } = await generatePlan(corpus, INTAKE, opts);

// The bug this file exists for: live ids were absent from allowed_ids, so the
// model could never pick one and Tavily was paid for and discarded.
const liveInAllowed = sent.allowed_ids.filter(i => i.startsWith('live-'));
check('live ids reach the model in allowed_ids', liveInAllowed.length === FAKE_LIVE.length,
  `${liveInAllowed.length} of ${FAKE_LIVE.length}`);
check('allowed_ids matches the candidate list exactly',
  sent.allowed_ids.length === sent.candidates.length,
  `${sent.allowed_ids.length} ids vs ${sent.candidates.length} candidates`);
check('a live item can actually be selected', meta.liveUsed >= 1, `liveUsed=${meta.liveUsed}`);

check('facts come from the corpus, not the model',
  plan.items.every(i => /^https?:\/\//.test(i.url) && i.name && i.date_or_cadence));
check('items are ranked 1..n with no gaps',
  plan.items.every((i, n) => i.rank === n + 1));
check('week_one itemIds all reference kept items',
  plan.week_one.actions.every(a => a.itemIds.every(id => plan.items.some(i => i.id === id))));

// Enforcement: an invented id must never reach the page.
const poison = async ({ user }) => {
  const ids = JSON.parse(user).allowed_ids;
  return { model: 'fake', usage: {}, data: {
    headline: 'x',
    items: [
      { id: 'evt-totally-invented-lisbon-meetup', rank: 1, why_you_why_now: 'Invented.' },
      ...ids.slice(0, 5).map((id, i) => ({ id, rank: i + 2, why_you_why_now: 'Real reason here.' })),
    ],
    week_one: { actions: [] } } };
};
const bad = await generatePlan(corpus, INTAKE, { ...opts, generateJSON: poison });
check('invented id is rejected',
  !bad.plan.items.some(i => i.id === 'evt-totally-invented-lisbon-meetup'));
check('rejection is reported in meta',
  bad.meta.rejected.includes('evt-totally-invented-lisbon-meetup'), JSON.stringify(bad.meta.rejected));

// The city gate still fires before any model call.
for (const [label, city] of [['Lisbon', 'Lisbon'], ['Boston UK', 'Boston, Lincolnshire, UK']]) {
  let code = null;
  try { await generatePlan(corpus, { ...INTAKE, city, neighbourhood: null }, opts); }
  catch (e) { code = e.code; }
  check(`${label} is refused before the model call`, code === 'CITY_UNSUPPORTED', String(code));
}

console.log(`\n${fails} failure(s).`);
process.exit(fails ? 1 : 0);
