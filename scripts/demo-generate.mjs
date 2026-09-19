// End-to-end: corpus + a profile -> one Gemini call -> a validated Plan.
//   node --env-file=.env scripts/demo-generate.mjs
import { loadCorpusLocal } from '../lib/corpus.mjs';
import { generatePlan }    from '../lib/generate.mjs';

const PROFILE = {
  building: 'A mobile app that helps Northeastern students find and split the cost of last-minute campus event tickets',
  city: 'Boston',
  neighbourhood: 'Fenway',
  stage: 'Building it',            // deliberately the UI label, not the enum
  customer: 'Northeastern undergrads aged 18-22 who go to 2+ campus events a month',
  goal: 'Pilot customers',         // deliberately the UI label
  tried: 'Posted in two Northeastern Discord servers and put up flyers in Snell Library',
};

const t0 = Date.now();
const corpus = loadCorpusLocal();
const { plan, meta } = await generatePlan(corpus, PROFILE);
const ms = Date.now() - t0;

console.log(`\n${plan.headline}\n${'='.repeat(70)}`);
for (const i of plan.items) {
  console.log(`\n${i.rank}. [${i.type}] ${i.name}`);
  console.log(`   ${i.date_or_cadence} · ${i.cost}`);
  console.log(`   ${i.url}`);
  console.log(`   WHY: ${i.why_you_why_now}`);
  if (i.opener) console.log(`   SAY: ${i.opener}`);
  if (i.draft)  console.log(`   DRAFT (${i.draft.channel}): ${i.draft.body.slice(0,160)}...`);
}
console.log(`\nWEEK ONE (${plan.week_one.total_time})\n${'-'.repeat(70)}`);
for (const a of plan.week_one.actions) console.log(`  ${a.day} · ${a.duration} — ${a.title}\n      ${a.detail}`);
console.log(`\n--- meta ---`);
console.log(`model=${meta.model} ms=${ms} candidates=${meta.candidates} items=${plan.items.length}`);
console.log(`rejected (hallucinated ids blocked): ${meta.rejected.length ? meta.rejected.join(', ') : 'none'}`);
console.log(`tokens=${JSON.stringify(meta.usage)}`);
