# Roles y Flujos — Un día típico en el Aula Guyton

Este documento simula el uso real del sistema, rol por rol, señalando en cada paso qué hoja de
`BASE_DATOS_GUYTON.xlsx` se lee o se escribe. Los nombres y datos usados aquí son los mismos
del Excel DEMO (`usr-demo-*`, `cic-demo-1`, etc.), para que la simulación se pueda seguir línea
por línea abriendo el archivo al lado.

Personas de la simulación (todas ficticias, hoja `usuarios`):

- **Ana Quispe Mamani** (`usr-demo-1`) — superadmin.
- **Carlos Huanca Ticona** (`usr-demo-2`) — docente de Matemática y Comunicación.
- **Rosa Flores Apaza** (`usr-demo-3`) — auxiliar.
- **Luis Condori Yucra** (`usr-demo-4`) — estudiante, matriculado en `cic-demo-1` (2026-II).
- **Maria Chura Pacco** (`usr-demo-5`) — estudiante, se retiró del mismo ciclo.

---

## 1. Flujo del estudiante: de la inscripción a ver una grabación

**Paso 1 — Preinscripción.** Luis ve en la landing pública (Fase 3) que el ciclo 2026-II tiene
inscripciones abiertas y llena el formulario. El sistema crea una fila nueva en `matriculas`:
`id_matricula = mat-demo-1`, `id_usuario = usr-demo-4`, `id_ciclo = cic-demo-1`,
`estado = preinscrito`.

**Paso 2 — Pago de matrícula.** Luis paga por Yape y sube la captura. Se crea una fila en
`pagos`: `id_pago = pag-demo-1`, `id_matricula = mat-demo-1`, `concepto = matricula`,
`monto = 100.00`, `medio = yape`, `estado = pendiente`, `voucher_ref = YAPE-000123`.

**Paso 3 — Verificación.** La auxiliar Rosa revisa el voucher contra el Yape de la academia y lo
marca verificado: en `pagos`, `pag-demo-1.estado` pasa a `verificado`,
`fecha_verificacion = 2026-06-29`, `id_verificador = usr-demo-3`. Con la matrícula pagada, en
`matriculas` el `estado` de `mat-demo-1` pasa de `preinscrito` a `matriculado`.

**Paso 4 — Ya matriculado, Luis entra al aula.** Inicia sesión con su `dni` (`70000004`) y su
`clave_acceso`. El sistema busca su fila en `usuarios`, confirma `rol = estudiante` y
`estado = activo`, y busca sus matrículas activas para saber a qué ciclo tiene acceso
(`mat-demo-1` → `cic-demo-1`).

**Paso 5 — Ve su horario.** El aula lee `ciclo_cursos` filtrando por `id_ciclo = cic-demo-1`
(obtiene `cco-demo-1` Matemática y `cco-demo-2` Comunicación), y para cada una lee `horario`:
lunes 18:00–20:00 Matemática (`hor-demo-1`), miércoles 18:00–20:00 Comunicación (`hor-demo-2`).

**Paso 6 — Asiste a la clase en vivo.** El lunes 13 de julio entra al enlace de `clases`
(`cls-demo-1`, `enlace_en_vivo`). Al día siguiente la clase queda con `estado = dictada`.

**Paso 7 — Pasan asistencia.** La auxiliar Rosa registra que Luis estuvo presente: fila en
`asistencias`, `id_asistencia = asi-demo-1`, `id_clase = cls-demo-1`, `id_usuario = usr-demo-4`,
`estado = presente`, `id_registrador = usr-demo-3`.

**Paso 8 — El docente sube el material.** Ver flujo del docente abajo (`mtl-demo-1`,
`mtl-demo-2`).

**Paso 9 — Luis revisa la grabación y la práctica.** Entra a "Materiales" de Matemática, filtra
por `id_ciclo_curso = cco-demo-1`, y ve la fila `mtl-demo-1` (`pdf_practica`, publicada) junto
con `mtl-demo-2` (`pdf_resolucion`) porque esta última tiene `id_material_padre = mtl-demo-1` —
la plataforma las agrupa automáticamente. La grabación de la clase de Comunicación
(`mtl-demo-3`) todavía no le aparece: su `estado` es `borrador` (Carlos la está subiendo, no ha
terminado de procesarla).

**Paso 10 — Luis revisa sus pagos y su asistencia.** En su vista de solo lectura ve
`pagos` filtrado por su `id_matricula` (matrícula verificada, mensualidad 1 con
`pag-demo-2` en `estado = pendiente`) y `asistencias` filtrado por su `id_usuario`.

---

## 2. Flujo del docente: subir práctica + resolución vinculadas

**Paso 1.** Carlos (`usr-demo-2`) entra al aula y ve solo los `ciclo_cursos` donde
`id_docente = usr-demo-2`: `cco-demo-1` (Matemática, 2026-II) y `cco-demo-2` (Comunicación,
2026-II). No ve `cco-demo-3` (Matemática del ciclo planificado 2027-I) porque ese registro
todavía tiene `id_docente` vacío — nadie se lo ha asignado.

**Paso 2 — Programa la clase.** Antes del lunes, Carlos crea la fila en `clases`:
`id_clase = cls-demo-1`, `id_ciclo_curso = cco-demo-1`, `fecha = 2026-07-13`, `tema = "Números
reales y operaciones básicas"`, `modalidad = virtual`, `estado = programada`.

**Paso 3 — Dicta la clase y la marca dictada.** Al terminar, cambia `cls-demo-1.estado` a
`dictada`.

