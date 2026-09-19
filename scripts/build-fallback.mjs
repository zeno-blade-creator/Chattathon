// Records one real, verified plan to disk. If the model or the network dies on
// stage, lib/generate.mjs serves this instead of an error. Regenerate with:
//   node --env-file=.env scripts/build-fallback.mjs
import { writeFileSync } from 'node:fs';
import { loadCorpusLocal } from '../lib/corpus.mjs';
import { generatePlan }    from '../lib/generate.mjs';

const { plan, meta } = await generatePlan(loadCorpusLocal(), {
  building: 'A mobile app that helps Northeastern students find and split the cost of last-minute campus event tickets',
  city: 'Boston', neighbourhood: 'Fenway', stage: 'building',
  customer: 'Northeastern undergrads aged 18-22 who go to 2+ campus events a month',
  goal: 'pilot-customers',
  tried: 'Posted in two Northeastern Discord servers and flyers in Snell Library',
});
writeFileSync('fixtures/fallback-plan.json', JSON.stringify(plan, null, 2));
const orgs = plan.items.filter(i => i.type === 'person_org');
console.log(`items=${plan.items.length}  orgs=${orgs.length}  withDrafts=${orgs.filter(i=>i.draft).length}`);
console.log(`draftsMissing=${meta.draftsMissing.length ? meta.draftsMissing.join(',') : 'none'}`);
console.log(`openers on events=${plan.items.filter(i=>i.type==='event'&&i.opener).length}/${plan.items.filter(i=>i.type==='event').length}`);
console.log('\n--- a real draft ---\n' + (orgs.find(i=>i.draft)?.draft.body ?? 'NONE'));
console.log('\nwrote fixtures/fallback-plan.json');
