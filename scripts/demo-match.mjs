#!/usr/bin/env node
// End-to-end check of the profile -> signals -> shortlist path. No network, no cost.
import { loadCorpusLocal } from '../lib/corpus.mjs';
import { adaptCorpus } from '../lib/corpus-adapter.mjs';
import { buildProfile } from '../lib/profile.mjs';
import { buildGenerationInput } from '../lib/match.mjs';

const RAW = {
  building: 'A mobile app that helps people in my neighbourhood find and join pickup sports games happening today',
  city: 'Boston',
  neighbourhood: 'Jamaica Plain',
  stage: 'launched',
  customer: 'People in their 20s and 30s who just moved to the city and want to meet people',
  goal: 'users',
  already_tried: 'Posted on Instagram a few times, told my friends. No budget, it is just me and I cannot code.',
};

const { entries: corpus } = adaptCorpus(loadCorpusLocal());
const profile = buildProfile(RAW);

console.log('CITY GATE   :', profile.city_supported ? `supported (${profile.city_matched})` : 'NOT SUPPORTED');
console.log('SIGNALS     :', profile.signals.join(', '));

const input = buildGenerationInput(corpus, profile);
console.log(`\nSHORTLIST   : ${input.candidates.length} of ${corpus.length} entries sent to the model\n`);

for (const c of input.candidates.slice(0, 10)) {
  console.log(`  ${String(c._match_score).padStart(3)}  [${c.type.padEnd(10)}] ${c.name}`);
  console.log(`       ${c._match_reasons.join(' · ')}`);
}

const before = JSON.stringify(corpus).length;
const after  = JSON.stringify(input.candidates).length;
console.log(`\nTOKEN SAVING: ${before} -> ${after} chars (${Math.round(100 - after / before * 100)}% smaller prompt)`);

// The city gate must actually reject.
const lisbon = buildProfile({ ...RAW, city: 'Lisbon', neighbourhood: null });
console.log('LISBON GATE :', lisbon.city_supported ? 'FAIL — accepted Lisbon' : 'correctly rejected');
