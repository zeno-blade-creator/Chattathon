// The generation layer: one model call per plan.
//
// Design note that carries the whole anti-hallucination story:
// **the model never writes a name, URL or date.** It returns corpus ids plus
// prose, and the pipeline joins the facts back from the corpus. So it is not
// merely instructed not to invent a Boston meetup — it has no field in which
// to put one. Any id it invents is dropped by a post-generation check.
//
// This also makes the call cheap: all ten items, their reasons and every draft
// come back in a single response, and the response carries no repeated facts.

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

export const MODEL = process.env.PLAN_MODEL ?? 'claude-opus-5';

const PlanItem = z.object({
  id: z.string().describe('The corpus id, copied exactly from the candidate list'),
  why_you_why_now: z.string().describe(
    'One or two sentences, addressed to this founder, on why THIS item suits ' +
    'THEIR product and THEIR goal, right now. Concrete and specific. No filler.'),
  draft: z.string().describe(
    'For a person_org item: a ready-to-send outreach email or DM of about 80 ' +
    'words, personalised to this founder and this recipient. Empty string for ' +
    'events and channels.'),
  opener: z.string().describe(
    'For an event item: one sentence to say when walking up to someone there. ' +
    'For a channel: one line on how to post without getting removed. Empty ' +
    'string for person_org items.'),
});

const WeekOneAction = z.object({
  day: z.string().describe('e.g. "Tuesday" or "Thursday 6pm"'),
  minutes: z.number().int().describe('Realistic time-box in minutes'),
  action: z.string().describe('Imperative and concrete, naming the items involved'),
});

export const PlanSchema = z.object({
  headline: z.string().describe('One sentence summarising the week ahead'),
  items: z.array(PlanItem).describe('Exactly 10 items, most valuable first'),
  week_one: z.array(WeekOneAction).describe('Exactly 5 actions, in the order to do them'),
});

const SYSTEM = `You are a local go-to-market strategist for Boston, Massachusetts.

You will be given one founder's profile and a list of CANDIDATE opportunities
drawn from a hand-verified Boston corpus.

Absolute rules:
1. You may ONLY reference candidates by their exact \`id\` from the list given.
   Never invent an event, organisation, channel, person, date, or URL.
2. Do not write event names, URLs, dates, or costs anywhere in your output.
   Those facts are joined in from the corpus afterwards. Write only the
   reasoning and the outreach copy.
3. If fewer than ten candidates genuinely suit this founder, return fewer.
   A short honest plan beats a padded one.

On quality — this is what the founder judges you on:
- "why_you_why_now" must be specific to THIS product and THIS goal. If the
  sentence would read the same for any startup, it is wrong. Reference what
  they are building and who their customer is.
- Drafts must be sendable as written by a real person. No "I hope this email
  finds you well", no "I wanted to reach out", no em-dash-laden AI cadence, no
  flattery. Short sentences. A specific reason for contacting THIS recipient,
  one concrete ask, and a sign-off. About 80 words.
- The founder is non-technical, solo, and has almost no budget. Do not suggest
  anything that assumes a team, an agency, or paid media.
- Week-one actions must total a few hours at most, and be ordered so the
  quickest wins come first.`;

const asUserMessage = input => JSON.stringify({
  profile: input.profile,
  candidates: input.candidates.map(c => ({
    id: c.id, type: c.type, name: c.name, who_it_serves: c.who_it_serves,
    tags: c.tags, why_it_matters: c.why_it_matters, cost: c.cost,
    date_or_cadence: c.date_or_cadence, contact_route: c.contact_route,
    match_reasons: c._match_reasons,
  })),
}, null, 1);

/**
 * Drop anything the model invented. This is the second half of the
 * anti-hallucination guarantee — the prompt is the first half, and prompts
 * are not a security boundary.
 */
