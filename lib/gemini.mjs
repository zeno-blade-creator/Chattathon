// One model call per plan. Nothing here knows what a corpus is.

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

// Tried in order. A 503 "high demand" on the newest flash model is common and
// temporary; falling through to the next one beats failing a live demo.
const MODEL_CHAIN = (process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL]
  : ['gemini-3.5-flash', 'gemini-flash-lite-latest', 'gemini-3.8-flash', 'gemini-3.7-flash']);

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const sleep = ms => new Promise(r => setTimeout(r, ms));

export class GeminiError extends Error {}

/**
 * Ask Gemini for JSON and get JSON back. responseMimeType makes the model emit
 * a bare object with no ```json fence, which removes the single most common
 * cause of a parse failure on stage.
 *
 * @returns {Promise<{data:object, usage:object, model:string}>}
 */
export async function generateJSON({ system, user, schema, timeoutMs = 60000, attempts = 2 }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError('GEMINI_API_KEY is not set');

  let last;
  for (const model of MODEL_CHAIN) {
    for (let a = 0; a < attempts; a++) {
      try {
        return await callOnce({ key, model, system, user, schema, timeoutMs });
      } catch (e) {
        last = e;
        if (!e.retryable) break;              // a bad key or bad request: next model won't help
        await sleep(400 * 2 ** a);
      }
    }
  }
  throw last ?? new GeminiError('all models failed');
}

async function callOnce({ key, model, system, user, schema, timeoutMs }) {

  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: 'application/json',
      ...(schema ? { responseSchema: schema } : {}),
    },
  };

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
  } catch (e) {
    const err = new GeminiError(`request failed: ${e.message}`);
    err.retryable = true;
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const err = new GeminiError(`${model}: ${res.status} ${(await res.text()).slice(0, 200)}`);
    err.status = res.status;
    err.retryable = RETRYABLE.has(res.status);
    if (res.status === 404) err.retryable = false;   // wrong model name: try the next one
    throw err;
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') ?? '';
  if (!text.trim()) { const e = new GeminiError('empty completion'); e.retryable = true; throw e; }

  try {
    return { data: JSON.parse(text), usage: json.usageMetadata ?? {}, model };
  } catch {
    const e = new GeminiError(`unparseable JSON: ${text.slice(0, 200)}`);
    e.retryable = true;                       // a reroll usually fixes this
    throw e;
  }
}
