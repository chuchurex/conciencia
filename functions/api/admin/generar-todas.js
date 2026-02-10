// POST /api/admin/generar-todas
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
    const { cohorte_id, sesion = 1 } = body;

    if (!cohorte_id) {
      return addCorsHeaders(jsonResponse({ error: 'cohorte_id requerido' }, 400), request);
    }

    // Obtener participantes de la cohorte
    const { results: participantes } = await env.DB.prepare(
      'SELECT id, nombre, email FROM participantes WHERE cohorte_id = ? AND activo = 1'
    ).bind(cohorte_id).all();

    // Obtener prompt
    const promptRow = await env.DB.prepare(
      'SELECT contenido FROM prompts WHERE sesion = ? AND activo = 1'
    ).bind(sesion).first();

    if (!promptRow) {
      return addCorsHeaders(jsonResponse({ error: `No hay prompt para sesión ${sesion}` }, 404), request);
    }

    const resultados = [];

    for (const participante of participantes) {
      try {
        // Obtener respuestas
        const { results: respResults } = await env.DB.prepare(
          'SELECT pregunta_key, respuesta FROM respuestas WHERE participante_id = ? AND sesion = ?'
        ).bind(participante.id, sesion).all();

        const respuestas = {};
        for (const r of respResults) {
          respuestas[r.pregunta_key] = r.respuesta;
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

        if (response) {
          // Guardar bitácora
          const existing = await env.DB.prepare(
            'SELECT id FROM bitacoras WHERE participante_id = ? AND sesion = ?'
          ).bind(participante.id, sesion).first();

          if (existing) {
            await env.DB.prepare(
              `UPDATE bitacoras SET contenido_generado = ?, estado = 'borrador', generado_at = datetime('now') WHERE id = ?`
            ).bind(response, existing.id).run();
          } else {
            await env.DB.prepare(
              `INSERT INTO bitacoras (participante_id, sesion, contenido_generado, estado) VALUES (?, ?, ?, 'borrador')`
            ).bind(participante.id, sesion, response).run();
          }

          resultados.push({ participante: participante.nombre, success: true });
        } else {
          resultados.push({ participante: participante.nombre, success: false, error: 'Error en Claude API' });
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        resultados.push({ participante: participante.nombre, success: false, error: err.message });
      }
    }

    return addCorsHeaders(jsonResponse({ success: true, resultados }), request);
  } catch (error) {
    console.error('Generar todas error:', error);
    return addCorsHeaders(jsonResponse({ error: 'Error interno' }, 500), request);
  }
}
