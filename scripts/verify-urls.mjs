#!/usr/bin/env node
// The verification standard: every entry must have a working URL.
// HEAD first, GET fallback (many sites 405 a HEAD). Concurrency-limited.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const path = process.argv[2] ?? 'data/corpus.boston.json';
const entries = JSON.parse(readFileSync(path, 'utf8'));
const CONCURRENCY = 8;
// Sites whose WAF 403s any scripted request. Confirmed live by hand; see the file.
const MANUAL = existsSync('data/verified-manually.json')
  ? JSON.parse(readFileSync('data/verified-manually.json', 'utf8')).entries
  : {};
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
           '(KHTML, like Gecko) Chrome/125.0 Safari/537.36';

async function probe(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 15000);
      const res = await fetch(url, {
        method, redirect: 'follow', signal: ac.signal,
        headers: { 'user-agent': UA, accept: '*/*' },
      });
      clearTimeout(t);
      if (res.ok) return { ok: true, status: res.status, final: res.url };
      if (method === 'GET') return { ok: false, status: res.status, final: res.url };
    } catch (err) {
      if (method === 'GET') return { ok: false, status: 0, error: String(err.name ?? err) };
    }
  }
  return { ok: false, status: 0 };
}

const results = [];
let cursor = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (cursor < entries.length) {
    const e = entries[cursor++];
    const r = MANUAL[e.id]
      ? { ok: true, status: 'manual', manual: true }
      : await probe(e.url);
    results.push({ id: e.id, name: e.name, url: e.url, ...r });
    process.stdout.write(r.manual ? 'm' : r.ok ? '.' : 'X');
  }
}));
process.stdout.write('\n');

const bad = results.filter(r => !r.ok);
const today = new Date().toISOString().slice(0, 10);
const okIds = new Set(results.filter(r => r.ok).map(r => r.id));
writeFileSync(path, JSON.stringify(
  entries.map(e => okIds.has(e.id) ? { ...e, last_verified: today } : e), null, 2) + '\n');

const manual = results.filter(r => r.manual).length;
console.log(`\n${results.length - bad.length}/${results.length} URLs live `
  + `(${results.length - bad.length - manual} probed, ${manual} hand-checked).`);
if (bad.length) {
  console.log('\nFAILED — fix or drop these before seeding:');
  bad.forEach(b => console.log(`  ${b.status || b.error}  ${b.id}  ${b.url}`));
  process.exit(1);
}
