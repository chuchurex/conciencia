// GET /api/admin/participantes?cohorte_id=X
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
    const url = new URL(request.url);
    const cohorte_id = url.searchParams.get('cohorte_id');

    let participantes;
    if (cohorte_id) {
      const { results } = await env.DB.prepare(`
        SELECT p.*, c.nombre as cohorte
        FROM participantes p
        JOIN cohortes c ON c.id = p.cohorte_id
        WHERE p.cohorte_id = ?
        ORDER BY p.nombre
      `).bind(cohorte_id).all();
      participantes = results;
    } else {
      const { results } = await env.DB.prepare(`
        SELECT p.*, c.nombre as cohorte
        FROM participantes p
        JOIN cohortes c ON c.id = p.cohorte_id
        ORDER BY p.nombre
      `).all();
      participantes = results;
    }

    // Agregar respuestas y estado de bitácoras para cada participante
    for (const p of participantes) {
      // Respuestas sesión 1
      const { results: respResults } = await env.DB.prepare(
        'SELECT pregunta_key, respuesta FROM respuestas WHERE participante_id = ? AND sesion = 1'
      ).bind(p.id).all();

      p.respuestas = {};
      for (const r of respResults) {
        p.respuestas[r.pregunta_key] = r.respuesta;
      }

      // Bitácoras
      const { results: bitResults } = await env.DB.prepare(
        'SELECT sesion, estado FROM bitacoras WHERE participante_id = ?'
      ).bind(p.id).all();
      p.bitacoras = bitResults;
    }

    return addCorsHeaders(jsonResponse({ participantes }), request);
  } catch (error) {
    console.error('Participantes GET error:', error);
    return addCorsHeaders(jsonResponse({ error: 'Error interno' }, 500), request);
  }
}
