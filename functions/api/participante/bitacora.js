// GET /api/participante/bitacora?token=xxx
import { jsonResponse, handleCors, addCorsHeaders } from '../_shared.js';

export async function onRequestOptions(context) {
  return handleCors(context.request) || new Response(null, { status: 204 });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token') || '';

    if (!token) {
      return addCorsHeaders(jsonResponse({ error: 'Token requerido' }, 400), request);
    }

    // Validar participante
    const participante = await env.DB.prepare(`
      SELECT p.id, p.nombre, p.email, c.nombre as cohorte, c.total_sesiones
      FROM participantes p
      JOIN cohortes c ON c.id = p.cohorte_id
      WHERE p.token_acceso = ? AND p.activo = 1
    `).bind(token).first();

    if (!participante) {
      return addCorsHeaders(jsonResponse({ error: 'Acceso no válido' }, 401), request);
    }

    // Obtener bitácoras publicadas
    const { results: bitacoras } = await env.DB.prepare(`
      SELECT sesion, contenido_editado, contenido_generado, publicado_at
      FROM bitacoras
      WHERE participante_id = ? AND estado = 'publicado'
      ORDER BY sesion ASC
    `).bind(participante.id).all();

    // Usar contenido editado si existe, sino el generado
    const sesiones = bitacoras.map((b) => ({
      sesion: b.sesion,
      contenido: b.contenido_editado || b.contenido_generado,
      fecha: b.publicado_at,
    }));

    return addCorsHeaders(
      jsonResponse({
        success: true,
        participante: {
          nombre: participante.nombre,
          cohorte: participante.cohorte,
          total_sesiones: participante.total_sesiones,
        },
        sesiones,
      }),
      request
    );
  } catch (error) {
    console.error('Bitacora error:', error);
    return addCorsHeaders(jsonResponse({ error: 'Error interno' }, 500), request);
  }
}
