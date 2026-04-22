import { json, error, readJson, makeSessionCookie } from '../../_lib/helpers.js';

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  if (!body || typeof body.password !== 'string') return error('Missing password', 400);

  const expected = env.ADMIN_PASSWORD || 'duncan'; // fallback for first-run
  if (body.password !== expected) return error('Incorrect password', 401);

  const cookie = await makeSessionCookie(env);
  return json({ ok: true }, { headers: { 'Set-Cookie': cookie } });
}
