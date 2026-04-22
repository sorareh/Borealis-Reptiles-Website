import { json, error, readJson, requireAuth } from '../../_lib/helpers.js';

export async function onRequestGet({ env, params }) {
  const id = Number(params.id);
  const row = await env.DB.prepare('SELECT * FROM merchandise WHERE id = ?').bind(id).first();
  if (!row) return error('Not found', 404);
  return json({ item: row });
}

export async function onRequestPatch({ request, env, params }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;
  const id = Number(params.id);
  const b = await readJson(request);
  if (!b) return error('Invalid JSON', 400);

  const fields = ['code','name','type','material','shed_source','description','image_url','price','status','featured','sort_order'];
  const sets = []; const vals = [];
  for (const f of fields) {
    if (b[f] !== undefined) { sets.push(`${f} = ?`); vals.push(b[f] === '' ? null : b[f]); }
  }
  if (!sets.length) return error('Nothing to update', 400);
  vals.push(id);
  await env.DB.prepare(`UPDATE merchandise SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
  const row = await env.DB.prepare('SELECT * FROM merchandise WHERE id = ?').bind(id).first();
  return json({ item: row });
}

export async function onRequestDelete({ request, env, params }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;
  const id = Number(params.id);
  await env.DB.prepare('DELETE FROM merchandise WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
