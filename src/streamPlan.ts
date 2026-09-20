/**
 * The streaming client.
 *
 * POST /generate/stream returns server-sent events, one per pipeline stage, so
 * the loading screen can render the work as it happens rather than animating a
 * timer and hoping the timing roughly matches. POST rather than EventSource
 * because the profile is free text and would not survive a query string.
 *
 * Streaming is an enhancement, never the only path: anything that goes wrong
 * here resolves to `null` and the caller falls back to plain POST /generate.
 */
import type { GenerateResult } from './api';
import type { IntakeProfile } from './types';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

export interface StageEvent {
  name: string;
  data: Record<string, any>;
  /** ms since the request started, so the UI can show real timings. */
  at: number;
}

export type OnStage = (event: StageEvent) => void;

/** True when this runtime can read a streamed response body. */
export const canStream =
  typeof fetch === 'function' && typeof TextDecoder === 'function';

export async function streamPlan(
  p: IntakeProfile,
  onStage: OnStage,
): Promise<GenerateResult | null> {
  if (!canStream) return null;
  const t0 = Date.now();

  let res: Response;
  try {
    res = await fetch(`${BASE}/generate/stream`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        building: p.building, city: p.city, customer: p.customer,
        stage: p.stage, goal: p.goal, tried: p.tried,
      }),
    });
  } catch {
    return null;
  }

  const body = (res as any).body;
  if (!res.ok || !body?.getReader) return null;

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: GenerateResult | null = null;

  const handle = (raw: string) => {
    let name = 'message';
    const dataLines: string[] = [];
    for (const line of raw.split('\n')) {
      if (line.startsWith('event:')) name = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }
    if (dataLines.length === 0) return;
    let data: Record<string, any>;
    try { data = JSON.parse(dataLines.join('\n')); } catch { return; }

    onStage({ name, data, at: Date.now() - t0 });

    if (name === 'done') {
      result = {
        status: 'ready', plan: data.plan, profileId: data.profileId ?? null,
        fallbackUsed: Boolean(data.fallbackUsed), meta: data.meta, ms: data.ms,
      };
    } else if (name === 'unsupported_city') {
      result = { status: 'unsupported_city', city: data.city, message: data.message };
    } else if (name === 'failed') {
      result = { status: 'failed', error: data.error ?? 'generation failed' };
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // SSE frames are separated by a blank line.
      let split: number;
      while ((split = buffer.indexOf('\n\n')) !== -1) {
        handle(buffer.slice(0, split));
        buffer = buffer.slice(split + 2);
      }
    }
    if (buffer.trim()) handle(buffer);
  } catch {
    return result;   // partial is still better than nothing
  }

  // A stream that ended without a terminal event is a failure, not a success.
  return result;
}
