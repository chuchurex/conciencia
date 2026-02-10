// GET/PUT /api/admin/bitacoras
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
    const sesion = url.searchParams.get('sesion');

    let sql = `
      SELECT b.*, p.nombre, p.email
      FROM bitacoras b
      JOIN participantes p ON p.id = b.participante_id
      WHERE 1=1
    `;
    const params = [];

    if (cohorte_id) {
      sql += ' AND p.cohorte_id = ?';
      params.push(cohorte_id);
    }
    if (sesion) {
      sql += ' AND b.sesion = ?';
      params.push(sesion);
    }
    sql += ' ORDER BY p.nombre, b.sesion';

    const stmt = env.DB.prepare(sql);
    const { results } = params.length > 0
      ? await stmt.bind(...params).all()
      : await stmt.all();

    return addCorsHeaders(jsonResponse({ bitacoras: results }), request);
  } catch (error) {
    console.error('Bitacoras GET error:', error);
    return addCorsHeaders(jsonResponse({ error: 'Error interno' }, 500), request);
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  const authError = requireAdmin(request, env);
  if (authError) return addCorsHeaders(authError, request);

  try {
    const body = await request.json();
    const { id, contenido_editado, estado } = body;

    if (!id) {
      return addCorsHeaders(jsonResponse({ error: 'id requerido' }, 400), request);
    }

    const updates = [];
    const params = [];

    if (contenido_editado !== undefined) {
      updates.push('contenido_editado = ?');
      params.push(contenido_editado);
    }
    if (estado !== undefined) {
      updates.push('estado = ?');
      params.push(estado);
      if (estado === 'publicado') {
        updates.push(`publicado_at = datetime('now')`);
      }
    }

    if (updates.length === 0) {
      return addCorsHeaders(jsonResponse({ error: 'Nada que actualizar' }, 400), request);
    }

    params.push(id);
    await env.DB.prepare(`UPDATE bitacoras SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();

    return addCorsHeaders(jsonResponse({ success: true }), request);
  } catch (error) {
    console.error('Bitacoras PUT error:', error);
    return addCorsHeaders(jsonResponse({ error: 'Error interno' }, 500), request);
  }
}
