// Person B is sourcing the corpus. We don't control its shape, so normalise it
// here rather than letting B's field names leak into the matcher and the UI.
//
// To plug in B's data: add a mapping below. Nothing else changes.

export const CANONICAL_FIELDS = [
  'id', 'type', 'name', 'url', 'date_or_cadence',
  'who_it_serves', 'tags', 'why_it_matters', 'cost', 'contact_route',
];

const TYPE_ALIASES = {
  event: 'event', events: 'event', meetup: 'event', conference: 'event',
  accelerator: 'person_org', person: 'person_org', org: 'person_org',
  organization: 'person_org', organisation: 'person_org', people: 'person_org',
  person_org: 'person_org', investor: 'person_org', journalist: 'person_org',
  channel: 'channel', channels: 'channel', community: 'channel',
  grant: 'channel', grants: 'channel', newsletter: 'channel', subreddit: 'channel',
};

const PREFIX = { event: 'evt', person_org: 'org', channel: 'chn' };

const slug = s => String(s ?? '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);

const firstOf = (o, ...keys) => {
  for (const k of keys) if (o?.[k] !== undefined && o[k] !== null && o[k] !== '') return o[k];
  return undefined;
};

/** Normalise one raw entry from any source into the canonical ten fields. */
export function adaptEntry(raw, i = 0) {
  const type = TYPE_ALIASES[String(firstOf(raw, 'type', 'category', 'kind') ?? '')
    .toLowerCase().trim()] ?? 'channel';

  const name = firstOf(raw, 'name', 'title', 'org', 'organisation') ?? `entry-${i}`;
  const id = firstOf(raw, 'id', 'slug') ?? `${PREFIX[type]}-${slug(name)}`;

  let tags = firstOf(raw, 'tags', 'topics', 'categories') ?? [];
  if (typeof tags === 'string') tags = tags.split(/[,;|]/);
  tags = tags.map(t => slug(t)).filter(Boolean);

  return {
    id: String(id),
    type,
    name: String(name),
    url: String(firstOf(raw, 'url', 'link', 'website') ?? ''),
    date_or_cadence: String(firstOf(raw, 'date_or_cadence', 'date', 'cadence',
      'when', 'schedule') ?? 'Check the site for current dates'),
    who_it_serves: String(firstOf(raw, 'who_it_serves', 'audience', 'for_whom') ?? ''),
    tags,
    why_it_matters: String(firstOf(raw, 'why_it_matters', 'why', 'description',
      'summary') ?? ''),
    cost: String(firstOf(raw, 'cost', 'price', 'fee') ?? 'Unknown'),
    contact_route: String(firstOf(raw, 'contact_route', 'contact', 'how_to_reach',
      'apply') ?? 'See website'),
  };
}

/** Normalise a whole corpus and drop anything that can't be used. */
export function adaptCorpus(raw) {
  const entries = (Array.isArray(raw) ? raw : raw?.entries ?? []).map(adaptEntry);
  const seen = new Set();
  const kept = [];
  const dropped = [];
  for (const e of entries) {
    if (!e.url || !/^https?:\/\//.test(e.url)) { dropped.push({ e, why: 'no usable url' }); continue; }
    if (!e.why_it_matters) { dropped.push({ e, why: 'no why_it_matters' }); continue; }
    if (seen.has(e.id)) { dropped.push({ e, why: 'duplicate id' }); continue; }
    seen.add(e.id);
    kept.push(e);
  }
  return { entries: kept, dropped };
}
