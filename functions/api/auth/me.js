import { json, isAuthed } from '../../_lib/helpers.js';

export async function onRequestGet({ request, env }) {
  return json({ authed: await isAuthed(request, env) });
}
