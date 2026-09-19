/**
 * Reading the Boston corpus from Supabase, and recording the founder's intake.
 *
 * Everything here degrades instead of throwing. Person A set that rule in
 * `lib/db.mjs` and it holds on stage: a dropped connection must never be the
 * reason the demo shows an error screen.
 */

import { supabase } from './supabase';
import type { CorpusEntry, ItemStatus } from '../types';
import type { BuiltProfile } from '../../lib/profile.mjs';

/** The nine agreed fields plus the id. Mirrors the `corpus_for_prompt` view. */
const CORPUS_COLUMNS =
  'id, type, name, url, date_or_cadence, who_it_serves, tags, why_it_matters, cost, contact_route, last_verified';

export interface CorpusResult {
  entries: CorpusEntry[];
  /** False when we fell back to bundled data — surface this, don't hide it. */
  live: boolean;
  error?: string;
}

/**
 * Fetch the verified corpus. The anon key has SELECT on this table by policy,
 * so no auth step is needed.
 */
export async function fetchCorpus(city = 'Boston'): Promise<CorpusResult> {
  if (!supabase) return { entries: [], live: false, error: 'Supabase not configured' };

  const { data, error } = await supabase
    .from('corpus_entries')
    .select(CORPUS_COLUMNS)
    .eq('city', city);

  if (error) {
    console.warn(`[corpus] read failed: ${error.message}`);
    return { entries: [], live: false, error: error.message };
  }
  return { entries: (data ?? []) as CorpusEntry[], live: true };
}

/**
 * Persist the intake.
 *
 * The id is generated here rather than read back, because RLS grants the anon
 * key INSERT but not SELECT on `founder_profiles` — `insert().select()` would
 * fail. That is deliberate: it stops one founder reading the next one's intake.
 */
export async function saveProfile(
  profile: BuiltProfile,
): Promise<{ saved: boolean; id: string | null; error?: string }> {
  if (!supabase) return { saved: false, id: null, error: 'Supabase not configured' };

  const id = randomId();
  const row = {
    id,
    building: profile.building,
    city: profile.city,
    neighbourhood: profile.neighbourhood,
    stage: profile.stage,
    customer: profile.customer,
    goal: profile.goal,
    already_tried: profile.already_tried,
    signals: profile.signals,
    city_supported: profile.city_supported,
  };

  const { error } = await supabase.from('founder_profiles').insert(row);
  if (error) {
    console.warn(`[corpus] profile not saved: ${error.message}`);
    return { saved: false, id: null, error: error.message };
  }
  return { saved: true, id };
}

/**
 * MVP+ — record what the founder actually did, so a later generation can skip
 * it. `item_status` grants anon INSERT and UPDATE (migration 002), and the
 * table is unique on (profile_id, item_id), so upsert is the right verb.
 */
export async function saveItemStatus(
  profileId: string | null,
  itemId: string,
  state: ItemStatus,
): Promise<boolean> {
  if (!supabase || !profileId) return false;

  const { error } = await supabase
    .from('item_status')
    .upsert(
      { profile_id: profileId, item_id: itemId, state, updated_at: new Date().toISOString() },
      { onConflict: 'profile_id,item_id' },
    );

  if (error) {
    console.warn(`[corpus] status not saved: ${error.message}`);
    return false;
  }
  return true;
}

/**
 * RFC 4122 v4 id. React Native has no `node:crypto`, and `crypto.randomUUID`
 * is missing on some Android JSC builds, so fall back to Math.random — these
 * ids are row keys, not secrets.
 */
function randomId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
