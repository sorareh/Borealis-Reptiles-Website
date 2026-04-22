import { json, error, readJson, requireAuth } from '../../_lib/helpers.js';

// GET /api/pairs/:id — pair details including offspring and both parents
export async function onRequestGet({ env, params }) {
  const id = Number(params.id);
  const pair = await env.DB.prepare(`
    SELECT p.*,
      m.name AS male_name,   m.gene AS male_gene,   m.image_url AS male_image,   m.id AS male_id,
      f.name AS female_name, f.gene AS female_gene, f.image_url AS female_image, f.id AS female_id
    FROM breeding_pairs p
    LEFT JOIN animals m ON m.id = p.male_id
    LEFT JOIN animals f ON f.id = p.female_id
    WHERE p.id = ?`).bind(id).first();

  if (!pair) return error('Not found', 404);

  const { results: offspring } = await env.DB.prepare(
    'SELECT * FROM animals WHERE mother_id = ? AND father_id = ? ORDER BY id ASC'
  ).bind(pair.female_id, pair.male_id).all();

  return json({ pair, offspring });
}

export async function onRequestPatch({ request, env, params }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;
  const id = Number(params.id);
  const b = await readJson(request);
  if (!b) return error('Invalid JSON', 400);

  const sets = []; const vals = [];
  for (const f of ['male_id','female_id','title','description']) {
    if (b[f] !== undefined) { sets.push(`${f} = ?`); vals.push(b[f] === '' ? null : b[f]); }
  }
  if (!sets.length) return error('Nothing to update', 400);
  vals.push(id);
  await env.DB.prepare(`UPDATE breeding_pairs SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
  return json({ ok: true });
}

export async function onRequestDelete({ request, env, params }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;
  const id = Number(params.id);
  await env.DB.prepare('DELETE FROM breeding_pairs WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
