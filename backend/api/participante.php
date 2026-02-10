<?php
// api/participante.php

function loginParticipante() {
    $body = getJsonBody();
    $email = trim($body['email'] ?? '');

    if (!$email) {
        jsonResponse(['error' => 'Email requerido'], 400);
    }

    $db = getDB();
    $stmt = $db->prepare('
        SELECT p.id, p.nombre, p.email, p.token_acceso, c.nombre as cohorte, c.id as cohorte_id
        FROM participantes p
        JOIN cohortes c ON c.id = p.cohorte_id
        WHERE p.email = ? AND p.activo = 1 AND c.activa = 1
        ORDER BY c.fecha_inicio DESC
        LIMIT 1
    ');
    $stmt->execute([$email]);
    $participante = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$participante) {
        jsonResponse(['error' => 'No encontramos ese email en el programa activo'], 404);
    }

    jsonResponse([
        'success' => true,
        'participante' => [
            'nombre' => $participante['nombre'],
            'email' => $participante['email'],
            'cohorte' => $participante['cohorte'],
            'token' => $participante['token_acceso']
        ]
    ]);
}

function getBitacora() {
    $token = $_GET['token'] ?? '';

    if (!$token) {
        jsonResponse(['error' => 'Token requerido'], 400);
    }

    $db = getDB();

    // Validar participante
    $stmt = $db->prepare('
        SELECT p.id, p.nombre, p.email, c.nombre as cohorte, c.total_sesiones
        FROM participantes p
        JOIN cohortes c ON c.id = p.cohorte_id
        WHERE p.token_acceso = ? AND p.activo = 1
    ');
    $stmt->execute([$token]);
    $participante = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$participante) {
        jsonResponse(['error' => 'Acceso no válido'], 401);
    }

    // Obtener bitácoras publicadas
    $stmt = $db->prepare('
        SELECT sesion, contenido_editado, contenido_generado, publicado_at
        FROM bitacoras
        WHERE participante_id = ? AND estado = "publicado"
        ORDER BY sesion ASC
    ');
    $stmt->execute([$participante['id']]);
    $bitacoras = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Usar contenido editado si existe, sino el generado
    $sesiones = array_map(function($b) {
        return [
            'sesion' => (int)$b['sesion'],
            'contenido' => $b['contenido_editado'] ?: $b['contenido_generado'],
            'fecha' => $b['publicado_at']
        ];
    }, $bitacoras);

    jsonResponse([
        'success' => true,
        'participante' => [
            'nombre' => $participante['nombre'],
            'cohorte' => $participante['cohorte'],
            'total_sesiones' => (int)$participante['total_sesiones']
        ],
        'sesiones' => $sesiones
    ]);
}
