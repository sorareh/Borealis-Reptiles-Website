import { json, error, readJson, requireAuth } from '../../_lib/helpers.js';

// GET /api/animals/:id       — full profile with parents + offspring
// PATCH /api/animals/:id     — update (admin)
// DELETE /api/animals/:id    — delete (admin)
export async function onRequestGet({ params, env }) {
  const id = Number(params.id);
  if (!id) return error('Invalid id', 400);
  const animal = await env.DB.prepare('SELECT * FROM animals WHERE id = ?').bind(id).first();
  if (!animal) return error('Not found', 404);

  const parents = {};
  if (animal.mother_id) parents.mother = await env.DB.prepare('SELECT * FROM animals WHERE id = ?').bind(animal.mother_id).first();
  if (animal.father_id) parents.father = await env.DB.prepare('SELECT * FROM animals WHERE id = ?').bind(animal.father_id).first();

  const { results: offspring } = await env.DB.prepare(
    'SELECT * FROM animals WHERE mother_id = ? OR father_id = ? ORDER BY created_at DESC'
  ).bind(id, id).all();

  return json({ animal, parents, offspring });
}

export async function onRequestPatch({ request, env, params }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;

  const id = Number(params.id);
  const b = await readJson(request);
  if (!b) return error('Invalid JSON', 400);

  const fields = [
    'code','name','category','species','sex','gene','birth_date','weight',
    'description','image_url','price','status','role','mother_id','father_id',
  ];
  const sets = [];
  const vals = [];
  for (const f of fields) {
    if (b[f] !== undefined) {
      sets.push(`${f} = ?`);
      vals.push(b[f] === '' ? null : b[f]);
    }
  }
  if (!sets.length) return error('Nothing to update', 400);
  vals.push(id);
  await env.DB.prepare(`UPDATE animals SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
  const row = await env.DB.prepare('SELECT * FROM animals WHERE id = ?').bind(id).first();
  return json({ animal: row });
}

export async function onRequestDelete({ request, env, params }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;
  const id = Number(params.id);
  await env.DB.prepare('DELETE FROM animals WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
