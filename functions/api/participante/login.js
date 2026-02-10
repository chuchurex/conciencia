// POST /api/participante/login
import { jsonResponse, handleCors, addCorsHeaders } from '../_shared.js';

export async function onRequestOptions(context) {
  return handleCors(context.request) || new Response(null, { status: 204 });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email) {
      return addCorsHeaders(jsonResponse({ error: 'Email requerido' }, 400), request);
    }

    const result = await env.DB.prepare(`
      SELECT p.id, p.nombre, p.email, p.token_acceso, c.nombre as cohorte, c.id as cohorte_id
      FROM participantes p
      JOIN cohortes c ON c.id = p.cohorte_id
      WHERE LOWER(p.email) = ? AND p.activo = 1 AND c.activa = 1
      ORDER BY c.fecha_inicio DESC
      LIMIT 1
    `).bind(email).first();

    if (!result) {
      return addCorsHeaders(
        jsonResponse({ error: 'No encontramos ese email en el programa activo' }, 404),
        request
      );
    }

    return addCorsHeaders(
      jsonResponse({
        success: true,
        participante: {
          nombre: result.nombre,
          email: result.email,
          cohorte: result.cohorte,
          token: result.token_acceso,
        },
      }),
      request
    );
  } catch (error) {
    console.error('Login error:', error);
    return addCorsHeaders(jsonResponse({ error: 'Error interno' }, 500), request);
  }
}
