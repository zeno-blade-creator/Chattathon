#!/usr/bin/env node
// Structural gate. Runs offline, in milliseconds. Run before every seed.
import { readFileSync } from 'node:fs';
import { validateCorpus } from './corpus-schema.mjs';

const path = process.argv[2] ?? 'data/corpus.boston.json';
const entries = JSON.parse(readFileSync(path, 'utf8'));
const errs = validateCorpus(entries);

const counts = entries.reduce((a, e) => ({ ...a, [e.type]: (a[e.type] ?? 0) + 1 }), {});
console.log(`${path}: ${entries.length} entries`, counts);

if (errs.length) {
  console.error(`\n${errs.length} validation error(s):`);
  errs.forEach(e => console.error('  ' + e));
  process.exit(1);
}
console.log('valid');
