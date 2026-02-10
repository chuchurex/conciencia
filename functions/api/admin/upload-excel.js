// POST /api/admin/upload-excel
import { jsonResponse, handleCors, addCorsHeaders, requireAdmin } from '../_shared.js';
import * as XLSX from 'xlsx';

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
    const formData = await request.formData();
    const file = formData.get('archivo');
    const cohorte_id = formData.get('cohorte_id');

    if (!file || !cohorte_id) {
      return addCorsHeaders(jsonResponse({ error: 'Archivo y cohorte_id requeridos' }, 400), request);
    }

    const fileName = file.name || '';
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      return addCorsHeaders(jsonResponse({ error: 'Solo archivos .xlsx, .xls o .csv' }, 400), request);
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // Get sheet range
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    const maxRow = range.e.r + 1;
    const maxCol = range.e.c + 1;

    const participantes = [];

    // Helper to get cell value
    const getCell = (col, row) => {
      const cellAddress = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
      const cell = sheet[cellAddress];
      return cell ? String(cell.v || '').trim() : '';
    };

    // Estrategia 1: Bloques verticales (col B=label, col C=value)
    let currentPerson = null;
    for (let row = 1; row <= maxRow; row++) {
      const label = getCell(2, row); // Column B
      const value = getCell(3, row); // Column C

      if (label.toLowerCase() === 'nombre' && value) {
        if (currentPerson && currentPerson.email) {
          participantes.push(currentPerson);
        }
        currentPerson = { nombre: value, email: '', respuestas: [] };
      } else if (currentPerson && label && value) {
        if (label.toLowerCase().includes('email') || label.toLowerCase().includes('correo')) {
          currentPerson.email = value;
        } else {
          // Detectar Qn por col A
          const qKey = getCell(1, row); // Column A
          if (qKey) {
            currentPerson.respuestas.push({
              key: qKey,
              pregunta: label,
              respuesta: value,
            });
          }
        }
      }
    }
    if (currentPerson && currentPerson.email) {
      participantes.push(currentPerson);
    }

    // Estrategia 2: Columnas horizontales (pares de cols: label, value)
    for (let col = 4; col <= maxCol; col += 3) {
      const label1 = getCell(col + 1, 1); // Column header
      const name = getCell(col + 2, 1); // Value

      if (label1.toLowerCase() === 'nombre' && name) {
        const person = { nombre: name, email: '', respuestas: [] };
        for (let row = 2; row <= maxRow; row++) {
          const qlabel = getCell(col + 1, row);
          const qvalue = getCell(col + 2, row);
          if (!qlabel || !qvalue) continue;

          if (qlabel.toLowerCase().includes('email') || qlabel.toLowerCase().includes('correo')) {
            person.email = qvalue;
          } else {
            const qKey = getCell(col, row) || `Q${row - 1}`;
            person.respuestas.push({
              key: qKey,
              pregunta: qlabel,
              respuesta: qvalue,
            });
          }
        }
        if (person.email) {
          participantes.push(person);
        }
      }
    }

    // Guardar en DB
    let creados = 0;
    for (const p of participantes) {
      if (!p.email) continue;

      const token = crypto.randomUUID();

      // Check if exists
      const existing = await env.DB.prepare(
        'SELECT id FROM participantes WHERE email = ? AND cohorte_id = ?'
      ).bind(p.email.toLowerCase(), cohorte_id).first();

      let pid;
      if (existing) {
        pid = existing.id;
      } else {
        const result = await env.DB.prepare(
          'INSERT INTO participantes (cohorte_id, nombre, email, token_acceso) VALUES (?, ?, ?, ?)'
        ).bind(cohorte_id, p.nombre, p.email.toLowerCase(), token).run();
        pid = result.meta.last_row_id;
      }

      if (pid && p.respuestas.length > 0) {
        for (const r of p.respuestas) {
          await env.DB.prepare(
            'INSERT INTO respuestas (participante_id, sesion, pregunta_key, pregunta_texto, respuesta) VALUES (?, 1, ?, ?, ?)'
          ).bind(pid, r.key, r.pregunta, r.respuesta).run();
        }
        creados++;
      }
    }

    return addCorsHeaders(
      jsonResponse({
        success: true,
        participantes_procesados: creados,
        total_detectados: participantes.length,
      }),
      request
    );
  } catch (error) {
    console.error('Upload Excel error:', error);
    return addCorsHeaders(jsonResponse({ error: 'Error procesando archivo: ' + error.message }, 500), request);
  }
}
