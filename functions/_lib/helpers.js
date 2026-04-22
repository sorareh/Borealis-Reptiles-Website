// Shared helpers for all Pages Functions.

export const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: { ...JSON_HEADERS, ...(init.headers || {}) },
  });
}

export function error(message, status = 400) {
  return json({ error: message }, { status });
}

// ---------------- Auth: HMAC-signed session cookie ----------------
// No sessions table needed. A cookie looks like: `<base64(exp)>.<base64(hmac)>`
// where the HMAC is over `exp` with the secret from env.ADMIN_SECRET.

const encoder = new TextEncoder();

async function hmacSign(secret, payload) {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign', 'verify']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function makeSessionCookie(env, ttlSeconds = 60 * 60 * 24 * 7) {
  const secret = env.ADMIN_SECRET || env.ADMIN_PASSWORD || 'dev-secret';
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = String(exp);
  const sig = await hmacSign(secret, payload);
  const value = `${btoa(payload)}.${sig}`;
  const attrs = [
    `borealis_admin=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${ttlSeconds}`,
  ];
  // Secure only makes sense over HTTPS; skip for localhost dev.
  return attrs.join('; ');
}

export function clearSessionCookie() {
  return 'borealis_admin=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0';
}

export async function isAuthed(request, env) {
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/borealis_admin=([^;]+)/);
  if (!m) return false;
  const raw = m[1];
  const [expB64, sig] = raw.split('.');
  if (!expB64 || !sig) return false;

  let exp;
  try { exp = atob(expB64); } catch { return false; }
  if (!/^\d+$/.test(exp)) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;

  const secret = env.ADMIN_SECRET || env.ADMIN_PASSWORD || 'dev-secret';
  const expectedSig = await hmacSign(secret, exp);
  return timingSafeEqual(sig, expectedSig);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function requireAuth(request, env) {
  if (!(await isAuthed(request, env))) {
    return error('Unauthorized', 401);
  }
  return null;
}

// Convenience: parse JSON body, return null + error response on failure.
export async function readJson(request) {
  try { return await request.json(); }
  catch { return null; }
}
