# Conciencia Encarnada - Resumen de Implementación

## Proyecto
**Plataforma web para el programa "Conciencia Encarnada" de Ser & Fluir**

Genera bitácoras personalizadas para cada participante usando Claude AI, basadas en sus respuestas a un formulario inicial de 8 preguntas sobre autoconocimiento.

---

## Arquitectura Final: 100% Cloudflare

Se migró de una arquitectura PHP+MySQL en Hostinger a una solución serverless completa en Cloudflare:

| Componente | Tecnología |
|------------|------------|
| Frontend | React + Vite → Cloudflare Pages |
| Backend API | Cloudflare Pages Functions (JavaScript) |
| Base de datos | Cloudflare D1 (SQLite serverless) |
| IA | Anthropic Claude API |

### Ventajas de esta arquitectura
- Zero servidores que mantener
- Escalado automático
- Deploy con un solo comando
- Base de datos incluida sin costo adicional
- Edge computing (baja latencia global)

---

## Estructura del Proyecto

```
conciencia/
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx      # Página de inicio
│   │   │   ├── Login.jsx        # Login participantes
│   │   │   ├── Bitacora.jsx     # Vista de bitácoras
│   │   │   └── Admin.jsx        # Panel administrador
│   │   ├── utils/
│   │   │   └── api.js           # Cliente API
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── functions/                   # Cloudflare Pages Functions (API)
│   └── api/
│       ├── _shared.js           # Utilidades compartidas (CORS, auth, Claude)
│       ├── participante/
│       │   ├── login.js         # POST /api/participante/login
│       │   └── bitacora.js      # GET  /api/participante/bitacora
│       └── admin/
│           ├── cohortes.js      # GET/POST /api/admin/cohortes
│           ├── participantes.js # GET /api/admin/participantes
│           ├── bitacoras.js     # GET/PUT /api/admin/bitacoras
│           ├── prompts.js       # GET/POST /api/admin/prompts
│           ├── generar-bitacora.js    # POST - genera 1 bitácora
│           ├── generar-todas.js       # POST - genera todas las bitácoras
│           └── upload-excel.js        # POST - carga Excel con participantes
│
├── migrations/                  # SQL para D1
│   ├── 0001_schema.sql          # Esquema de tablas
│   └── 0002_pilot_data.sql      # Datos del piloto
│
├── wrangler.toml                # Configuración Cloudflare
├── package.json                 # Dependencias (xlsx)
└── .env                         # Credenciales (no commitear)
```

---

## URLs de Producción

| Recurso | URL |
|---------|-----|
| Landing | https://conciencia-encarnada.pages.dev |
| Login | https://conciencia-encarnada.pages.dev/login |
| Admin | https://conciencia-encarnada.pages.dev/admin |
| API Base | https://conciencia-encarnada.pages.dev/api/ |

---

## Base de Datos D1

### Identificadores
- **Database ID**: `64815e97-5328-46ce-9f97-e70e5618017c`
- **Database Name**: `conciencia-db`
- **Region**: ENAM (Eastern North America)

### Esquema de Tablas

```sql
-- Cohortes (versiones del programa)
cohortes (id, nombre, descripcion, fecha_inicio, fecha_fin, total_sesiones, activa)

-- Participantes
participantes (id, cohorte_id, nombre, email, token_acceso, activo)

-- Respuestas del formulario
respuestas (id, participante_id, sesion, pregunta_key, pregunta_texto, respuesta)

-- Bitácoras generadas por IA
bitacoras (id, participante_id, sesion, contenido_generado, contenido_editado, estado, publicado_at)

-- Prompts por sesión
prompts (id, sesion, nombre, contenido, activo)

-- Administradores
admins (id, email, password_hash, nombre)
```

### Datos Actuales

**Cohorte**: Piloto 2025 (4 sesiones)

**Participantes**:
| ID | Nombre   | Email                        |
|----|----------|------------------------------|
| 1  | Verónica | chuchurex@gmail.com          |
| 2  | David    | david.ivaha@gmail.com        |
| 3  | Paz      | pazita.poblete@gmail.com     |
| 4  | Valeska  | vnaranjodaw@gmail.com        |
| 5  | Paola    | pandrea.santibanez@gmail.com |

Cada participante tiene 8 respuestas (Q1-Q8) del formulario inicial.

---

## API Endpoints

### Participante (público)

