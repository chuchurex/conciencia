// POST /api/admin/generar-bitacora
import { jsonResponse, handleCors, addCorsHeaders, requireAdmin, callClaudeAPI } from '../_shared.js';

export async function onRequestOptions(context) {
  return handleCors(context.request) || new Response(null, { status: 204 });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  const authError = requireAdmin(request, env);
  if (authError) return addCorsHeaders(authError, request);

  try {
    const body = await request.json();
    const { participante_id, sesion = 1 } = body;

    if (!participante_id) {
      return addCorsHeaders(jsonResponse({ error: 'participante_id requerido' }, 400), request);
    }

    // Obtener participante
    const participante = await env.DB.prepare(
      'SELECT nombre, email FROM participantes WHERE id = ?'
    ).bind(participante_id).first();

    if (!participante) {
      return addCorsHeaders(jsonResponse({ error: 'Participante no encontrado' }, 404), request);
    }

    // Obtener respuestas
    const { results: respResults } = await env.DB.prepare(
      'SELECT pregunta_key, respuesta FROM respuestas WHERE participante_id = ? AND sesion = ?'
    ).bind(participante_id, sesion).all();

    const respuestas = {};
    for (const r of respResults) {
      respuestas[r.pregunta_key] = r.respuesta;
    }

    // Obtener prompt
    const promptRow = await env.DB.prepare(
      'SELECT contenido FROM prompts WHERE sesion = ? AND activo = 1'
    ).bind(sesion).first();

    if (!promptRow) {
      return addCorsHeaders(jsonResponse({ error: `No hay prompt para sesión ${sesion}` }, 404), request);
    }

    // Reemplazar placeholders
    let prompt = promptRow.contenido;
    prompt = prompt.replace(/\[\[NOMBRE\]\]/g, participante.nombre);
    prompt = prompt.replace(/\[\[EMAIL\]\]/g, participante.email);
    for (const [key, value] of Object.entries(respuestas)) {
      prompt = prompt.replace(new RegExp(`\\[\\[${key}\\]\\]`, 'g'), value);
    }

    // Llamar a Claude API
    const response = await callClaudeAPI(prompt, env);

    if (!response) {
      return addCorsHeaders(jsonResponse({ error: 'Error al generar con Claude API' }, 500), request);
    }

    // Guardar bitácora (INSERT or UPDATE)
    // SQLite doesn't have ON DUPLICATE KEY UPDATE, use INSERT OR REPLACE
    const existing = await env.DB.prepare(
      'SELECT id FROM bitacoras WHERE participante_id = ? AND sesion = ?'
    ).bind(participante_id, sesion).first();

    if (existing) {
      await env.DB.prepare(
        `UPDATE bitacoras SET contenido_generado = ?, estado = 'borrador', generado_at = datetime('now') WHERE id = ?`
      ).bind(response, existing.id).run();
    } else {
      await env.DB.prepare(
        `INSERT INTO bitacoras (participante_id, sesion, contenido_generado, estado) VALUES (?, ?, ?, 'borrador')`
      ).bind(participante_id, sesion, response).run();
    }

    return addCorsHeaders(
      jsonResponse({
        success: true,
        participante: participante.nombre,
        sesion,
        contenido: response,
      }),
      request
    );
  } catch (error) {
    console.error('Generar bitacora error:', error);
    return addCorsHeaders(jsonResponse({ error: 'Error interno' }, 500), request);
  }
}
