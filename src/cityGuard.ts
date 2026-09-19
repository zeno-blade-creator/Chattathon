/**
 * The city gate, re-exported from Person A's `lib/profile.mjs`.
 *
 * This file used to carry its own substring implementation. It was wrong in
 * exactly the way Person A's adversarial suite catches: "Cambridge, England"
 * and "Boston, Lincolnshire" both matched and would have been served a
 * Massachusetts plan — the hallucinated-local-detail failure the whole pitch
 * is built on avoiding.
 *
 * `lib/profile.mjs` has no imports, so Metro bundles it as-is and the gate has
 * one implementation on both sides of the app.
 */

export { checkCity, isSupportedCity, SUPPORTED_CITY_TERMS } from '../lib/profile.mjs';
export type { CityCheck, Stage, Goal } from '../lib/profile.mjs';

export const SUPPORTED_CITY = 'Boston';
