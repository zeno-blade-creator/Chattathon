// Live hyperlocal discovery, layered on top of the curated corpus.
//
// The corpus (Supabase) is the organisational spine: 60 hand-verified Boston
// entries that never move. Tavily's job is the long tail the corpus cannot
// cover by hand — a specific university club, a meetup for one niche, an event
// happening this month.
//
// This does NOT weaken the no-hallucination guarantee. Every entry produced
// here carries a URL that Tavily actually retrieved from the live web; nothing
// is authored by a model. A live entry is marked source:'live' so the interface
// can distinguish "we verified this by hand" from "we found this just now".

const ENDPOINT = 'https://api.tavily.com/search';

const slug = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '').slice(0, 48);

/** Queries are built from the profile, so a climate founder and a consumer
 *  app founder get genuinely different long tails. */
function buildQueries(profile) {
  const city = profile.neighbourhood ? `${profile.neighbourhood} Boston` : 'Boston';
  const what = String(profile.building ?? '').split(/\s+/).slice(0, 12).join(' ');
  const qs = [
    `${city} student clubs and organizations for founders building ${what} 2026`,
    `${city} upcoming startup networking events meetup ${new Date().getFullYear()}`,
  ];
  if (/cofounder|mentor|advisor/.test(profile.goal ?? '')) {
    qs.push(`${city} cofounder matching events and founder meetups`);
  }
  if (/funding|raising/.test(`${profile.goal} ${profile.stage}`)) {
    qs.push(`${city} angel investor pitch nights and demo days for early stage startups`);
  }
  return qs.slice(0, 3);
}

async function searchOnce(query, { timeoutMs = 9000 } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json',
                 authorization: `Bearer ${process.env.TAVILY_API_KEY}` },
      body: JSON.stringify({ query, max_results: 5, search_depth: 'basic',
                             include_answer: false, topic: 'general' }),
      signal: ctl.signal,
    });
    if (!res.ok) return [];
    return (await res.json())?.results ?? [];
  } catch {
    return [];                     // discovery is enrichment: it may never block
  } finally { clearTimeout(t); }
}

// Aggregators and dead ends that add nothing a founder can act on.
const JUNK = /(facebook\.com|twitter\.com|x\.com|instagram\.com|pinterest|amazon\.|wikipedia\.org|indeed\.com|glassdoor)/i;

/**
 * @returns {Promise<object[]>} entries in canonical corpus shape, source:'live'
 */
export async function discoverLocal(profile, { limit = 6 } = {}) {
  if (!process.env.TAVILY_API_KEY) return [];

  const batches = await Promise.all(buildQueries(profile).map(q => searchOnce(q)));
  const seen = new Set();
  const out = [];

  for (const r of batches.flat().sort((a, b) => (b.score ?? 0) - (a.score ?? 0))) {
    const url = r?.url;
    if (!url || JUNK.test(url)) continue;
    const host = (() => { try { return new URL(url).hostname.replace(/^www\./, ''); }
                          catch { return null; } })();
    if (!host || seen.has(host)) continue;        // one entry per organisation
    seen.add(host);

    const name = String(r.title ?? '').replace(/\s*[|\-–—]\s*[^|\-–—]*$/, '').trim().slice(0, 90);
    if (name.length < 6) continue;

    out.push({
      id: `live-${slug(host)}-${slug(name).slice(0, 20)}`,
      type: /event|meetup|conference|summit|pitch|demo/i.test(`${name} ${r.content}`)
              ? 'event' : 'person_org',
      name,
      url,
      date_or_cadence: 'Check the page for current dates',
      who_it_serves: String(r.content ?? '').slice(0, 220),
      tags: ['live', 'boston', 'discovered'],
      why_it_matters: String(r.content ?? '').slice(0, 300),
      cost: 'See page',
      contact_route: `Public page: ${url}`,
      source: 'live',
    });
    if (out.length >= limit) break;
  }
  return out;
}
