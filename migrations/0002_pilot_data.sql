-- Datos del piloto - 5 participantes con sus respuestas Q1-Q8

-- Participante 1: Verónica
INSERT INTO participantes (cohorte_id, nombre, email, token_acceso)
VALUES (1, 'Verónica', 'vmenke@gmail.com', 'tok-veronica-001-' || hex(randomblob(16)));

INSERT INTO respuestas (participante_id, sesion, pregunta_key, pregunta_texto, respuesta) VALUES
(1, 1, 'Q1', '¿Qué te gustaría cambiar en tu vida?', 'Mi auto cuidado, comer mejor, tomar menos, hacer ejercicio. Darme espacio en el dia para avanzar en aprender mas de los cursos que he tomado para poder aplicar mas tecnicas terapéuticas.'),
(1, 1, 'Q2', '¿Cuál es tu mayor goce actualmente?', 'Estar sola y tranquila sin necesidad de estar conversando con alguien o escuchando a alguien. Estoy disfrutando mucho mis espacios de tranquilidad conmigo misma. También disfruto mucho haciendo TRE, Terapia de Respuesta Espiritual, ya que me conecto para un otro y eso me hace muy feliz.'),
(1, 1, 'Q3', '¿Qué dolores reconoces hoy en día?', 'Estoy pasando por un momento de mucha paz y tranquilidad y no sabria identificar un dolor en particular.'),
(1, 1, 'Q4', '¿Cuándo experimentas miedo o temor y a qué?', 'Le tengo miedo al conflicto pero eso hoy no me detiene cuando tengo que decir algo a alguien ya que lo hago desde el amor. Antes no decía nada, prefería callar y evitar.'),
(1, 1, 'Q5', '¿Qué te gustaría cambiar de tu comportamiento que crees limitante?', 'Lo mismo que comenté en la pregunta 1.'),
(1, 1, 'Q6', '¿Qué crees que te distancia de ese cambio?', 'A veces creo que es fuerza de voluntad o autoboicot pero no lo he descubierto aún.'),
(1, 1, 'Q7', '¿Cómo has trabajado tus dolores y conductas limitantes hasta hoy?', 'He hecho terapia tradicional y terapias alternativas. Diría que he avanzado mucho con TRE, algunas cosas con la Angeles y también Flores de Bach a partir del autoconocimiento.'),
(1, 1, 'Q8', '¿Qué actos de autocuidado, que no dependa de otros, puedes sostener esta semana?', 'Descansar, dormir mas horas y encontrar espacios para estar en paz.');

-- Participante 2: David
INSERT INTO participantes (cohorte_id, nombre, email, token_acceso)
VALUES (1, 'David', 'david.ivaha@gmail.com', 'tok-david-002-' || hex(randomblob(16)));

INSERT INTO respuestas (participante_id, sesion, pregunta_key, pregunta_texto, respuesta) VALUES
(2, 1, 'Q1', '¿Qué te gustaría cambiar en tu vida?', 'Nada'),
(2, 1, 'Q2', '¿Cuál es tu mayor goce actualmente?', 'Levantarme/acortarme y agradecer al universo de lo que estoy viviendo'),
(2, 1, 'Q3', '¿Qué dolores reconoces hoy en día?', 'Perder a alguien muy querido'),
(2, 1, 'Q4', '¿Cuándo experimentas miedo o temor y a qué?', 'Tener miedo al no tener recursos económicos y por ende no sostener a mi familia'),
(2, 1, 'Q5', '¿Qué te gustaría cambiar de tu comportamiento que crees limitante?', 'Distanciarme de la gente'),
(2, 1, 'Q6', '¿Qué crees que te distancia de ese cambio?', 'Mi educación. Mis padres me educaron así.'),
(2, 1, 'Q7', '¿Cómo has trabajado tus dolores y conductas limitantes hasta hoy?', 'Conversando y escuchando con almas sabias'),
(2, 1, 'Q8', '¿Qué actos de autocuidado, que no dependa de otros, puedes sostener esta semana?', 'Escuchar música relajante para relativizar a mi situación y constatar que no es tan grave');

-- Participante 3: Paz
INSERT INTO participantes (cohorte_id, nombre, email, token_acceso)
VALUES (1, 'Paz', 'pazita.poblete@gmail.com', 'tok-paz-003-' || hex(randomblob(16)));

