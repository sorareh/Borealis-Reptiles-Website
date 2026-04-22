import { json, error, readJson, requireAuth } from '../../_lib/helpers.js';

// GET /api/pairs — list pairs with joined male/female + offspring counts
export async function onRequestGet({ env }) {
  const sql = `
    SELECT p.*,
      m.name AS male_name,       m.gene AS male_gene,     m.image_url AS male_image,
      f.name AS female_name,     f.gene AS female_gene,   f.image_url AS female_image,
      (SELECT COUNT(*) FROM animals a
         WHERE (a.mother_id = p.female_id AND a.father_id = p.male_id)) AS offspring_count
    FROM breeding_pairs p
    LEFT JOIN animals m ON m.id = p.male_id
    LEFT JOIN animals f ON f.id = p.female_id
    ORDER BY p.id ASC`;
  const { results } = await env.DB.prepare(sql).all();
  return json({ pairs: results });
}

export async function onRequestPost({ request, env }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;
  const b = await readJson(request);
  if (!b || !b.male_id || !b.female_id) return error('male_id and female_id required', 400);
  const res = await env.DB.prepare(
    'INSERT INTO breeding_pairs (male_id, female_id, title, description) VALUES (?, ?, ?, ?)'
  ).bind(b.male_id, b.female_id, b.title || null, b.description || null).run();
  return json({ id: res.meta.last_row_id }, { status: 201 });
}
