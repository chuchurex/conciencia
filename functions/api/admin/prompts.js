// GET/POST /api/admin/prompts
import { jsonResponse, handleCors, addCorsHeaders, requireAdmin } from '../_shared.js';

export async function onRequestOptions(context) {
  return handleCors(context.request) || new Response(null, { status: 204 });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  const authError = requireAdmin(request, env);
  if (authError) return addCorsHeaders(authError, request);

  try {
    const { results } = await env.DB.prepare('SELECT * FROM prompts ORDER BY sesion').all();
    return addCorsHeaders(jsonResponse({ prompts: results }), request);
  } catch (error) {
    console.error('Prompts GET error:', error);
    return addCorsHeaders(jsonResponse({ error: 'Error interno' }, 500), request);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  const authError = requireAdmin(request, env);
  if (authError) return addCorsHeaders(authError, request);

  try {
    const body = await request.json();
    const { sesion, nombre, contenido } = body;

    // Check if exists
    const existing = await env.DB.prepare(
      'SELECT id FROM prompts WHERE sesion = ?'
    ).bind(sesion).first();

    if (existing) {
      await env.DB.prepare(
        `UPDATE prompts SET nombre = ?, contenido = ?, updated_at = datetime('now') WHERE id = ?`
      ).bind(nombre, contenido, existing.id).run();
    } else {
      await env.DB.prepare(
        'INSERT INTO prompts (sesion, nombre, contenido) VALUES (?, ?, ?)'
      ).bind(sesion, nombre, contenido).run();
    }

    return addCorsHeaders(jsonResponse({ success: true }), request);
  } catch (error) {
    console.error('Prompts POST error:', error);
    return addCorsHeaders(jsonResponse({ error: 'Error interno' }, 500), request);
  }
}