INSERT INTO respuestas (participante_id, sesion, pregunta_key, pregunta_texto, respuesta) VALUES
(3, 1, 'Q1', '¿Qué te gustaría cambiar en tu vida?', 'Nada. Creo que todo ocurre para mi perfecta evolución. Si bien estoy en un momento de mucha incertidumbre, confío en el proceso.'),
(3, 1, 'Q2', '¿Cuál es tu mayor goce actualmente?', 'Mi propia conexión. Mi escucha. Mi encuentro. Mi proceso instrospectivo. Yo y mi mundo interior.'),
(3, 1, 'Q3', '¿Qué dolores reconoces hoy en día?', 'Sigo trabajando en mi sentido de merecimiento. En la abundancia, sobre todo en lo económico.'),
(3, 1, 'Q4', '¿Cuándo experimentas miedo o temor y a qué?', 'Cuando pienso en escenarios catastróficos en que pierdo a seres queridos siento mucho miedo.'),
(3, 1, 'Q5', '¿Qué te gustaría cambiar de tu comportamiento que crees limitante?', 'En el merecimiento profundo y en el síndrome de la impostora.'),
(3, 1, 'Q6', '¿Qué crees que te distancia de ese cambio?', 'Posiblemente debo seguir transitando espacios que aún no logro ver con claridad.'),
(3, 1, 'Q7', '¿Cómo has trabajado tus dolores y conductas limitantes hasta hoy?', 'Múltiples vías: primero y por más de 15 años, a través de terapia psicológica.'),
(3, 1, 'Q8', '¿Qué actos de autocuidado, que no dependa de otros, puedes sostener esta semana?', 'Escritura terapéutica, alimentación consciente, conexión conmigo misma.');

-- Participante 4: Valeska
INSERT INTO participantes (cohorte_id, nombre, email, token_acceso)
VALUES (1, 'Valeska', 'vnaranjodaw@gmail.com', 'tok-valeska-004-' || hex(randomblob(16)));

INSERT INTO respuestas (participante_id, sesion, pregunta_key, pregunta_texto, respuesta) VALUES
(4, 1, 'Q1', '¿Qué te gustaría cambiar en tu vida?', 'Mi quehacer profesional para que esté ligado a mi propósito con disfrute'),
(4, 1, 'Q2', '¿Cuál es tu mayor goce actualmente?', 'Hacer un trabajo que ayude al bienestar de las personas'),
(4, 1, 'Q3', '¿Qué dolores reconoces hoy en día?', 'Estar sin pareja, sin holgura económica y no estar entregando mis aprendizajes de forma constante'),
(4, 1, 'Q4', '¿Cuándo experimentas miedo o temor y a qué?', 'A la incertidumbre económica, a que les pase algo malo a mis hijos'),
(4, 1, 'Q5', '¿Qué te gustaría cambiar de tu comportamiento que crees limitante?', 'Tener mucho miedo paralizante aunque ya está en curso de cambio'),
(4, 1, 'Q6', '¿Qué crees que te distancia de ese cambio?', 'Estar en certeza interna de que este tránsito será asistido para mejor y desde la confianza'),
(4, 1, 'Q7', '¿Cómo has trabajado tus dolores y conductas limitantes hasta hoy?', 'Con terapia, meditación, coaching de conciencia interior con auto cuidado'),
(4, 1, 'Q8', '¿Qué actos de autocuidado, que no dependa de otros, puedes sostener esta semana?', 'Meditar respirar consciente trabajar en mi propósito tesis');

-- Participante 5: Paola
INSERT INTO participantes (cohorte_id, nombre, email, token_acceso)
VALUES (1, 'Paola', 'pandrea.santibanez@gmail.com', 'tok-paola-005-' || hex(randomblob(16)));

INSERT INTO respuestas (participante_id, sesion, pregunta_key, pregunta_texto, respuesta) VALUES
(5, 1, 'Q1', '¿Qué te gustaría cambiar en tu vida?', 'Me gustaría tener menos miedo a exponerme, a equivocarme, me gustaría trabajar con más grupos.'),
(5, 1, 'Q2', '¿Cuál es tu mayor goce actualmente?', 'Conectar con la naturaleza y el mundo interior'),
(5, 1, 'Q3', '¿Qué dolores reconoces hoy en día?', 'Dolores existenciales, perdida del sentido de la vida, búsqueda del sentido de la vida'),
(5, 1, 'Q4', '¿Cuándo experimentas miedo o temor y a qué?', 'Experimento miedo al rechazo, cuando voy a exponerme en cosas nuevas, miedo a ser juzgada'),
(5, 1, 'Q5', '¿Qué te gustaría cambiar de tu comportamiento que crees limitante?', 'Me gustaría cambiar mi inseguridades corporales y amarme tal cual soy, dejar de compararme'),
(5, 1, 'Q6', '¿Qué crees que te distancia de ese cambio?', 'Mis creencias'),
(5, 1, 'Q7', '¿Cómo has trabajado tus dolores y conductas limitantes hasta hoy?', 'Auto indagación'),
(5, 1, 'Q8', '¿Qué actos de autocuidado, que no dependa de otros, puedes sostener esta semana?', 'Decir la frase a conciencia en un espacio natural, solo yo');