export function enforceAllowedIds(plan, allowedIds) {
  const allowed = new Set(allowedIds);
  const kept = [];
  const rejected = [];
  const seen = new Set();
  for (const item of plan.items ?? []) {
    if (!allowed.has(item.id)) { rejected.push(item.id); continue; }
    if (seen.has(item.id)) { rejected.push(`${item.id} (duplicate)`); continue; }
    seen.add(item.id);
    kept.push(item);
  }
  return { ...plan, items: kept, _rejected_ids: rejected };
}

/** Deterministic plan from the shortlist. No API key, no network, no cost. */
export function stubGenerate(input) {
  const top = input.candidates.slice(0, 10);
  const goal = input.profile.goal.replace('-', ' ');
  const what = input.profile.building.replace(/\.$/, '');

  const items = top.map(c => ({
    id: c.id,
    why_you_why_now: `${c.why_it_matters} For ${what}, that lines up with your goal of ${goal}: ${(c._match_reasons ?? []).slice(0, 2).join(' and ') || 'it serves your customer directly'}.`,
    draft: c.type === 'person_org'
      ? `Hi — I'm building ${what} here in ${input.profile.city}. My users are ${input.profile.customer}. I saw that ${c.who_it_serves.toLowerCase()} is your focus, which is why I'm writing to you rather than a list. I'm at the ${input.profile.stage} stage and looking for ${goal}. Would you be open to a 15-minute call, or point me to whoever handles this? Either way, thanks for reading.`
      : '',
    opener: c.type === 'event'
      ? `Ask what they're working on first, then: "I'm building ${what} — who in ${input.profile.city} should I be talking to?"`
      : c.type === 'channel'
        ? `Read the rules, contribute twice without linking, then post a question rather than an announcement.`
        : '',
  }));

  const people = items.filter((_, i) => top[i].type === 'person_org').slice(0, 2);
  const events = top.filter(c => c.type === 'event').slice(0, 1);
  const channels = top.filter(c => c.type === 'channel').slice(0, 2);

  return {
    headline: `Five moves this week to get ${goal} for ${what} in ${input.profile.city}.`,
    items,
    week_one: [
      { day: 'Monday', minutes: 20, action: `Send the two drafted emails (${people.map(p => p.id).join(', ') || 'the top org items'}).` },
      { day: 'Tuesday', minutes: 30, action: `Post in ${channels[0]?.name ?? 'your top channel'} — a question, not an announcement.` },
      { day: 'Wednesday', minutes: 15, action: `Apply or register for ${events[0]?.name ?? 'the top event'}.` },
      { day: 'Thursday', minutes: 90, action: `Attend ${events[0]?.name ?? 'the event'}. Use the opener. Aim for five conversations, not fifty.` },
      { day: 'Friday', minutes: 25, action: `Follow up with everyone you met, and post in ${channels[1]?.name ?? 'your second channel'}.` },
    ],
    _source: 'stub',
  };
}

/**
 * One batched model call. Returns the same shape as stubGenerate().
 * Throws on API failure so the caller can decide to fall back.
 */
export async function claudeGenerate(input, { model = MODEL } = {}) {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model,
    max_tokens: 16000,
    system: SYSTEM,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'medium',
      format: zodOutputFormat(PlanSchema),
    },
    messages: [{ role: 'user', content: asUserMessage(input) }],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error(`refused: ${response.stop_details?.category ?? 'unknown'}`);
  }
  if (!response.parsed_output) {
    throw new Error('model returned unparseable output');
  }
  return {
    ...response.parsed_output,
    _source: 'claude',
    _model: response.model,
    _usage: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      cache_read: response.usage.cache_read_input_tokens ?? 0,
    },
  };
}

/** Never throws. Uses Claude when credentials exist, the stub otherwise. */
export async function generatePlan(input, opts = {}) {
  const hasCreds = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
  if (hasCreds && !opts.forceStub) {
    try {
      return enforceAllowedIds(await claudeGenerate(input, opts), input.allowed_ids);
    } catch (err) {
      console.warn(`[generate] model call failed (${err.message}); using stub.`);
    }
  }
  return enforceAllowedIds(stubGenerate(input), input.allowed_ids);
}
