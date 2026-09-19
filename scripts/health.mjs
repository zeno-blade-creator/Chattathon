#!/usr/bin/env node
// Is Supabase wired up correctly? Run this after seeding.
import { healthCheck } from '../lib/db.mjs';
import { loadCorpus } from '../lib/corpus.mjs';

const h = await healthCheck();
console.log(h.ok ? `Supabase OK — corpus_entries has ${h.corpusRows} rows`
                 : `Supabase NOT ready — ${h.reason}`);

const { entries, source } = await loadCorpus();
console.log(`loadCorpus() returned ${entries.length} entries from: ${source}`);
process.exit(h.ok ? 0 : 1);
