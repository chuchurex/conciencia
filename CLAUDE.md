# Conciencia Encarnada - Plataforma web para programa de coaching de consciencia con bitácoras generadas por Claude AI

## Stack
- Frontend: React 18 + Vite + React Router
- Backend: Cloudflare Pages Functions
- Database: Cloudflare D1 (SQLite)

## Structure
- frontend/src/ (pages: Landing, Login, Bitacora, Admin)
- functions/api/ (Cloudflare Functions API)
- migrations/ (D1 schema + seed data)

## Commands
- `npm run dev` (Vite)
- `npm run build`
- `npm run preview`
- `wrangler pages deploy frontend/dist --project-name=conciencia-encarnada`

## URLs
- Producción: https://conciencia.seryfluir.cl
- Pages: https://conciencia-encarnada.pages.dev

## Notes
- Rutas: / (landing), /entrar (login), /bitacora (cuaderno), /admin/*.
- VITE_API_URL env var para conectar frontend con backend.
- Secrets en Cloudflare Pages: CLAUDE_API_KEY, ADMIN_SECRET.
