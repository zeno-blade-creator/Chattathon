import { colors } from './theme';
import type { ItemType, PlanItem } from './types';

/** One place that decides how each bucket looks and reads. */
export function bucketStyle(t: ItemType) {
  switch (t) {
    case 'event':
      return { color: colors.event, soft: colors.eventSoft, label: 'Event' };
    case 'person_org':
      return { color: colors.person, soft: colors.personSoft, label: 'Person / org' };
    case 'channel':
      return { color: colors.channel, soft: colors.channelSoft, label: 'Channel' };
  }
}

/**
 * The plain-text form of one item, used by the per-item copy button so a
 * founder can paste a single opportunity into notes or a message to a cofounder.
 */
export function itemToText(item: PlanItem): string {
  const lines = [
    `${item.name}`,
    `${item.date_or_cadence} · ${item.cost}`,
    item.url,
    '',
    `Why you, why now: ${item.why_you_why_now}`,
  ];
  if (item.opener) lines.push('', `What to say: ${item.opener}`);
  if (item.draft) {
    lines.push('');
    if (item.draft.subject) lines.push(`Subject: ${item.draft.subject}`);
    lines.push(item.draft.body);
  }
  lines.push('', `Contact route: ${item.contact_route}`);
  return lines.join('\n');
}

/** The Week One Plan as pasteable text — F4 requires this to be copyable. */
export function weekOneToText(plan: {
  city: string;
  week_one: { total_time: string; actions: { day: string; time?: string; duration: string; title: string; detail: string }[] };
}): string {
  const head = [`WEEK ONE PLAN — ${plan.city}`, `Total time: ${plan.week_one.total_time}`, ''];
  const body = plan.week_one.actions.map((a, i) => {
    const when = a.time ? `${a.day} ${a.time}` : a.day;
    return `${i + 1}. ${when}, ${a.duration} — ${a.title}\n   ${a.detail}`;
  });
  return [...head, ...body].join('\n');
}
