import { json, error, readJson, requireAuth } from '../../_lib/helpers.js';

// GET /api/merchandise  — public list, ?featured=1 and ?status=available supported
// POST /api/merchandise — admin create
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const { featured, status } = Object.fromEntries(url.searchParams);
  const clauses = []; const binds = [];
  if (featured !== undefined) { clauses.push('featured = ?'); binds.push(Number(featured)); }
  if (status)                { clauses.push('status = ?');   binds.push(status); }
  const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
  const sql = `SELECT * FROM merchandise ${where} ORDER BY sort_order ASC, id ASC`;
  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  return json({ merchandise: results });
}

export async function onRequestPost({ request, env }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;

  const b = await readJson(request);
  if (!b) return error('Invalid JSON', 400);
  if (!b.name || !b.type) return error('name and type required', 400);

  const fields = ['code','name','type','material','shed_source','description','image_url','price','status','featured','sort_order'];
  const cols = []; const vals = [];
  for (const f of fields) {
    if (b[f] !== undefined) {
      cols.push(f);
      vals.push(b[f] === '' ? null : b[f]);
    }
  }
  const placeholders = cols.map(() => '?').join(', ');
  const sql = `INSERT INTO merchandise (${cols.join(', ')}) VALUES (${placeholders})`;
  const res = await env.DB.prepare(sql).bind(...vals).run();
  const row = await env.DB.prepare('SELECT * FROM merchandise WHERE id = ?').bind(res.meta.last_row_id).first();
  return json({ item: row }, { status: 201 });
}
