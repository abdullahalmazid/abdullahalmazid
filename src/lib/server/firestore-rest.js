/**
 * Firestore over REST, for server code only (metadata, sitemap, RSS).
 *
 * The browser SDK cannot run here, and no service account is needed: the
 * security rules already allow anyone to read site/, tabs/ and items/ (see lib/collections.js).
 * Every call is cached by Next for `revalidate` seconds and never throws:
 * on any failure it returns null / [] and callers fall back to the seed.
 */
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const API_KEY = process.env.FIREBASE_API_KEY;
const BASE = PROJECT_ID ? `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents` : '';
const TIMEOUT = 3500;

export const REST_ENABLED = Boolean(PROJECT_ID && API_KEY);

function decodeValue(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  if ('referenceValue' in v) return v.referenceValue;
  return null;
}
function decodeFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields || {})) out[k] = decodeValue(v);
  return out;
}
function decodeDoc(doc) {
  if (!doc?.name) return null;
  return { id: decodeURIComponent(doc.name.split('/').pop()), ...decodeFields(doc.fields), _updated: doc.updateTime || null };
}

async function get(url, revalidate) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { next: { revalidate }, signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** One document, or null. */
export async function getDocREST(path, { revalidate = 300 } = {}) {
  if (!REST_ENABLED || !path) return null;
  const json = await get(`${BASE}/${path.split('/').map(encodeURIComponent).join('/')}?key=${API_KEY}`, revalidate);
  return json ? decodeDoc(json) : null;
}

/** A whole collection (paged), or [] on failure. Binned documents are dropped. */
export async function listREST(collection, { revalidate = 300, max = 2000 } = {}) {
  if (!REST_ENABLED) return [];
  const out = [];
  let token = '';
  for (let guard = 0; guard < 10 && out.length < max; guard += 1) {
    const json = await get(`${BASE}/${collection}?key=${API_KEY}&pageSize=300${token ? `&pageToken=${token}` : ''}`, revalidate);
    if (!json) return out.length ? out : [];
    (json.documents || []).forEach((d) => {
      const doc = decodeDoc(d);
      if (doc && !doc.deletedAt) out.push(doc);
    });
    if (!json.nextPageToken) break;
    token = json.nextPageToken;
  }
  return out;
}
