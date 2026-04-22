import { json, clearSessionCookie } from '../../_lib/helpers.js';

export async function onRequestPost() {
  return json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie() } });
}
