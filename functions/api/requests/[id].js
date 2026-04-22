import { json, error, readJson, requireAuth } from '../../_lib/helpers.js';

export async function onRequestPatch({ request, env, params }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;
  const id = Number(params.id);
  const b = await readJson(request);
  if (!b || !b.status) return error('status required', 400);
  await env.DB.prepare('UPDATE purchase_requests SET status = ? WHERE id = ?').bind(b.status, id).run();
  return json({ ok: true });
}

export async function onRequestDelete({ request, env, params }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;
  const id = Number(params.id);
  await env.DB.prepare('DELETE FROM purchase_requests WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
