/**
 * The app's Supabase client. Anon key only.
 *
 * `lib/db.mjs` is Person A's server-side client and cannot be reused here — it
 * imports `node:crypto`, which does not exist in React Native, and it prefers
 * the service_role key, which must never reach a client bundle.
 *
 * What the anon key can do, per `supabase/schema.sql`:
 *   - SELECT corpus_entries          (policy "corpus public read")
 *   - INSERT founder_profiles        (policy "profiles anon insert")
 *   - INSERT generated_plans         (policy "plans anon insert")
 *   - INSERT/UPDATE item_status      (migration 002)
 * It deliberately cannot SELECT founder_profiles, so one founder can never read
 * another's intake. Any read-back here would fail by design.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Null when the app is running without configuration. Every caller must handle
 * that: persistence is an MVP+ nicety and is not allowed to break a live demo.
 */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          // No accounts in the MVP, and React Native has no localStorage.
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

export const isSupabaseConfigured = supabase !== null;

if (!isSupabaseConfigured && __DEV__) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY not set — ' +
      'running on bundled sample data.',
  );
}

/**
 * Guard against the one mistake that would matter: a service_role key pasted
 * into the EXPO_PUBLIC_ slot would ship in the bundle and hand every user full
 * database access, bypassing RLS. Cheap to check, catastrophic to miss.
 */
if (__DEV__ && anonKey && typeof atob === 'function') {
  try {
    const payload = JSON.parse(atob(anonKey.split('.')[1]));
    if (payload?.role !== 'anon') {
      console.error(
        `[supabase] SECURITY: EXPO_PUBLIC_SUPABASE_ANON_KEY has role "${payload?.role}", ` +
          'not "anon". A service_role key in the client bundle bypasses RLS. Replace it.',
      );
    }
  } catch {
    // Malformed key is the connection's problem, not this check's.
  }
}
