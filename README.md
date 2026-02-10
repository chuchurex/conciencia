# Conciencia Encarnada — Plataforma Web

Plataforma del programa **Conciencia Encarnada** by **Ser & Fluir**.
Genera bitácoras personalizadas para cada participante usando Claude AI.

## Arquitectura

```
frontend/              → React SPA (Cloudflare Pages)
backend/               → PHP API (Hostinger)
database/              → Esquema MySQL
```

## Deploy rápido

### 1. Base de datos (Hostinger phpMyAdmin)
- Crear DB `conciencia_encarnada`
- Importar `database/schema.sql`

### 2. Backend (Hostinger)
- Subir carpeta `backend/` → ejecutar `composer install`
- Editar `config/database.php` con credenciales

### 3. Frontend (Cloudflare Pages)
- Conectar repo → build: `cd frontend && npm install && npm run build`
- Output: `frontend/dist`
- Env: `VITE_API_URL=https://tu-hostinger.com/api/index.php?route=`

## Flujo
1. Admin sube Excel → se crean participantes
2. Admin genera bitácoras con Claude → revisa → publica
3. Participante entra con email → ve su bitácora
