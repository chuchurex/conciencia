// GET/POST /api/admin/cohortes
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
    const { results } = await env.DB.prepare(
      'SELECT * FROM cohortes ORDER BY fecha_inicio DESC'
    ).all();

    return addCorsHeaders(jsonResponse({ cohortes: results }), request);
  } catch (error) {
    console.error('Cohortes GET error:', error);
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
    const { nombre, descripcion, fecha_inicio, total_sesiones } = body;

    const result = await env.DB.prepare(
      'INSERT INTO cohortes (nombre, descripcion, fecha_inicio, total_sesiones) VALUES (?, ?, ?, ?)'
    )
      .bind(nombre, descripcion || '', fecha_inicio || null, total_sesiones || 11)
      .run();

    return addCorsHeaders(
      jsonResponse({ success: true, id: result.meta.last_row_id }, 201),
      request
    );
  } catch (error) {
    console.error('Cohortes POST error:', error);
    return addCorsHeaders(jsonResponse({ error: 'Error interno' }, 500), request);
  }
}
