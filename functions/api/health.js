import { json, isAuthed } from '../_lib/helpers.js';

export async function onRequestGet({ request, env }) {
  const hasDb = !!env.DB;
  let dbOk = false;
  if (hasDb) {
    try {
      await env.DB.prepare('SELECT 1 AS ok').first();
      dbOk = true;
    } catch { dbOk = false; }
  }
  return json({
    ok: true,
    backend: 'cloudflare-pages-functions',
    db: dbOk,
    authed: await isAuthed(request, env),
  });
}
