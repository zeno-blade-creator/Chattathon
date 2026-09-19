/**
 * The only network call the app makes.
 *
 * It talks to the local generation server, never to Gemini, Tavily or Supabase
 * directly — those need API keys, and anything in this bundle is public.
 */
import { SAMPLE_PLAN } from './data/samplePlan';
import { GOAL_VALUES, STAGE_VALUES, type IntakeProfile, type Plan } from './types';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

/**
 * The GitHub Pages build has no generation server to talk to — Pages is static
 * hosting, and the server exists precisely so the API keys stay off the web.
 * Rather than showing a network error to anyone who opens the public link, that
 * build falls back to a real recorded plan and says so.
 */
const SHOWCASE = process.env.EXPO_PUBLIC_SHOWCASE === '1';

export type GenerateResult =
  | { status: 'ready'; plan: Plan; profileId: string | null; fallbackUsed: boolean }
  | { status: 'unsupported_city'; city: string; message: string }
  | { status: 'failed'; error: string };

export async function generatePlan(p: IntakeProfile): Promise<GenerateResult> {
  try {
    const res = await fetch(`${BASE}/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        building: p.building,
        city: p.city,
        customer: p.customer,
        tried: p.tried,
        // Labels are for humans; the CHECK constraints only accept the codes.
        stage: STAGE_VALUES[p.stage] ?? p.stage,
        goal: GOAL_VALUES[p.goal] ?? p.goal,
      }),
    });
    const body = await res.json();
    if (!res.ok && body?.status !== 'unsupported_city') {
      if (SHOWCASE) return { status: 'ready', plan: SAMPLE_PLAN, profileId: null, fallbackUsed: true };
      return { status: 'failed', error: body?.error ?? `HTTP ${res.status}` };
    }
    return body as GenerateResult;
  } catch (e: any) {
    if (SHOWCASE) {
      return { status: 'ready', plan: SAMPLE_PLAN, profileId: null, fallbackUsed: true };
    }
    return { status: 'failed', error: e?.message ?? 'network error' };
  }
}
