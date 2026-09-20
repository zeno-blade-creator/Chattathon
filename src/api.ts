/**
 * The only network call this app makes to our own code.
 *
 * It talks to the generation server, never to Gemini or Tavily directly —
 * those need API keys, and everything in this bundle is public. The server
 * holds the keys; the app sends a profile and gets a finished plan.
 */
import { SAMPLE_META, SAMPLE_PLAN } from './data/samplePlan';
import type { IntakeProfile, Plan, PlanMeta } from './types';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

/**
 * The GitHub Pages build is static hosting with no server to reach, so it
 * defaults to the recorded plan instead of showing a network error.
 */
const SHOWCASE = process.env.EXPO_PUBLIC_SHOWCASE === '1';

/** 'ai' calls the real model. 'demo' serves the recorded plan instantly. */
export type Mode = 'ai' | 'demo';

export const DEFAULT_MODE: Mode = SHOWCASE ? 'demo' : 'ai';

export type GenerateResult =
  | { status: 'ready'; plan: Plan; profileId: string | null; fallbackUsed: boolean;
      meta?: PlanMeta; ms?: number }
  | { status: 'unsupported_city'; city: string; message: string }
  | { status: 'failed'; error: string };

// SAMPLE_META describes the real run that produced SAMPLE_PLAN, so the
// pipeline panel stays truthful in demo mode rather than showing zeroes.
const recorded = (): GenerateResult =>
  ({ status: 'ready', plan: SAMPLE_PLAN, profileId: null, fallbackUsed: true,
     meta: SAMPLE_META });

export async function generatePlan(p: IntakeProfile, mode: Mode = DEFAULT_MODE): Promise<GenerateResult> {
  // Offline insurance: instant, identical every time, and immune to a dead
  // network or a rate-limited model thirty seconds before you present.
  if (mode === 'demo') return recorded();

  try {
    const res = await fetch(`${BASE}/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // stage and goal are already slugs ('early-revenue', 'pilot-customers'),
      // which is exactly what the CHECK constraints accept. No mapping needed.
      body: JSON.stringify({
        building: p.building,
        city: p.city,
        customer: p.customer,
        stage: p.stage,
        goal: p.goal,
        tried: p.tried,
      }),
    });
    const body = await res.json();
    if (!res.ok && body?.status !== 'unsupported_city') {
      return SHOWCASE ? recorded() : { status: 'failed', error: body?.error ?? `HTTP ${res.status}` };
    }
    return body as GenerateResult;
  } catch (e: any) {
    if (SHOWCASE) return recorded();
    return { status: 'failed', error: e?.message ?? 'Could not reach the generation server on :8787.' };
  }
}
