# Banqueo Guyton UNA Puno — análisis del Excel de simulacros y diseño (PROPUESTA)

> **Estado: PROPUESTA para tu OK.** Reemplaza el borrador anterior `REPASOS.md` con un alcance
> más real, basado en el análisis del Excel `UNA PUNO SIMULACROS (1).xlsx` que el usuario ya
> tiene en producción. No se construye nada hasta que apruebes las decisiones del final.

## 1. Qué hay en el Excel (análisis)

47 hojas. Las relevantes:

- **18 hojas `Banco_<curso>`** — el banco de preguntas. Estructura idéntica y limpia (16 cols):

  `Question Text | Question Type | Option 1..5 | Correct Answer | Time in seconds | Image Link |
  JUSTIFICACION | NUMERO | CURSO | TEMA | SUBTEMA | NOMBRE DEL ARCHIVO`

  - `Correct Answer` es un **número 1–5** (qué opción es la correcta).
  - `JUSTIFICACION` = explicación por pregunta → ideal para autoevaluación inmediata.
  - `TEMA` / `SUBTEMA` = jerarquía temática → ideal para armar un "mapa" de práctica por curso.
  - `NOMBRE DEL ARCHIVO` = examen de origen (ej. "EXAMEN GENERAL SOC 2018 2 FASE").
- **`Configuración_Sociales / _Ingenierías / _Biomédicas`** — por área: cuántas preguntas y qué
  **pondera** cada asignatura en un simulacro (define el puntaje). Las 18 asignaturas son las
  mismas en las 3 áreas; cambia el peso. "Letras" = área **Sociales**.
- **`historial_puntajes`** (DNI, Fecha, Área, Puntaje, Correctas, Total, %) y **`usuarios`**,
  **`confirmado`**, **`Registros`** — datos de la plataforma de simulacros actual.
- **17 hojas `CEPRE_<curso>`** — variante con columnas extra `AREA` y `SEMANA` (banco organizado
  por semana del ciclo CEPRE). Útil a futuro; no entra en esta fase.

### Volúmenes (preguntas por banco)
RM 578 · RV 570 · Psico/Filo 308 · Comunicación 307 · Geografía 298 · Química 292 · Historia 290 ·
Física 295 · Bio/Anat 284 · Economía 253 · Literatura 240 · Cívica 219 · Álgebra 201 · Geometría 201 ·
Aritmética 199 · Trigonometría 179 · **Inglés 16 · Quechua/Aimara 16** (estos dos, escasos).

### Dos hallazgos que condicionan el diseño
1. **Cero imágenes**: `Image Link` está vacío en las 18 hojas. Las preguntas que dicen "en el
   gráfico…" no son usables sin la figura. **Letras casi no depende de figuras**, por eso arrancar
   por letras evita el problema. Las que sí la necesiten mostrarán "(figura no disponible)".
2. **Datos personales reales** en `usuarios` (231), `historial_puntajes` (178), `confirmado` (32):
   DNI, correo, celular de personas reales. **No se importan.** Solo se importan las preguntas, y
   van al **Sheet privado del backend**, nunca al repo público de GitHub.

## 2. Qué es "letras" (área Sociales), con datos del Excel

Cursos de letras y su peso en un simulacro Sociales (nº de preguntas por curso):

| Curso | Preguntas en simulacro Sociales | Banco disponible |
|---|:--:|:--:|
| Razonamiento Verbal | 6 | 570 |
| Razonamiento Matemático | 6 | 578 |
| Comunicación | 4 | 307 |
| Psicología y Filosofía | 4 | 308 |
| Geografía | 4 | 298 |
| Historia | 4 | 290 |
| Educación Cívica | 4 | 219 |
| Economía | 4 | 253 |
| Literatura | 4 | 240 |
| Inglés | 2 | 16 |
| Quechua y Aimara | 2 | 16 |

(Las 7 de ciencias —Aritmética, Álgebra, Geometría, Trigonometría, Física, Química, Bio/Anat—
existen en el mismo Excel y se sumarían igual en una fase siguiente.)

## 3. Diseño propuesto — "Banqueo Guyton UNA Puno"

### 3.1 Almacenamiento del banco (DECIDIDO: hojas nuevas en BD Guyton)
El banco va como **hojas nuevas en el mismo Sheet BD Guyton** (decisión del usuario). Para que
esto NO frene el aula, el backend las trata como **carga diferida**: `cargarBd` NO las lee; solo
se leen (y se cachean por curso con CacheService) cuando se abre Banqueo. Así cada llamada normal
del API sigue igual de rápida aunque el banco tenga miles de filas.

Se usa **una sola hoja consolidada `banqueo_preguntas`** (una pestaña fácil de subir) con la
columna `curso`, en vez de 11 hojas separadas. Estructura normalizada:

| Columna | Origen en el Excel | Nota |
|---|---|---|
| id_pregunta (`bpg-…`) | generado | id estable |
| curso | CURSO / nombre de hoja | |
| tema | TEMA | agrupa el "mapa" |
| subtema | SUBTEMA | lección dentro del tema |
| enunciado | Question Text | |
| opcion_1..5 | Option 1..5 | opcion_5 puede ir vacía |
| correcta | Correct Answer | número 1–5 |
| justificacion | JUSTIFICACION | se muestra al responder |
| tiempo_seg | Time in seconds | por si se cronometra |
| imagen_url | Image Link | hoy vacío; se llena a futuro |
| fuente | NOMBRE DEL ARCHIVO | trazabilidad |
| estado | — | `publicado`/`borrador` (patrón fila-pública) |

