<?php
// api/admin.php

// === COHORTES ===
function handleCohortes($method) {
    $db = getDB();
    if ($method === 'GET') {
        $stmt = $db->query('SELECT * FROM cohortes ORDER BY fecha_inicio DESC');
        jsonResponse(['cohortes' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    if ($method === 'POST') {
        $body = getJsonBody();
        $stmt = $db->prepare('INSERT INTO cohortes (nombre, descripcion, fecha_inicio, total_sesiones) VALUES (?,?,?,?)');
        $stmt->execute([$body['nombre'], $body['descripcion'] ?? '', $body['fecha_inicio'] ?? null, $body['total_sesiones'] ?? 11]);
        jsonResponse(['success' => true, 'id' => $db->lastInsertId()], 201);
    }
}

// === PARTICIPANTES ===
function handleParticipantes($method) {
    $db = getDB();
    $cohorte_id = $_GET['cohorte_id'] ?? null;

    if ($method === 'GET') {
        $sql = 'SELECT p.*, c.nombre as cohorte FROM participantes p JOIN cohortes c ON c.id = p.cohorte_id';
        $params = [];
        if ($cohorte_id) {
            $sql .= ' WHERE p.cohorte_id = ?';
            $params[] = $cohorte_id;
        }
        $sql .= ' ORDER BY p.nombre';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        $participantes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Agregar respuestas y estado de bitácoras
        foreach ($participantes as &$p) {
            $stmt2 = $db->prepare('SELECT pregunta_key, respuesta FROM respuestas WHERE participante_id = ? AND sesion = 1');
            $stmt2->execute([$p['id']]);
            $p['respuestas'] = $stmt2->fetchAll(PDO::FETCH_KEY_PAIR);

            $stmt3 = $db->prepare('SELECT sesion, estado FROM bitacoras WHERE participante_id = ?');
            $stmt3->execute([$p['id']]);
            $p['bitacoras'] = $stmt3->fetchAll(PDO::FETCH_ASSOC);
        }

        jsonResponse(['participantes' => $participantes]);
    }
}

// === UPLOAD EXCEL ===
function uploadExcel() {
    if (!isset($_FILES['archivo']) || !isset($_POST['cohorte_id'])) {
        jsonResponse(['error' => 'Archivo y cohorte_id requeridos'], 400);
    }

    $cohorte_id = (int)$_POST['cohorte_id'];
    $file = $_FILES['archivo']['tmp_name'];
    $ext = pathinfo($_FILES['archivo']['name'], PATHINFO_EXTENSION);

    if (!in_array($ext, ['xlsx', 'csv'])) {
        jsonResponse(['error' => 'Solo archivos .xlsx o .csv'], 400);
    }

    // Parsear Excel con PhpSpreadsheet (instalar via composer)
    // Si no hay composer, parsear CSV directamente
    require_once __DIR__ . '/../vendor/autoload.php';

    $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file);
    $sheet = $spreadsheet->getActiveSheet();
    $data = $sheet->toArray();

    $db = getDB();
    $creados = 0;

    // Detectar formato: bloques verticales (cols B,C) o columnas horizontales
    // El Excel tiene formato mixto: vamos a detectar bloques por "nombre" en col B
    $maxRow = $sheet->getHighestRow();
    $maxCol = $sheet->getHighestColumn();
    $maxColIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($maxCol);

    $participantes = [];

    // Estrategia 1: Bloques verticales (col B=label, col C=value)
    $currentPerson = null;
    for ($row = 1; $row <= $maxRow; $row++) {
        $label = trim($sheet->getCell([2, $row])->getValue() ?? '');
        $value = trim($sheet->getCell([3, $row])->getValue() ?? '');

        if (strtolower($label) === 'nombre' && $value) {
            if ($currentPerson) $participantes[] = $currentPerson;
            $currentPerson = ['nombre' => $value, 'respuestas' => []];
        } elseif ($currentPerson && $label && $value) {
            if (stripos($label, 'email') !== false) {
                $currentPerson['email'] = $value;
            } else {
                // Detectar Qn por col A
                $qKey = trim($sheet->getCell([1, $row])->getValue() ?? '');
                if ($qKey) {
                    $currentPerson['respuestas'][] = [
                        'key' => $qKey,
                        'pregunta' => $label,
                        'respuesta' => $value
                    ];
                }
            }
        }
    }
    if ($currentPerson) $participantes[] = $currentPerson;

    // Estrategia 2: Columnas horizontales (pares de cols: label, value)
    for ($col = 4; $col <= $maxColIndex; $col += 3) {
        $label1 = trim($sheet->getCell([$col + 1, 1])->getValue() ?? '');
        $name = trim($sheet->getCell([$col + 2, 1])->getValue() ?? '');

        if (strtolower($label1) === 'nombre' && $name) {
            $person = ['nombre' => $name, 'respuestas' => []];
            for ($row = 2; $row <= $maxRow; $row++) {
                $qlabel = trim($sheet->getCell([$col + 1, $row])->getValue() ?? '');
                $qvalue = trim($sheet->getCell([$col + 2, $row])->getValue() ?? '');
                if (!$qlabel || !$qvalue) continue;

                if (stripos($qlabel, 'email') !== false) {
                    $person['email'] = $qvalue;
                } else {
                    $qKey = trim($sheet->getCell([$col, $row])->getValue() ?? '');
                    $person['respuestas'][] = [
                        'key' => $qKey ?: 'Q' . ($row - 1),
                        'pregunta' => $qlabel,
                        'respuesta' => $qvalue
                    ];
                }
            }
            $participantes[] = $person;
        }
    }

    // Guardar en DB
    foreach ($participantes as $p) {
        if (empty($p['email'])) continue;

        $token = generateToken();
        $stmt = $db->prepare('INSERT IGNORE INTO participantes (cohorte_id, nombre, email, token_acceso) VALUES (?,?,?,?)');
        $stmt->execute([$cohorte_id, $p['nombre'], $p['email'], $token]);

        $pid = $db->lastInsertId();
        if (!$pid) {
            // Ya existía, buscar su ID
            $stmt = $db->prepare('SELECT id FROM participantes WHERE email = ? AND cohorte_id = ?');
            $stmt->execute([$p['email'], $cohorte_id]);
            $pid = $stmt->fetchColumn();
        }

        if ($pid && !empty($p['respuestas'])) {
            $stmtR = $db->prepare('INSERT INTO respuestas (participante_id, sesion, pregunta_key, pregunta_texto, respuesta) VALUES (?,1,?,?,?)');
            foreach ($p['respuestas'] as $r) {
                $stmtR->execute([$pid, $r['key'], $r['pregunta'], $r['respuesta']]);
            }
            $creados++;
        }
    }

    jsonResponse([
        'success' => true,
        'participantes_procesados' => $creados,
        'total_detectados' => count($participantes)
    ]);
}

// === GENERAR BITÁCORA (1 participante) ===
function generarBitacora() {
    $body = getJsonBody();
    $participante_id = $body['participante_id'] ?? null;
    $sesion = $body['sesion'] ?? 1;

    if (!$participante_id) {
        jsonResponse(['error' => 'participante_id requerido'], 400);
    }

    $db = getDB();

    // Obtener participante
    $stmt = $db->prepare('SELECT nombre, email FROM participantes WHERE id = ?');
    $stmt->execute([$participante_id]);
    $participante = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$participante) jsonResponse(['error' => 'Participante no encontrado'], 404);

    // Obtener respuestas
    $stmt = $db->prepare('SELECT pregunta_key, respuesta FROM respuestas WHERE participante_id = ? AND sesion = ?');
    $stmt->execute([$participante_id, $sesion]);
    $respuestas = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    // Obtener prompt
    $stmt = $db->prepare('SELECT contenido FROM prompts WHERE sesion = ? AND activo = 1');
    $stmt->execute([$sesion]);
    $prompt_template = $stmt->fetchColumn();
    if (!$prompt_template) jsonResponse(['error' => "No hay prompt para sesión $sesion"], 404);

    // Reemplazar placeholders
    $prompt = str_replace('[[NOMBRE]]', $participante['nombre'], $prompt_template);
    $prompt = str_replace('[[EMAIL]]', $participante['email'], $prompt);
    foreach ($respuestas as $key => $value) {
        $prompt = str_replace("[[{$key}]]", $value, $prompt);
    }

    // Llamar a Claude API
    $response = callClaudeAPI($prompt);

    if (!$response) {
        jsonResponse(['error' => 'Error al generar con Claude API'], 500);
    }

    // Guardar bitácora
    $stmt = $db->prepare('
        INSERT INTO bitacoras (participante_id, sesion, contenido_generado, estado)
        VALUES (?, ?, ?, "borrador")
        ON DUPLICATE KEY UPDATE contenido_generado = VALUES(contenido_generado), estado = "borrador", generado_at = NOW()
    ');
    $stmt->execute([$participante_id, $sesion, $response]);

    jsonResponse([
        'success' => true,
        'participante' => $participante['nombre'],
        'sesion' => $sesion,
        'contenido' => $response
    ]);
}

// === GENERAR TODAS LAS BITÁCORAS DE UNA COHORTE ===
function generarTodasBitacoras() {
    $body = getJsonBody();
    $cohorte_id = $body['cohorte_id'] ?? null;
    $sesion = $body['sesion'] ?? 1;

    if (!$cohorte_id) jsonResponse(['error' => 'cohorte_id requerido'], 400);

    $db = getDB();
    $stmt = $db->prepare('SELECT id FROM participantes WHERE cohorte_id = ? AND activo = 1');
    $stmt->execute([$cohorte_id]);
    $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $resultados = [];
    foreach ($ids as $pid) {
        // Reusar la lógica individual
        $_body_backup = file_get_contents('php://input');
        ob_start();
        // Simular llamada
        $fake_body = json_encode(['participante_id' => $pid, 'sesion' => $sesion]);
        // Llamar directamente
        $result = generarBitacoraInternal($pid, $sesion);
        $resultados[] = $result;
        sleep(1); // Rate limiting para Claude API
    }

    jsonResponse(['success' => true, 'resultados' => $resultados]);
}

function generarBitacoraInternal($participante_id, $sesion) {
    $db = getDB();

    $stmt = $db->prepare('SELECT nombre, email FROM participantes WHERE id = ?');
    $stmt->execute([$participante_id]);
    $participante = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $db->prepare('SELECT pregunta_key, respuesta FROM respuestas WHERE participante_id = ? AND sesion = ?');
    $stmt->execute([$participante_id, $sesion]);
    $respuestas = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    $stmt = $db->prepare('SELECT contenido FROM prompts WHERE sesion = ? AND activo = 1');
    $stmt->execute([$sesion]);
    $prompt_template = $stmt->fetchColumn();

    $prompt = str_replace('[[NOMBRE]]', $participante['nombre'], $prompt_template);
    $prompt = str_replace('[[EMAIL]]', $participante['email'], $prompt);
    foreach ($respuestas as $key => $value) {
        $prompt = str_replace("[[{$key}]]", $value, $prompt);
    }

    $response = callClaudeAPI($prompt);

    if ($response) {
        $stmt = $db->prepare('
            INSERT INTO bitacoras (participante_id, sesion, contenido_generado, estado)
            VALUES (?, ?, ?, "borrador")
            ON DUPLICATE KEY UPDATE contenido_generado = VALUES(contenido_generado), estado = "borrador", generado_at = NOW()
        ');
        $stmt->execute([$participante_id, $sesion, $response]);
    }

    return [
        'participante' => $participante['nombre'],
        'success' => (bool)$response,
        'error' => $response ? null : 'Error en Claude API'
    ];
}

// === BITÁCORAS (listar, editar, publicar) ===
function handleBitacoras($method) {
    $db = getDB();

    if ($method === 'GET') {
        $cohorte_id = $_GET['cohorte_id'] ?? null;
        $sesion = $_GET['sesion'] ?? null;

        $sql = '
            SELECT b.*, p.nombre, p.email
            FROM bitacoras b
            JOIN participantes p ON p.id = b.participante_id
            WHERE 1=1
        ';
        $params = [];
        if ($cohorte_id) {
            $sql .= ' AND p.cohorte_id = ?';
            $params[] = $cohorte_id;
        }
        if ($sesion) {
            $sql .= ' AND b.sesion = ?';
            $params[] = $sesion;
        }
        $sql .= ' ORDER BY p.nombre, b.sesion';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        jsonResponse(['bitacoras' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if ($method === 'PUT') {
        $body = getJsonBody();
        $id = $body['id'] ?? null;
        if (!$id) jsonResponse(['error' => 'id requerido'], 400);

        $updates = [];
        $params = [];

        if (isset($body['contenido_editado'])) {
            $updates[] = 'contenido_editado = ?';
            $params[] = $body['contenido_editado'];
        }
        if (isset($body['estado'])) {
            $updates[] = 'estado = ?';
            $params[] = $body['estado'];
            if ($body['estado'] === 'publicado') {
                $updates[] = 'publicado_at = NOW()';
            }
        }

        $params[] = $id;
        $stmt = $db->prepare('UPDATE bitacoras SET ' . implode(', ', $updates) . ' WHERE id = ?');
        $stmt->execute($params);
        jsonResponse(['success' => true]);
    }
}

// === PROMPTS ===
function handlePrompts($method) {
    $db = getDB();

    if ($method === 'GET') {
        $stmt = $db->query('SELECT * FROM prompts ORDER BY sesion');
        jsonResponse(['prompts' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    if ($method === 'POST') {
        $body = getJsonBody();
        $stmt = $db->prepare('INSERT INTO prompts (sesion, nombre, contenido) VALUES (?,?,?) ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), contenido=VALUES(contenido)');
        $stmt->execute([$body['sesion'], $body['nombre'], $body['contenido']]);
        jsonResponse(['success' => true]);
    }
}

// === CLAUDE API ===
function callClaudeAPI($prompt) {
    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'x-api-key: ' . CLAUDE_API_KEY,
            'anthropic-version: 2023-06-01'
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'model' => CLAUDE_MODEL,
            'max_tokens' => 1024,
            'messages' => [
                ['role' => 'user', 'content' => $prompt]
            ]
        ])
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        error_log("Claude API error ($httpCode): $response");
        return null;
    }

    $data = json_decode($response, true);
    return $data['content'][0]['text'] ?? null;
}
