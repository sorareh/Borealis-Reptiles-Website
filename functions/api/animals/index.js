import { json, error, readJson, requireAuth } from '../../_lib/helpers.js';

// GET /api/animals         — list (public). Supports ?role=breeder|offspring, ?category=snake, ?status=available
// POST /api/animals        — create (admin)
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const { role, category, status, parent_id } = Object.fromEntries(url.searchParams);
  const clauses = [];
  const binds = [];
  if (role)     { clauses.push('role = ?');      binds.push(role); }
  if (category) { clauses.push('category = ?');  binds.push(category); }
  if (status)   { clauses.push('status = ?');    binds.push(status); }
  if (parent_id) { clauses.push('(mother_id = ? OR father_id = ?)'); binds.push(parent_id, parent_id); }
  const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
  const sql = `SELECT * FROM animals ${where} ORDER BY role DESC, id ASC`;
  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  return json({ animals: results });
}

export async function onRequestPost({ request, env }) {
  const unauthorized = await requireAuth(request, env);
  if (unauthorized) return unauthorized;

  const b = await readJson(request);
  if (!b) return error('Invalid JSON', 400);

  const fields = [
    'code','name','category','species','sex','gene','birth_date','weight',
    'description','image_url','price','status','role','mother_id','father_id',
  ];
  const cols = [];
  const vals = [];
  for (const f of fields) {
    if (b[f] !== undefined) {
      cols.push(f);
      vals.push(b[f] === '' ? null : b[f]);
    }
  }
  if (!cols.includes('category')) { cols.push('category'); vals.push('snake'); }
  if (!cols.includes('role'))     { cols.push('role');     vals.push('offspring'); }
  if (!cols.includes('status'))   { cols.push('status');   vals.push('available'); }

  const placeholders = cols.map(() => '?').join(', ');
  const sql = `INSERT INTO animals (${cols.join(', ')}) VALUES (${placeholders})`;
  const res = await env.DB.prepare(sql).bind(...vals).run();
  const id = res.meta.last_row_id;
  const row = await env.DB.prepare('SELECT * FROM animals WHERE id = ?').bind(id).first();
  return json({ animal: row }, { status: 201 });
}