**Paso 4 — Sube la práctica.** Sube el PDF a
`Drive/2026-II/Matemática/Practicas/` y pega el enlace en una fila nueva de `materiales`:
`id_material = mtl-demo-1`, `id_ciclo_curso = cco-demo-1`, `id_clase = cls-demo-1`,
`tipo = pdf_practica`, `titulo = "Práctica 1: Números reales"`, `semana = 1`,
`id_material_padre` vacío, `estado = publicado`. Los alumnos ya la pueden ver.

**Paso 5 — Sube la resolución, vinculada a la práctica.** Un día después sube el PDF de
resolución a `Drive/2026-II/Matemática/Resoluciones/` y crea otra fila:
`id_material = mtl-demo-2`, mismo `id_ciclo_curso`, `tipo = pdf_resolucion`,
`titulo = "Resolución Práctica 1"`, **`id_material_padre = mtl-demo-1`**. No repite curso ni
semana: la plataforma la muestra pegada a la práctica porque sigue el puntero.

**Paso 6 — Sube la grabación, todavía en borrador.** Para la clase de Comunicación
(`cls-demo-2`, dictada el 15 de julio), Carlos sube el video a
`Drive/2026-II/Comunicación/Grabaciones/` y crea la fila `mtl-demo-3` con
`tipo = video_grabado`, `id_clase = cls-demo-2`, pero la deja en `estado = borrador` mientras
termina de recortar el inicio. Ningún alumno la ve todavía — cuando la pase a `publicado`,
aparecerá.

**Paso 7 — Revisa su asistencia registrada.** Carlos puede ver, de solo lectura, las filas de
`asistencias` de sus propias clases (las que registró Rosa), pero no las de cursos que no
dicta.

---

## 3. Flujo del superadmin: abrir el ciclo 2027-I sin tocar código

**Paso 1.** Ana (`usr-demo-1`) crea la fila en `ciclos`: `id_ciclo = cic-demo-2`,
`nombre = "2027-I"`, `estado = planificado`, con sus fechas y precios. Ningún código cambia —
es una fila nueva en una hoja de Sheets.

**Paso 2 — Asigna qué se dicta.** Crea una fila en `ciclo_cursos`:
`id_ciclo_curso = cco-demo-3`, `id_ciclo = cic-demo-2`, `id_curso = cur-demo-1` (Matemática),
y deja `id_docente` vacío por ahora — todavía no ha decidido quién lo dicta.

**Paso 3 — Cuando decide el docente,** solo edita esa fila y llena `id_docente`. En cuanto lo
hace, Carlos (si es el elegido) empezaría a ver ese `ciclo_curso` en su panel, sin que nadie
haya tocado el backend.

**Paso 4 — Abre inscripciones.** Cuando esté listo, cambia `cic-demo-2.estado` a
`inscripciones_abiertas`, y la landing empieza a mostrarlo como disponible.

**Paso 5 — Superadmin también puede:** verificar cualquier pago (no solo delegar en Rosa),
reasignar roles en `usuarios`, y publicar anuncios globales (`anuncios` con `id_ciclo` vacío).

---

## 4. Un caso de retiro (para completar el ciclo de vida de una matrícula)

Maria (`usr-demo-5`) se preinscribió (`mat-demo-2`, `cic-demo-1`) y reportó el pago de
matrícula por efectivo (`pag-demo-3`), pero el comprobante no correspondía al monto — Rosa lo
marca `rechazado` en `pagos`. Sin pago verificado, Maria nunca pasa a `matriculado`; tras no
regularizar, Ana marca `mat-demo-2.estado = retirado` con una observación. Su cuenta en
`usuarios` sigue `activa` (podría preinscribirse en otro ciclo más adelante) — el retiro es del
ciclo, no de la persona.

---

## Matriz de permisos por rol

| Acción | superadmin | docente | auxiliar | estudiante |
|---|:---:|:---:|:---:|:---:|
| Crear/editar `ciclos` | Sí | No | No | No |
| Crear/editar `cursos` (catálogo) | Sí | No | No | No |
| Asignar docente en `ciclo_cursos` | Sí | No | No | No |
| Ver/editar `usuarios` y roles | Sí | No | No | No (solo su propio perfil, lectura) |
| Programar/marcar sus `clases` | Sí | Sí (solo sus `ciclo_cursos`) | No | No |
| Subir/publicar `materiales` | Sí | Sí (solo sus `ciclo_cursos`) | No | No (solo lectura) |
| Ver `materiales` publicados | Sí | Sí (los suyos) | Sí | Sí (solo de su ciclo) |
| Registrar `asistencias` | Sí | Sí (sus clases) | Sí | No |
| Ver `asistencias` | Todas | Las de sus clases | Todas | Solo las suyas |
| Registrar `pagos` reportados | Sí | No | Sí | Sí (reporta el suyo) |
| Verificar/rechazar `pagos` | Sí | No | Solo si superadmin delega | No |
| Ver `pagos` | Todos | No | Todos | Solo los suyos |
| Publicar `anuncios` | Sí (global o por ciclo) | No | Sí (por ciclo, soporte) | No (solo lectura) |
| Ver `horario` y `clases` | Todos | Los suyos | Todos | Solo los de su ciclo |
| Editar `config` | Sí | No | No | No |

**Regla base que resume la matriz:** el estudiante siempre está limitado a **su** ciclo (vía su
`matricula`); el docente siempre está limitado a **sus** `ciclo_cursos` (vía `id_docente`); el
auxiliar opera en soporte transversal (asistencia, registrar pagos, anuncios) pero sin poder de
decisión estructural (no crea ciclos, no verifica pagos salvo que se le delegue); el superadmin
no tiene restricciones.
