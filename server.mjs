#!/usr/bin/env node
// HTTP wrapper around the pipeline, plus a bare-bones intake page.
//
// Person C: the page is scaffolding so the seam is demonstrably working —
// replace it freely. The contract you care about is POST /api/plan.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { generateGtmPlan } from './lib/pipeline.mjs';
import { healthCheck } from './lib/db.mjs';

try { process.loadEnvFile('.env'); } catch { /* fine — everything degrades */ }

const PORT = Number(process.env.PORT ?? 3000);

const json = (res, code, body) => {
  const s = JSON.stringify(body);
  res.writeHead(code, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(s),
    'access-control-allow-origin': '*',
  });
  res.end(s);
};

const readBody = req => new Promise((resolve, reject) => {
  let data = '';
  req.on('data', c => {
    data += c;
    if (data.length > 1e6) { reject(new Error('body too large')); req.destroy(); }
  });
  req.on('end', () => {
    try { resolve(data ? JSON.parse(data) : {}); }
    catch { reject(new Error('body is not valid JSON')); }
  });
  req.on('error', reject);
});

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, GET, OPTIONS',
      'access-control-allow-headers': 'content-type',
    });
    return res.end();
  }

  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    const html = await readFile(new URL('./public/index.html', import.meta.url));
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  if (req.method === 'GET' && pathname === '/api/health') {
    const h = await healthCheck();
    return json(res, h.ok ? 200 : 503, {
      supabase: h.ok ? 'ok' : h.reason,
      corpus_rows: h.corpusRows ?? null,
      generator: process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN
        ? 'claude' : 'stub (no ANTHROPIC_API_KEY)',
    });
  }

  if (req.method === 'POST' && pathname === '/api/plan') {
    let intake;
    try { intake = await readBody(req); }
    catch (err) { return json(res, 400, { status: 'invalid', errors: [err.message] }); }

    try {
      const result = await generateGtmPlan(intake);
      const code = result.status === 'ok' ? 200
                 : result.status === 'invalid' ? 422
                 : 200;                         // unsupported_city is a real answer
      return json(res, code, result);
    } catch (err) {
      console.error('[server] unexpected:', err);
      return json(res, 500, { status: 'error', errors: ['Something broke on our side.'] });
    }
  }

  json(res, 404, { status: 'error', errors: [`No route for ${req.method} ${pathname}`] });
});

server.listen(PORT, () => {
  console.log(`Misneach running at http://localhost:${PORT}`);
  console.log(`  POST /api/plan    generate a plan`);
  console.log(`  GET  /api/health  corpus + generator status`);
});
