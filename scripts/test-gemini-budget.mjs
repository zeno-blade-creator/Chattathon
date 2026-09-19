#!/usr/bin/env node
// The retry matrix is 4 models x 2 attempts. Without an overall budget a hung
// upstream costs 4 x 2 x timeoutMs before the fallback plan can be served —
// eight minutes at the 60s default, with the loading animation finished after
// three seconds. These tests pin the bound. No network: fetch is stubbed.
import { generateJSON, GeminiError } from '../lib/gemini.mjs';

process.env.GEMINI_API_KEY = 'test-key-not-real';
const realFetch = globalThis.fetch;
let fails = 0;
const check = (label, cond, detail = '') => {
  if (!cond) fails++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond ? '' : ` — ${detail}`}`);
};

// 1. A hung upstream must give up inside the budget, not 8x the per-call timeout.
let calls = 0;
globalThis.fetch = (_url, { signal } = {}) => {
  calls++;
  return new Promise((_res, rej) =>
    signal?.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' }))));
};

const BUDGET = 1500;
let t = Date.now();
let err = null;
try { await generateJSON({ system: 's', user: 'u', timeoutMs: 60000, budgetMs: BUDGET }); }
catch (e) { err = e; }
const elapsed = Date.now() - t;

check('a hung upstream rejects', err instanceof GeminiError, String(err));
check(`gives up within the budget (${elapsed}ms <= ${BUDGET + 600}ms)`, elapsed <= BUDGET + 600,
  `took ${elapsed}ms`);
check('did not run the full 8-call matrix', calls < 8, `${calls} calls`);

// 2. A rejected key must stop immediately, not be re-proved on every model.
calls = 0;
globalThis.fetch = async () => { calls++; return new Response('forbidden', { status: 403 }); };
t = Date.now();
err = null;
try { await generateJSON({ system: 's', user: 'u', budgetMs: 10000 }); } catch (e) { err = e; }
check('a 403 fails fast', err?.status === 403, String(err?.message).slice(0, 60));
check('a 403 is not retried across models', calls === 1, `${calls} calls`);

// 3. The happy path still works.
globalThis.fetch = async () => new Response(JSON.stringify({
  candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
  usageMetadata: { totalTokenCount: 42 },
}), { status: 200, headers: { 'content-type': 'application/json' } });
const good = await generateJSON({ system: 's', user: 'u', budgetMs: 10000 });
check('a good response parses', good.data?.ok === true);
check('usage is returned', good.usage?.totalTokenCount === 42);
check('the model that answered is reported', typeof good.model === 'string' && good.model.length > 0);

globalThis.fetch = realFetch;
console.log(`\n${fails} failure(s).`);
process.exit(fails ? 1 : 0);
