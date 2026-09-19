#!/usr/bin/env node
// Push the versioned JSON corpus into Supabase. Idempotent (upsert on id).
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { validateCorpus } from './corpus-schema.mjs';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example).');
  process.exit(1);
}

const path = process.argv[2] ?? 'data/corpus.boston.json';
const entries = JSON.parse(readFileSync(path, 'utf8'));

const errs = validateCorpus(entries);
if (errs.length) {
  console.error('Refusing to seed an invalid corpus:');
  errs.forEach(e => console.error('  ' + e));
  process.exit(1);
}

const rows = entries.map(e => ({
  id: e.id, city: e.city ?? 'Boston', type: e.type, name: e.name, url: e.url,
  date_or_cadence: e.date_or_cadence, who_it_serves: e.who_it_serves,
  tags: e.tags, why_it_matters: e.why_it_matters, cost: e.cost,
  contact_route: e.contact_route,
  last_verified: e.last_verified ?? new Date().toISOString().slice(0, 10),
}));

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { error } = await supabase.from('corpus_entries').upsert(rows, { onConflict: 'id' });
if (error) { console.error('Seed failed:', error.message); process.exit(1); }

const { count } = await supabase
  .from('corpus_entries').select('*', { count: 'exact', head: true });
console.log(`Seeded ${rows.length} entries. Table now holds ${count}.`);
