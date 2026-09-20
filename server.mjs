// The server tier.
//
// It exists for one reason: API keys must never reach a phone or a browser.
// The Expo app POSTs a profile and gets back a finished plan. The Gemini,
// Tavily and Supabase service keys live in this process's environment and are
// never serialised into a response.
//
//   node --env-file=.env server.mjs
//
import { createServer } from 'node:http';
import { loadCorpus }   from './lib/corpus.mjs';
import { generatePlanSafe } from './lib/generate.mjs';
import { saveProfile, savePlan } from './lib/db.mjs';
import { normalizeIntake } from './lib/normalize.mjs';
import { buildProfile }    from './lib/profile.mjs';

const PORT = Number(process.env.PORT || 8787);

// Loaded once at boot: 60 rows from Supabase, or the local JSON if it's down.
let CORPUS = [];
const ready = loadCorpus().then(({ entries, source }) => { CORPUS = entries;
  console.log(`corpus: ${entries.length} entries from ${source}`); }).catch(e => {
  console.error('corpus load failed:', e.message); });

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
};

const send = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json', ...CORS });
  res.end(JSON.stringify(body));
};

const readBody = req => new Promise((resolve, reject) => {
  let b = ''; req.on('data', c => { b += c; if (b.length > 1e6) req.destroy(); });
  req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch { reject(new Error('invalid JSON body')); } });
  req.on('error', reject);
});

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }

  if (req.url === '/health') {
    return send(res, 200, { ok: true, corpus: CORPUS.length,
      gemini: !!process.env.GEMINI_API_KEY, tavily: !!process.env.TAVILY_API_KEY,
      supabase: !!process.env.SUPABASE_URL });
  }

  if (req.method !== 'POST' || req.url !== '/generate') {
    return send(res, 404, { error: 'POST /generate' });
  }

  const t0 = Date.now();
  try {
    await ready;
    const intake = await readBody(req);

    // Bug #1's safety net: the UI's labels are mapped to the enum values the
    // CHECK constraints accept, so an insert can't 400 on capitalisation.
    const { ok, problems, profile } = normalizeIntake(intake);
    if (!ok) return send(res, 400, { error: 'invalid intake', problems });

    const { plan, meta, fallbackUsed } = await generatePlanSafe(CORPUS, intake);

    // Persistence must never break a demo: both of these degrade to {saved:false}.
    // buildProfile derives `signals`, which founder_profiles declares NOT NULL.
    const saved = await saveProfile(buildProfile(profile)).catch(() => ({ saved: false }));
    if (saved?.id) await savePlan(saved.id, plan, { model: meta.model }).catch(() => {});

    console.log(`generate ${Date.now() - t0}ms items=${plan.items.length} ` +
                `live=${meta.liveUsed ?? 0} fallback=${fallbackUsed} profile=${saved?.id ?? 'unsaved'}`);
    if (fallbackUsed) console.error(`  fallback reason: ${meta.error}`);

    // meta was computed and discarded. The interface needs it to show the
    // pipeline: corpus size, derived signals, how many were shortlisted, what
    // live discovery found, which invented ids were rejected.
    return send(res, 200, { status: 'ready', plan, profileId: saved?.id ?? null,
                            fallbackUsed, meta, ms: Date.now() - t0 });
  } catch (err) {
    if (err.code === 'CITY_UNSUPPORTED') {
      return send(res, 200, { status: 'unsupported_city', city: err.city,
        message: 'We cover Boston today. Tell us where you are and we will add your city next.' });
    }
    console.error('generate failed:', err.message);
    return send(res, 500, { status: 'failed', error: err.message });
  }
}).listen(PORT, () => console.log(`generation server on http://localhost:${PORT}`));
