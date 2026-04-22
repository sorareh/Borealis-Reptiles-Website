import { json, error, readJson, requireAuth } from '../../_lib/helpers.js';

export async function onRequestGet({ env, params }) {
  const id = Number(params.id);
  const row = await env.DB.prepare('SELECT * FROM care_sheets WHERE id = ?').bind(id).first();
  if (!row) return error('Not found', 404);
  return json({ sheet: row });
}

export async function onRequestPatch({ request, env, params }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;
  const id = Number(params.id);
  const b = await readJson(request);
  if (!b) return error('Invalid JSON', 400);

  const fields = ['slug','title','summary','content','sort_order'];
  const sets = []; const vals = [];
  for (const f of fields) {
    if (b[f] !== undefined) { sets.push(`${f} = ?`); vals.push(b[f] === '' ? null : b[f]); }
  }
  if (!sets.length) return error('Nothing to update', 400);
  sets.push("updated_at = CURRENT_TIMESTAMP");
  vals.push(id);
  await env.DB.prepare(`UPDATE care_sheets SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
  const row = await env.DB.prepare('SELECT * FROM care_sheets WHERE id = ?').bind(id).first();
  return json({ sheet: row });
}

export async function onRequestDelete({ request, env, params }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;
  const id = Number(params.id);
  await env.DB.prepare('DELETE FROM care_sheets WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
