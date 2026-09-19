/**
 * Types for `lib/profile.mjs` (Person A). The module is dependency-free, so
 * Metro bundles it into the app unchanged — the city gate and the signal
 * derivation have exactly one implementation across backend and front end.
 *
 * Keep in step with profile.mjs. If Person A adds an export, add it here.
 */

export type Stage = 'idea' | 'building' | 'launched' | 'early-revenue' | 'raising';
export type Goal = 'users' | 'pilot-customers' | 'funding' | 'press';

export declare const STAGES: readonly Stage[];
export declare const GOALS: readonly Goal[];
export declare const SUPPORTED_CITY_TERMS: readonly string[];

export interface CityCheck {
  supported: boolean;
  /** The covered term that matched, e.g. "cambridge". Null when unsupported. */
  matched: string | null;
  /** Human-readable explanation when unsupported, else null. */
  reason: string | null;
}

export declare function checkCity(input?: string): CityCheck;
export declare function isSupportedCity(input?: string): boolean;

/** The six intake fields as the form collects them. */
export interface RawProfile {
  building: string;
  city: string;
  neighbourhood?: string | null;
  stage: Stage;
  customer: string;
  goal: Goal;
  already_tried?: string | null;
}

/** RawProfile after validation, normalisation and signal derivation. */
export interface BuiltProfile {
  building: string;
  city: string;
  neighbourhood: string | null;
  stage: Stage;
  customer: string;
  goal: Goal;
  already_tried: string | null;
  signals: string[];
  city_supported: boolean;
  city_matched: string | null;
  city_reason: string | null;
}

export declare function deriveSignals(profile: Partial<RawProfile>): string[];
export declare function validateProfile(p: unknown): string[];

/** Throws an Error carrying `.errors: string[]` when the profile is invalid. */
export declare function buildProfile(raw: RawProfile): BuiltProfile;
