<?php
// api/index.php - Router principal
// URL: /api/index.php?route=participante/login

require_once __DIR__ . '/../config/database.php';

$route = $_GET['route'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Routing simple
switch ($route) {
    // === PARTICIPANTE ===
    case 'participante/login':
        require __DIR__ . '/participante.php';
        loginParticipante();
        break;

    case 'participante/bitacora':
        require __DIR__ . '/participante.php';
        getBitacora();
        break;

    // === ADMIN ===
    case 'admin/cohortes':
        requireAdmin();
        require __DIR__ . '/admin.php';
        handleCohortes($method);
        break;

    case 'admin/participantes':
        requireAdmin();
        require __DIR__ . '/admin.php';
        handleParticipantes($method);
        break;

    case 'admin/upload-excel':
        requireAdmin();
        require __DIR__ . '/admin.php';
        uploadExcel();
        break;

    case 'admin/generar-bitacora':
        requireAdmin();
        require __DIR__ . '/admin.php';
        generarBitacora();
        break;

    case 'admin/generar-todas':
        requireAdmin();
        require __DIR__ . '/admin.php';
        generarTodasBitacoras();
        break;

    case 'admin/bitacoras':
        requireAdmin();
        require __DIR__ . '/admin.php';
        handleBitacoras($method);
        break;

    case 'admin/prompts':
        requireAdmin();
        require __DIR__ . '/admin.php';
        handlePrompts($method);
        break;

    default:
        jsonResponse(['error' => 'Ruta no encontrada', 'rutas_disponibles' => [
            'participante/login', 'participante/bitacora',
            'admin/cohortes', 'admin/participantes', 'admin/upload-excel',
            'admin/generar-bitacora', 'admin/generar-todas', 'admin/bitacoras', 'admin/prompts'
        ]], 404);
}
