#!/usr/bin/env node
// The frontend city guard is the gate a judge actually hits, so it gets tests.
// Transpiles src/cityGuard.ts in memory — no build step, runs in the test suite.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const ts = createRequire(import.meta.url)('typescript');

const src = readFileSync(new URL('../src/cityGuard.ts', import.meta.url), 'utf8')
  .replace(/^import .*$/m, 'const SUPPORTED_CITY = "Boston";');
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { checkCity } = await import(
  'data:text/javascript;base64,' + Buffer.from(js).toString('base64'));

const CASES = [
  // covered
  ['Boston', true], ['Boston, MA', true], ['Cambridge', true], ['allston, ma', true],
  ['Boston — Allston & Cambridge', true], ['Jamaica Plain', true],
  ['Somerville MA', true], ['Cambridge, MA 02139', true],
  // same-named cities elsewhere — these all passed before the word-boundary fix
  ['Boston, Lincolnshire, UK', false], ['Cambridge, England', false],
  ['Somerville, NJ', false], ['Bostonia, Ecuador', false],
  // plain misses
  ['Lisbon', false], ['Dublin', false], ['', false],
];

let bad = 0;
for (const [input, want] of CASES) {
  const r = checkCity(input);
  const ok = r.covered === want;
  if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${JSON.stringify(input).padEnd(32)} ` +
              `covered=${r.covered}${r.reason ? '  — ' + r.reason : ''}`);
}
console.log(`\n${bad} failure(s).`);
process.exit(bad ? 1 : 0);
