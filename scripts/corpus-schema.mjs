// Single source of truth for the corpus contract.
// Person B: these nine fields + `id` are what you get. Nothing else.

export const TYPES = ['event', 'person_org', 'channel'];

export const REQUIRED_FIELDS = [
  'id', 'type', 'name', 'url', 'date_or_cadence',
  'who_it_serves', 'tags', 'why_it_matters', 'cost', 'contact_route',
];

export function validateEntry(e, i) {
  const errs = [];
  const where = `[${i}] ${e?.name ?? e?.id ?? 'unnamed'}`;

  for (const f of REQUIRED_FIELDS) {
    const v = e?.[f];
    const empty = v === undefined || v === null || v === '' ||
      (Array.isArray(v) && v.length === 0);
    if (empty) errs.push(`${where}: missing "${f}"`);
  }
  if (e?.type && !TYPES.includes(e.type)) {
    errs.push(`${where}: type "${e.type}" not one of ${TYPES.join('|')}`);
  }
  if (e?.url && !/^https?:\/\//.test(e.url)) {
    errs.push(`${where}: url must be absolute http(s)`);
  }
  if (e?.tags && !Array.isArray(e.tags)) {
    errs.push(`${where}: tags must be an array`);
  }
  if (e?.id && !/^(evt|org|chn)-[a-z0-9-]+$/.test(e.id)) {
    errs.push(`${where}: id "${e.id}" must match evt-|org-|chn- + kebab slug`);
  }
  return errs;
}

export function validateCorpus(entries) {
  const errs = entries.flatMap(validateEntry);
  const seen = new Map();
  entries.forEach((e, i) => {
    if (seen.has(e.id)) errs.push(`[${i}] duplicate id "${e.id}" (first at ${seen.get(e.id)})`);
    else seen.set(e.id, i);
  });
  return errs;
}
