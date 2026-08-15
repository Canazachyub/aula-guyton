# Repasos — Banco de práctica autoevaluado (PROPUESTA DE DISEÑO)

> **Estado: PROPUESTA. No construir hasta que el usuario dé su OK.**
> Este documento diseña la sección de "Repasos" pedida por el usuario: una plataforma de
> preguntas de **opción múltiple** para que el estudiante **practique libremente** y vea al
> instante si acertó, con una explicación. **No cuenta como nota** (no es un examen ni un
> simulacro con ranking — eso quedaría para una fase posterior).
>
> Se diseña siguiendo la regla del proyecto: el modelo se aprueba en papel antes de tocar datos
> reales. Nada aquí modifica las 12 hojas actuales; todo se agrega como **hoja(s) nueva(s)**,
> exactamente como `MODELO_DATOS.md` previó para `notas`, `ranking` y `simulacros`.

## 1. Decisión de forma: una sola hoja "ancha" (recomendado)

Hay dos maneras de guardar preguntas de opción múltiple en Sheets:

- **Normalizada** (2 hojas): una hoja `repaso_preguntas` + una hoja `repaso_opciones` con una
  fila por alternativa ligada por `id_pregunta`. Es lo más "puro" relacionalmente.
- **Ancha / denormalizada** (1 hoja): cada pregunta es una fila con columnas
  `opcion_a … opcion_e` + `correcta`. Menos "pura", pero **una persona de la academia puede
  escribir preguntas a mano en Sheets** llenando columnas, sin manejar FKs ni saltar entre dos
  hojas.

**Recomendación: la forma ancha (1 hoja).** El banco de preguntas lo van a redactar docentes o
auxiliares directamente en el Sheet, no un programa. Para ese usuario real, llenar
`opcion_a, opcion_b, opcion_c, opcion_d` y poner `correcta = c` es mucho más simple y menos
propenso a errores que mantener referencias entre dos hojas a mano. El costo es un tope de
alternativas (proponemos hasta 5: a–e, con e opcional) y no poder tener preguntas con número
variable grande de opciones — aceptable para práctica de admisión.

> Si prefieres la forma normalizada (más flexible a futuro, p.ej. para simulacros con banco
> compartido), dilo y cambio el diseño a 2 hojas.

## 2. Hoja nueva propuesta: `repaso_preguntas`

Prefijo de id: **`rpg`** (no colisiona con los prefijos existentes).

| Columna | Tipo | Obligatoria | Descripción | Ejemplo |
|---|---|---|---|---|
| id_pregunta | texto (id) | sí | Identificador único | `rpg-001` |
| id_curso | texto (FK → cursos) | sí | Curso del catálogo global al que pertenece la pregunta | `cur-demo-1` |
| semana | número | no | Semana/tema del ciclo para filtrar | `1` |
| tema | texto | no | Tema breve para agrupar | `Números reales` |
| enunciado | texto | sí | La pregunta | `¿Cuál de los siguientes es un número irracional?` |
| opcion_a | texto | sí | Alternativa A | `3/4` |
| opcion_b | texto | sí | Alternativa B | `√2` |
| opcion_c | texto | sí | Alternativa C | `0.5` |
| opcion_d | texto | no | Alternativa D (puede quedar vacía) | `-7` |
| opcion_e | texto | no | Alternativa E (puede quedar vacía) | (vacío) |
| correcta | texto (enum) | sí | Letra de la alternativa correcta: `a`/`b`/`c`/`d`/`e` | `b` |
| explicacion | texto | no | Se muestra DESPUÉS de responder | `√2 no puede escribirse como fracción de enteros.` |
| dificultad | texto (enum) | no | `facil`/`media`/`dificil` | `media` |
| id_autor | texto (FK → usuarios) | sí | Quién la redactó | `usr-demo-2` |
| fecha_creacion | fecha | sí | Cuándo se creó | `2026-07-20` |
| estado | texto (enum) | sí | `borrador`/`publicado` — **patrón fila-pública**: solo `publicado` se muestra al alumno | `publicado` |

