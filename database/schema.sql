-- Conciencia Encarnada - Database Schema
-- MySQL 5.7+ / MariaDB 10.3+

CREATE DATABASE IF NOT EXISTS conciencia_encarnada
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE conciencia_encarnada;

-- Cohortes (cada versión del programa)
CREATE TABLE cohortes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  total_sesiones INT DEFAULT 11,
  activa TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Participantes
CREATE TABLE participantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cohorte_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  token_acceso VARCHAR(64) NOT NULL UNIQUE,
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cohorte_id) REFERENCES cohortes(id),
  UNIQUE KEY unique_email_cohorte (email, cohorte_id)
) ENGINE=InnoDB;

-- Respuestas del formulario inicial (y de cada sesión)
CREATE TABLE respuestas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participante_id INT NOT NULL,
  sesion INT NOT NULL DEFAULT 1,
  pregunta_key VARCHAR(10) NOT NULL,
  pregunta_texto VARCHAR(500) NOT NULL,
  respuesta TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (participante_id) REFERENCES participantes(id),
  INDEX idx_participante_sesion (participante_id, sesion)
) ENGINE=InnoDB;

-- Bitácoras generadas por IA
CREATE TABLE bitacoras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participante_id INT NOT NULL,
  sesion INT NOT NULL,
  contenido_generado TEXT NOT NULL,
  contenido_editado TEXT,
  estado ENUM('borrador','revisado','publicado') DEFAULT 'borrador',
  generado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  publicado_at TIMESTAMP NULL,
  FOREIGN KEY (participante_id) REFERENCES participantes(id),
  UNIQUE KEY unique_participante_sesion (participante_id, sesion)
) ENGINE=InnoDB;

-- Prompts por sesión (almacenados en DB para editarlos desde admin)
CREATE TABLE prompts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sesion INT NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  contenido TEXT NOT NULL,
  activo TINYINT(1) DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Admins
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

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