Un **script de importación** (Python, como `generar_excel.py`) transforma las hojas de letras del
Excel origen a esta estructura, limpiando y saltando preguntas sin opciones válidas.

### 3.2 Progreso SIMPLE (DECIDIDO)
Gamificación **simple** (decisión del usuario): progreso y % de dominio por curso, **sin** gemas,
racha ni mapa de lecciones. El **fénix acompaña** la pantalla (no es un juego completo aún; se
puede subir de nivel a Duolingo más adelante sin rehacer el modelo).

- Práctica por curso (opcionalmente filtrando por `tema`), pregunta a pregunta, con feedback
  inmediato y la `justificacion`.
- Se muestra: preguntas respondidas, correctas y **% de dominio** por curso, con el fénix.

Almacenamiento (hoja nueva `banqueo_progreso`, pequeña — una fila por usuario y curso):
`id_progreso`, `id_usuario`, `curso`, `respondidas`, `correctas`, `ultima_practica`.
(Deja espacio para agregar `xp`/`racha` si luego se sube a Duolingo completo.)

### 3.3 Interfaz (mejora pedida)
- **Estudiante → "Banqueo Guyton"**: pantalla de cursos de letras con su avance (barra, nivel,
  gemas, racha y el fénix). Entrar a un curso muestra el mapa de lecciones por tema. En una
  lección: preguntas una a una, feedback inmediato con la justificación, y animación de XP/gemas.
- Diseño con la identidad Guyton (azules + naranja); el fénix acompaña el avance. Uso la skill
  `dataviz` para las barras de progreso/estadística con la paleta de marca.

## 4. Clases grabadas de YouTube como "ciclos pasados"

El canal tiene playlists por curso (ej. "GEOGRAFÍA II - SEMIANUAL 2026-I"), hoy **ocultas**
(unlisted): https://www.youtube.com/@AcademiaGuyton/playlists

Diseño DECIDIDO: **links sueltos por ciclo** (sin biblioteca reutilizable). Es más simple y
**reutiliza el modelo que ya existe**: una grabación es una fila en `materiales` con
`tipo = video_grabado` y `url_drive` = enlace de YouTube (playlist o video), colgada de un
`ciclo_curso`. Ya el aula embebe YouTube en materiales.

- **Solo superadmin/admin** gestiona: en el panel de admin, crea el ciclo pasado (estado
  `finalizado`), sus `ciclo_cursos`, y pega el enlace de la playlist/video de cada curso como un
  material `video_grabado`. Elige a qué ciclo pertenece.
- **Estudiante**: en su ciclo ve las grabaciones embebidas, como cualquier material.
- **A futuro**: el mismo campo admite un enlace de Drive en vez de YouTube, sin rediseñar (cuando
  sincronices con Drive).

> Para cargar las grabaciones reales necesito de ti los **enlaces de las playlists** (están
> ocultas en el canal, no puedo leerlas). Con uno o dos de muestra ya puedo probar la vista.

## 5. Privacidad y alcance (regla de honestidad)
- Se importan **solo preguntas**. Nunca los datos personales del Excel (usuarios/puntajes reales).
- Las preguntas viven en el **Sheet privado** del backend y se sirven **solo a usuarios con
  sesión** válida; no se commitean al repo público. En modo DEMO se incluyen unas pocas de muestra.
- Las preguntas provienen de exámenes de admisión; son material de la academia. Se tratan como tal.

## 6. Decisiones CERRADAS (del usuario, 2026-08-15)

1. **Cursos (11, solo "de letras"/conceptuales, sin números):** Comunicación, Literatura,
   Razonamiento Verbal, Psicología y Filosofía, Historia, Geografía, Economía, Educación Cívica,
   **Biología y Anatomía** (ciencia pero teórica), Inglés y Quechua/Aimara. **Excluidos:**
   Aritmética, Álgebra, Geometría, Trigonometría, Física, Química, Razonamiento Matemático.
2. **Gamificación: simple** (progreso + % por curso; el fénix acompaña; Duolingo completo queda
   para después).
3. **Banco: hojas nuevas en BD Guyton**, hoja consolidada `banqueo_preguntas`, **carga diferida**
   (fuera de `cargarBd`, cacheada) para no frenar el API.
4. **Grabaciones: links sueltos por ciclo** reutilizando `materiales` (`video_grabado` + enlace de
   YouTube), gestionado solo por admin.

## 7. Ya hecho / plan de construcción

- ✅ **`docs/generar_banqueo.py`** + **`BANQUEO_GUYTON.xlsx`** generados: **2798 preguntas** de los
  11 cursos, limpiadas (3 descartadas por datos inválidos; 96 en `borrador` por requerir figura
  sin imagen, así no se muestran). El .xlsx está en `.gitignore` (material de la academia +
  privacidad): se sube manualmente como pestaña `banqueo_preguntas` al Sheet privado BD Guyton,
  junto con la pestaña vacía `banqueo_progreso`.
- ⏭ **Backend** (`Codigo.gs`): acciones `obtenerBanqueoCursos`, `obtenerBanqueoPreguntas(curso)` y
  `registrarRespuestaBanqueo` (actualiza `banqueo_progreso`), con lectura diferida + cache; nada
  entra en `cargarBd`.
- ⏭ **Frontend**: sección "Banqueo Guyton UNA Puno" del estudiante (reemplaza el placeholder de
  Repasos) con el fénix, práctica por curso y % de dominio. Para grabaciones, ampliar el panel de
  admin para pegar enlaces de YouTube por ciclo/curso.
- Cada paso con su verificación (build+lint / node --check) y sin tocar los datos personales del
  Excel.

