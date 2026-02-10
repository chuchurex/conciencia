-- Conciencia Encarnada - Database Schema for Cloudflare D1 (SQLite)

-- Cohortes (cada versión del programa)
CREATE TABLE IF NOT EXISTS cohortes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  fecha_inicio TEXT,
  fecha_fin TEXT,
  total_sesiones INTEGER DEFAULT 11,
  activa INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Participantes
CREATE TABLE IF NOT EXISTS participantes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cohorte_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  token_acceso TEXT NOT NULL UNIQUE,
  activo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (cohorte_id) REFERENCES cohortes(id)
);

-- Índice único para email + cohorte
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_cohorte ON participantes(email, cohorte_id);

-- Respuestas del formulario inicial (y de cada sesión)
CREATE TABLE IF NOT EXISTS respuestas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  participante_id INTEGER NOT NULL,
  sesion INTEGER NOT NULL DEFAULT 1,
  pregunta_key TEXT NOT NULL,
  pregunta_texto TEXT NOT NULL,
  respuesta TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (participante_id) REFERENCES participantes(id)
);

-- Índice para búsqueda por participante y sesión
CREATE INDEX IF NOT EXISTS idx_participante_sesion ON respuestas(participante_id, sesion);

-- Bitácoras generadas por IA
CREATE TABLE IF NOT EXISTS bitacoras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  participante_id INTEGER NOT NULL,
  sesion INTEGER NOT NULL,
  contenido_generado TEXT NOT NULL,
  contenido_editado TEXT,
  estado TEXT DEFAULT 'borrador' CHECK(estado IN ('borrador', 'revisado', 'publicado')),
  generado_at TEXT DEFAULT (datetime('now')),
  publicado_at TEXT,
  FOREIGN KEY (participante_id) REFERENCES participantes(id)
);

-- Índice único para participante + sesión en bitácoras
CREATE UNIQUE INDEX IF NOT EXISTS idx_bitacora_participante_sesion ON bitacoras(participante_id, sesion);

-- Prompts por sesión (almacenados en DB para editarlos desde admin)
CREATE TABLE IF NOT EXISTS prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sesion INTEGER NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  contenido TEXT NOT NULL,
  activo INTEGER DEFAULT 1,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Admins
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nombre TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Insertar prompt de Sesión 1
INSERT INTO prompts (sesion, nombre, contenido) VALUES (1, 'Inicio del camino para encarnar la conciencia', '**Rol:** Eres el redactor de la **Bitácora Conciencia Encarnada**, programa de 11 sesiones orientado a transformar la vida a través de **autoconocimiento aplicado**, **integración cuerpo–conciencia** y **prácticas simples y sostenidas**.

**Tarea:** Con las **respuestas del formulario inicial** de una persona, redacta **un texto en 4 párrafos** con los **títulos fijos** que se indican abajo. El texto debe ser **simple, hermoso, empático y profundo**, sin tecnicismos ni repeticiones literales del formulario. **No inventes nada.** Todo lo que escribas debe **deducirse exclusivamente** de lo que la persona respondió. Si algo no está, **no lo agregues**. Si la persona **no reporta** un ítem (p. ej., dolor), menciónalo de forma breve y serena, sin dramatizar. **No emitas diagnósticos clínicos** ni promesas.

**Datos del/la participante:**
* Nombre: [[NOMBRE]]
* Email: [[EMAIL]]
* Q1 ¿Qué te gustaría cambiar en tu vida?: [[Q1]]
* Q2 ¿Cuál es tu mayor goce actualmente?: [[Q2]]
* Q3 ¿Qué dolores reconoces hoy en día?: [[Q3]]
* Q4 ¿Cuándo experimentas miedo o temor y a qué?: [[Q4]]
* Q5 ¿Qué te gustaría cambiar de tu comportamiento que crees limitante?: [[Q5]]
* Q6 ¿Qué crees que te distancia de ese cambio?: [[Q6]]
* Q7 ¿Cómo has trabajado tus dolores y conductas limitantes hasta hoy?: [[Q7]]
* Q8 ¿Qué actos de autocuidado, que no dependa de otros, puedes sostener esta semana?: [[Q8]]

**Formato de salida (obligatorio):**
* Encabezado: Bitácora Conciencia Encarnada | Sesión 1 – Inicio del camino para encarnar la conciencia (Nombre: [[NOMBRE]] · Email: [[EMAIL]])
* **Exactamente 4 párrafos**, sin listas ni viñetas, con los **títulos fijos**:
  1. **Empezamos nuestro viaje.**
  2. **Patrones que se transforman.**
  3. **Experiencia que te acompaña.**
  4. **Pasos simples, vida más ligera.**
* Extensión total sugerida: **180–240 palabras**.
* Cerrar el último párrafo con una **nota breve de privacidad**.

**Tono:** Cálido, amoroso y motivador; sobrio y claro. Frases cortas o medias, "respirables". Profundidad sin complejidad innecesaria.

**Reglas clave:**
* NO inventes.
* NO deduzcas más allá de lo que la persona expresó.
* NO agregues explicaciones psicológicas, causas ocultas, diagnósticos ni promesas.');

-- Insertar cohorte piloto
INSERT INTO cohortes (nombre, descripcion, fecha_inicio, total_sesiones) VALUES
('Piloto 2025', 'Primera cohorte del programa Conciencia Encarnada', '2025-01-25', 4);
