// Supabase write path for the profile side.
//
// Degrades instead of throwing: if Supabase isn't configured or is unreachable,
// we return { saved: false } and the caller carries on. Persistence is a nice
// MVP+ property; it is not allowed to break a live demo.

import { createClient } from '@supabase/supabase-js';

let _client = null;
function client() {
  if (_client !== undefined && _client !== null) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  _client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return _client;
}

const COLUMNS = ['building', 'city', 'neighbourhood', 'stage', 'customer',
                 'goal', 'already_tried', 'signals', 'city_supported'];

/**
 * @param {object} profile output of buildProfile()
 * @returns {Promise<{saved: boolean, id: string|null, error?: string}>}
 */
export async function saveProfile(profile) {
  const db = client();
  if (!db) return { saved: false, id: null, error: 'Supabase not configured' };

  const row = Object.fromEntries(COLUMNS.map(c => [c, profile[c] ?? null]));
  const { data, error } = await db
    .from('founder_profiles').insert(row).select('id').single();

  if (error) {
    console.warn(`[db] profile not saved: ${error.message}`);
    return { saved: false, id: null, error: error.message };
  }
  return { saved: true, id: data.id };
}

/**
 * Store one generated plan. `item_ids` is what makes MVP+ possible:
 * next week's generation can exclude what this founder already saw.
 */
export async function savePlan(profileId, plan, { model = null } = {}) {
  const db = client();
  if (!db || !profileId) return { saved: false, id: null };

  const itemIds = [...new Set(
    (plan?.items ?? []).map(i => i.id ?? i.corpus_id).filter(Boolean))];

  const { data, error } = await db.from('generated_plans')
    .insert({ profile_id: profileId, plan, item_ids: itemIds, model })
    .select('id').single();

  if (error) {
    console.warn(`[db] plan not saved: ${error.message}`);
    return { saved: false, id: null, error: error.message };
  }
  return { saved: true, id: data.id };
}

/** Corpus ids this founder has already been shown. Feeds MVP+ de-duping. */
export async function seenItemIds(profileId) {
  const db = client();
  if (!db || !profileId) return [];
  const { data, error } = await db.from('generated_plans')
    .select('item_ids').eq('profile_id', profileId);
  if (error) return [];
  return [...new Set((data ?? []).flatMap(r => r.item_ids ?? []))];
}

/** True when Supabase is reachable and the corpus table has rows. */
export async function healthCheck() {
  const db = client();
  if (!db) return { ok: false, reason: 'SUPABASE_URL / key not set' };
  const { count, error } = await db
    .from('corpus_entries').select('*', { count: 'exact', head: true });
  if (error) return { ok: false, reason: error.message };
  return { ok: true, corpusRows: count };
}