```
POST /api/participante/login
Body: { "email": "user@example.com" }
Response: { success, participante: { nombre, email, cohorte, token } }

GET /api/participante/bitacora?token=xxx
Response: { success, participante, sesiones: [{ sesion, contenido, fecha }] }
```

### Admin (requiere header `Authorization: Bearer {ADMIN_SECRET}`)

```
GET  /api/admin/cohortes
POST /api/admin/cohortes
     Body: { nombre, descripcion, fecha_inicio, total_sesiones }

GET  /api/admin/participantes?cohorte_id=1
     Response incluye respuestas Q1-Q8 y estado de bitácoras

POST /api/admin/upload-excel
     FormData: archivo (xlsx), cohorte_id

POST /api/admin/generar-bitacora
     Body: { participante_id, sesion }
     Genera bitácora con Claude AI

POST /api/admin/generar-todas
     Body: { cohorte_id, sesion }
     Genera bitácoras para todos los participantes

GET  /api/admin/bitacoras?cohorte_id=1&sesion=1
PUT  /api/admin/bitacoras
     Body: { id, contenido_editado?, estado? }

GET  /api/admin/prompts
POST /api/admin/prompts
     Body: { sesion, nombre, contenido }
```

---

## Configuración en Cloudflare

### Variables de Entorno (env vars)
- `ADMIN_SECRET`: Token de autenticación admin

### Secrets
- `CLAUDE_API_KEY`: API key de Anthropic

### Bindings
- `DB`: Binding a D1 database `conciencia-db`

---

## Comandos Útiles

### Deploy
```bash
cd frontend && npm run build && cd ..
wrangler pages deploy frontend/dist --project-name=conciencia-encarnada
```

### Ejecutar SQL en D1
```bash
# Consulta
wrangler d1 execute conciencia-db --remote --command="SELECT * FROM participantes"

# Archivo SQL
wrangler d1 execute conciencia-db --remote --file=migrations/0001_schema.sql
```

### Configurar secrets
```bash
wrangler pages secret put CLAUDE_API_KEY --project-name=conciencia-encarnada
```

### Ver logs
```bash
wrangler pages deployment tail --project-name=conciencia-encarnada
```

---

## Flujo de Uso

### Para Participantes
1. Acceder a `/login`
2. Ingresar email registrado
3. Ver bitácoras publicadas en `/bitacora`

### Para Administradores
1. Acceder a `/admin`
2. Ingresar ADMIN_SECRET
3. Seleccionar cohorte
4. Ver participantes y sus respuestas
5. Generar bitácoras (individual o masiva)
6. Revisar, editar y publicar bitácoras

---

## Prompt de Sesión 1

El prompt está almacenado en la tabla `prompts` y usa placeholders:
- `[[NOMBRE]]`, `[[EMAIL]]`
- `[[Q1]]` a `[[Q8]]`

Genera una bitácora con 4 secciones:
1. **Empezamos nuestro viaje.**
2. **Patrones que se transforman.**
3. **Experiencia que te acompaña.**
4. **Pasos simples, vida más ligera.**

---

## Archivos Eliminados (migración)

Se eliminaron los archivos PHP obsoletos:
- `backend/` (API PHP completa)
- `database/` (schema MySQL)

Reemplazados por:
- `functions/` (Pages Functions JS)
- `migrations/` (SQL para D1)

---

## Credenciales (.env)

```env
# Cloudflare
CF_ACCOUNT_ID=539dd34492b7046c6050b6471cf94c54
D1_DATABASE_ID=64815e97-5328-46ce-9f97-e70e5618017c

# Admin
ADMIN_SECRET=cambiar-en-produccion

# Claude API (configurado como secret en Cloudflare)
ANTHROPIC_API_KEY=sk-ant-api03-...
```

---

## Tests Realizados

| Test | Resultado |
|------|-----------|
| Login con chuchurex@gmail.com | ✅ Retorna token y datos |
| GET /api/admin/cohortes | ✅ Lista cohorte Piloto 2025 |
| GET /api/admin/participantes | ✅ Lista 5 participantes con respuestas |
| Landing page | ✅ Carga correctamente |

---

## Próximos Pasos Sugeridos

1. **Cambiar ADMIN_SECRET** en producción por uno seguro
2. **Generar bitácoras** para los 5 participantes del piloto
3. **Configurar dominio personalizado** (ej: concienciaencarnada.com)
4. **Agregar más prompts** para sesiones 2-11
5. **Implementar autenticación admin** más robusta (opcional)

---

*Documento generado el 10 de febrero de 2026*
*Implementación realizada con Claude Code*
