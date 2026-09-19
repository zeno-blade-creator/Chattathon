// The corpus read path. Person B: this is your input.
//
// Tries Supabase first, falls back to the bundled JSON if the network or the
// project is unavailable. The fallback is deliberate: a dead wifi connection
// on stage must not kill the demo.

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const LOCAL = new URL('../data/corpus.boston.json', import.meta.url);

const PROMPT_FIELDS = [
  'id', 'type', 'name', 'url', 'date_or_cadence',
  'who_it_serves', 'tags', 'why_it_matters', 'cost', 'contact_route',
];

const pick = e => Object.fromEntries(PROMPT_FIELDS.map(f => [f, e[f]]));

export function loadCorpusLocal() {
  return JSON.parse(readFileSync(LOCAL, 'utf8')).map(pick);
}

/**
 * @returns {Promise<{entries: object[], source: 'supabase'|'local'}>}
 */
export async function loadCorpus({ city = 'Boston' } = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      const { data, error } = await supabase
        .from('corpus_entries')
        .select(PROMPT_FIELDS.join(','))
        .eq('city', city);
      if (error) throw error;
      if (data?.length) return { entries: data, source: 'supabase' };
    } catch (err) {
      console.warn(`[corpus] Supabase unavailable (${err.message}); using local seed.`);
    }
  }
  return { entries: loadCorpusLocal(), source: 'local' };
}

/** The one city we cover. Anything else must fail loudly, not invent a corpus. */
export const SUPPORTED_CITIES = ['Boston'];

// Re-exported from profile.mjs so there is exactly one city gate. An earlier
// substring version lived here and accepted "Boston, Lincolnshire, UK".
export { checkCity, isSupportedCity } from './profile.mjs';
