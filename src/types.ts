/**
 * The data contract between the corpus (Person A), the generation layer
 * (Person B) and this interface (Person C).
 *
 * Nothing in the UI reads a field that is not declared here. When the real
 * layer lands it replaces `src/data/samplePlan.ts` and nothing else.
 */

/** The three buckets from the spec. Also drives colour and ordering. */
export type ItemType = 'event' | 'person_org' | 'channel';

/**
 * A single verified corpus entry. This is Person A's agreed schema, field for
 * field — do not add or rename keys without agreeing the change.
 */
export interface CorpusEntry {
  type: ItemType;
  name: string;
  url: string;
  /** "Thu 9 Oct 2026, 6pm" for a dated event, "Every other Tuesday" for a cadence. */
  date_or_cadence: string;
  who_it_serves: string;
  tags: string[];
  why_it_matters: string;
  /** "Free", "$25", "Free to apply" — always a human string, never a number. */
  cost: string;
  /** Public organisational route only: a contact page, a published tip line, a mod mail. */
  contact_route: string;
}

/**
 * A corpus entry after the model has ranked it against one founder profile and
 * written its drafts. `why_you_why_now` is the product — never render an item
 * without it.
 */
export interface PlanItem extends CorpusEntry {
  id: string;
  /** 1-10 across the whole plan, not per bucket. */
  rank: number;
  why_you_why_now: string;
  /**
   * The pre-written pitch. Required for `person_org` items (~80 words).
   * Absent for events and most channels.
   */
  draft?: {
    channel: 'email' | 'dm' | 'post';
    subject?: string;
    body: string;
  };
  /** Events only: the one line to say when you walk up to someone. */
  opener?: string;
}

/** One of the five time-boxed actions in the Week One Plan. */
export interface PlanAction {
  id: string;
  /** "Tuesday" — the day, kept loose so the plan survives a late start. */
  day: string;
  /** "20 min" */
  duration: string;
  /** Optional clock time for anything anchored to an event. */
  time?: string;
  title: string;
  detail: string;
  /** Links the action back to the items it acts on, so the UI can cross-reference. */
  itemIds: string[];
}

/** The whole generated plan — one model call produces exactly this object. */
export interface Plan {
  city: string;
  generatedAt: string;
  headline: string;
  items: PlanItem[];
  week_one: {
    actions: PlanAction[];
    /** "1 hr 50 min" — precomputed so the UI never does date maths. */
    total_time: string;
  };
}

/** F1 intake — the six fields, nothing more. */
export interface IntakeProfile {
  building: string;
  city: string;
  stage: string;
  customer: string;
  goal: string;
  tried: string;
}

export const STAGE_OPTIONS = [
  'Just an idea',
  'Building it',
  'Launched, few users',
  'Launched, growing',
] as const;

export const GOAL_OPTIONS = [
  'Users',
  'Pilot customers',
  'Funding',
  'Press',
] as const;

/** MVP+ — per-item progress so a second generation can avoid repeats. */
export type ItemStatus = 'todo' | 'done' | 'skipped';

export const BUCKETS: { type: ItemType; label: string; blurb: string }[] = [
  {
    type: 'event',
    label: 'Events',
    blurb: 'Go to this, on this date, because this crowd is your customer.',
  },
  {
    type: 'person_org',
    label: 'People & orgs',
    blurb: 'These people cover exactly your space. The email is written.',
  },
  {
    type: 'channel',
    label: 'Channels',
    blurb: 'Where your customers already are, and what it costs to show up.',
  },
];
