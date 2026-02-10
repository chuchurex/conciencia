<?php
// config/database.php
// Configuración de la base de datos - ajustar para Hostinger

define('DB_HOST', 'localhost');
define('DB_NAME', 'conciencia_encarnada');
define('DB_USER', 'tu_usuario');       // Cambiar
define('DB_PASS', 'tu_password');       // Cambiar
define('CLAUDE_API_KEY', 'sk-ant-xxx'); // Cambiar
define('CLAUDE_MODEL', 'claude-sonnet-4-5-20250929');
define('ADMIN_SECRET', 'cambiar-este-secreto-en-produccion');
define('SITE_URL', 'https://concienciaencarnada.com'); // Cambiar

// CORS para Cloudflare Pages
$allowed_origins = [
    'https://concienciaencarnada.pages.dev',
    'https://concienciaencarnada.com',
    'http://localhost:5173' // dev
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Conexión PDO
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER, DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    }
    return $pdo;
}

// Helper: respuesta JSON
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Helper: leer body JSON
function getJsonBody() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

// Helper: verificar admin auth
function requireAdmin() {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? '';
    if ($auth !== 'Bearer ' . ADMIN_SECRET) {
        jsonResponse(['error' => 'No autorizado'], 401);
    }
}

// Helper: generar token único
function generateToken() {
    return bin2hex(random_bytes(32));
}
