#!/usr/bin/env node
// Numbers we state to the user have to be true. The loading screen said
// "Ranking 50 verified local opportunities" while the corpus held 60 — a claim
// a local judge can check in ten seconds, which is exactly the credibility the
// curated corpus is supposed to buy us.
import { readFileSync } from 'node:fs';

const corpus = JSON.parse(readFileSync(new URL('../data/corpus.boston.json', import.meta.url), 'utf8'));
const sample = readFileSync(new URL('../src/data/samplePlan.ts', import.meta.url), 'utf8');

let fails = 0;
const check = (label, cond, detail = '') => {
  if (!cond) fails++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond ? '' : ` — ${detail}`}`);
};

const declared = Number(/export const CORPUS_SIZE = (\d+)/.exec(sample)?.[1]);
check('CORPUS_SIZE is declared', Number.isFinite(declared), 'not found in src/data/samplePlan.ts');
check(`CORPUS_SIZE matches the corpus file`, declared === corpus.length,
  `UI says ${declared}, data/corpus.boston.json has ${corpus.length}`);

// No literal count should be hardcoded in user-facing copy alongside the word
// "verified" — that is how the 50/60 drift happened in the first place.
const loading = readFileSync(new URL('../src/screens/LoadingScreen.tsx', import.meta.url), 'utf8');
check('the loading copy does not hardcode a count',
  !/\d+\s+verified/.test(loading), 'use ${CORPUS_SIZE}');

// The home screen shows real corpus names from a generated file. If the corpus
// changes and nobody re-runs the generator, the screen quietly shows stale
// evidence for a claim about verified data.
const namesFile = readFileSync(new URL('../src/data/corpusNames.ts', import.meta.url), 'utf8');
const generated = [...namesFile.matchAll(/"name": "((?:[^"\\]|\\.)*)"/g)]
  .map(m => JSON.parse(`"${m[1]}"`));
check('corpusNames.ts has every corpus entry', generated.length === corpus.length,
  `generated ${generated.length}, corpus has ${corpus.length} — run node scripts/build-corpus-names.mjs`);
const missing = corpus.map(e => e.name).filter(n => !generated.includes(n));
check('every generated name matches the corpus', missing.length === 0,
  `${missing.length} out of sync, e.g. ${missing[0] ?? ''}`);

console.log(`\n${fails} failure(s).`);
process.exit(fails ? 1 : 0);
