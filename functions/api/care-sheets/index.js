import { json, error, readJson, requireAuth } from '../../_lib/helpers.js';

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM care_sheets ORDER BY sort_order ASC, id ASC'
  ).all();
  return json({ sheets: results });
}

export async function onRequestPost({ request, env }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;
  const b = await readJson(request);
  if (!b || !b.title) return error('title required', 400);

  const slug = (b.slug || b.title).toString().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const res = await env.DB.prepare(`
    INSERT INTO care_sheets (slug, title, summary, content, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    slug || null, b.title, b.summary || null, b.content || null, b.sort_order ?? 0,
  ).run();
  const row = await env.DB.prepare('SELECT * FROM care_sheets WHERE id = ?').bind(res.meta.last_row_id).first();
  return json({ sheet: row }, { status: 201 });
}