### Por qué se liga a `id_curso` y no a `id_ciclo_curso`
Una pregunta de "números reales" sirve **cualquier ciclo** en que se dicte Matemática. Ligarla al
curso global (`id_curso`) permite reutilizar el banco ciclo tras ciclo sin recapturarlo — la
misma razón por la que `cursos` es un catálogo global y no se duplica por ciclo. El estudiante ve
las preguntas del curso que está llevando (se llega vía su `ciclo_curso` → `id_curso`).

> Alternativa si la quieres por ciclo: cambiar `id_curso` por `id_ciclo_curso` (preguntas
> específicas del ciclo, controladas por el docente asignado). Menos reutilizable. Dímelo y lo
> ajusto.

## 3. Intentos / resultados: NO en esta fase

Como es práctica autoevaluada que **no cuenta como nota**, el MVP **no guarda** los intentos del
alumno: la corrección ocurre en el momento y no se persiste. Esto mantiene el alcance mínimo y no
agrega otra hoja.

Cuando quieras estadísticas ("cuántas acertó", progreso, ranking) se agregaría una hoja futura
`repaso_intentos` (`id_intento` prefijo `rpi`, `id_usuario`, `id_pregunta`, `respondio`,
`correcta_bool`, `fecha`) que cuelga de `id_usuario` sin tocar nada de lo anterior — igual que
`notas`/`ranking`/`simulacros` estaban previstos.

## 4. Backend (cuando se apruebe): acciones nuevas en `Codigo.gs`

- **Lectura** `obtenerRepasos(sesion, { id_curso, semana? })`: devuelve las preguntas
  `publicado` del curso indicado, solo si el curso pertenece a un `ciclo_curso` visible para la
  sesión (misma regla de permisos que el resto). Como es práctica (no examen), la respuesta
  **sí** incluye `correcta` y `explicacion`: el alumno se autoevalúa al instante en el cliente.
  (Para simulacros a futuro, se ocultaría `correcta` y se corregiría en el servidor.)
- **Escritura (opcional, para gestión)** `guardarPregunta(sesion, datos)`: superadmin/docente
  crea o edita preguntas de sus cursos, con validación de que `correcta` apunte a una opción no
  vacía y de la regla fila-pública. Para el MVP también sirve capturarlas a mano en el Sheet.

Se agrega `repaso_preguntas` al objeto `ESQUEMAS` de `Codigo.gs` con sus tipos de columna. No se
modifica ninguna de las 12 hojas existentes ni sus acciones.

## 5. Frontend (cuando se apruebe)

- **Estudiante → Repasos:** elige curso (y opcionalmente semana/tema) → responde preguntas una a
  una → al elegir alternativa ve si acertó, se resalta la correcta y aparece la `explicacion`.
  Contador de aciertos de la sesión (en memoria, no persiste). Aquí vive la **mascota fénix**.
- **Docente/Superadmin → gestión del banco (opcional, fase siguiente):** alta/edición de
  preguntas de sus cursos, alternar `borrador`/`publicado`.

Mientras tanto, ya se dejó en el panel del estudiante una entrada **"Repasos"** con una pantalla
"en diseño / próximamente" y la **mascota fénix provisional** (placeholder marcado como tal; la
imagen final la generará el usuario con ChatGPT).

## 6. Datos DEMO propuestos (para cuando se construya)

3–4 preguntas DEMO de `cur-demo-1` (Matemática) y `cur-demo-2` (Comunicación), con ids
`rpg-demo-1…`, marcadas DEMO, para poder probar la vista sin datos reales — mismo criterio que el
resto del Excel.

## 7. Qué necesito de ti para construir esto

1. **OK a la forma ancha (1 hoja)** o pedir la normalizada (2 hojas).
2. **OK a ligar por `id_curso`** (banco global reutilizable) o pedir `id_ciclo_curso` (por ciclo).
3. Confirmar que **no guardamos intentos** por ahora.

Con eso: agrego la hoja al Excel/generador, extiendo `Codigo.gs`, y construyo la vista real del
estudiante (reemplazando el placeholder), cada paso con su verificación.
