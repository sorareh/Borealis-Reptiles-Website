import { json, error, readJson, requireAuth, isAuthed } from '../../_lib/helpers.js';

// GET /api/requests   — admin-only list
// POST /api/requests  — public (submit a buy request or question)
export async function onRequestGet({ request, env }) {
  if (!(await isAuthed(request, env))) return error('Unauthorized', 401);
  const { results } = await env.DB.prepare(`
    SELECT r.*, a.name AS animal_name, a.gene AS animal_gene
    FROM purchase_requests r
    LEFT JOIN animals a ON a.id = r.animal_id
    ORDER BY r.created_at DESC
  `).all();
  return json({ requests: results });
}

export async function onRequestPost({ request, env }) {
  const b = await readJson(request);
  if (!b) return error('Invalid JSON', 400);
  if (!b.customer_name || !b.customer_email) return error('name and email required', 400);

  // Resolve animal_id from code if provided
  let animalId = b.animal_id || null;
  if (!animalId && b.animal_code) {
    const row = await env.DB.prepare('SELECT id FROM animals WHERE code = ?').bind(b.animal_code).first();
    if (row) animalId = row.id;
  }

  const res = await env.DB.prepare(`
    INSERT INTO purchase_requests (
      animal_id, animal_code, inquiry_type, customer_name, customer_email,
      customer_phone, shipping_address, message, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')
  `).bind(
    animalId,
    b.animal_code || null,
    b.inquiry_type || 'buy',
    b.customer_name,
    b.customer_email,
    b.customer_phone || null,
    b.shipping_address || null,
    b.message || null,
  ).run();

  // Fire-and-forget notification email. Request creation should not fail
  // if email settings are missing or Resend has a temporary outage.
  try {
    await sendRequestNotification(env, {
      id: res.meta.last_row_id,
      animal_id: animalId,
      animal_code: b.animal_code || null,
      inquiry_type: b.inquiry_type || 'buy',
      customer_name: b.customer_name,
      customer_email: b.customer_email,
      customer_phone: b.customer_phone || null,
      shipping_address: b.shipping_address || null,
      message: b.message || null,
    });
  } catch (e) {
    console.error('Resend notification failed:', e);
  }

  return json({ id: res.meta.last_row_id }, { status: 201 });
}

async function sendRequestNotification(env, req) {
  const apiKey = env.RESEND_API_KEY;
  const to = env.NOTIFY_TO_EMAIL;
  const from = env.RESEND_FROM_EMAIL || 'Borealis Reptiles <onboarding@resend.dev>';
  if (!apiKey || !to) return;

  const subjectPrefix = req.inquiry_type === 'buy' ? 'New Buy Request' : 'New Inquiry';
  const subject = `${subjectPrefix} - ${req.animal_code || 'General'} (#${req.id})`;
  const text = [
    `Request ID: ${req.id}`,
    `Type: ${req.inquiry_type || 'buy'}`,
    `Animal code: ${req.animal_code || '(none)'}`,
    `Animal ID: ${req.animal_id || '(none)'}`,
    '',
    `Customer: ${req.customer_name}`,
    `Email: ${req.customer_email}`,
    `Phone: ${req.customer_phone || '(none)'}`,
    '',
    `Shipping address: ${req.shipping_address || '(none)'}`,
    '',
    'Message:',
    req.message || '(none)',
  ].join('\n');

  const html = `
    <h2>${escapeHtml(subjectPrefix)}</h2>
    <p><strong>Request ID:</strong> ${req.id}</p>
    <p><strong>Type:</strong> ${escapeHtml(req.inquiry_type || 'buy')}</p>
    <p><strong>Animal code:</strong> ${escapeHtml(req.animal_code || '(none)')}</p>
    <p><strong>Animal ID:</strong> ${escapeHtml(String(req.animal_id || '(none)'))}</p>
    <hr />
    <p><strong>Customer:</strong> ${escapeHtml(req.customer_name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(req.customer_email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(req.customer_phone || '(none)')}</p>
    <p><strong>Shipping address:</strong> ${escapeHtml(req.shipping_address || '(none)')}</p>
    <p><strong>Message:</strong><br>${escapeHtml(req.message || '(none)').replace(/\n/g, '<br>')}</p>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: req.customer_email,
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend HTTP ${res.status}: ${body}`);
  }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
