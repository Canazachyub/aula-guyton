# Plan Maestro — Aula Virtual Academia Guyton

Este documento define las fases del proyecto, qué marca el cierre de cada una, y por qué se
tomaron ciertas decisiones estructurales en el modelo de datos. Es el mapa de ruta: no se pasa
a la fase siguiente sin cerrar la anterior.

## Fase 0 — Diseño (ESTAMOS AQUÍ)

Diseñar, sin escribir código de producto, el modelo de datos completo, los flujos de uso por
rol y la identidad visual, de forma que las fases siguientes sean ejecución sobre un plano ya
pensado, no improvisación.

**Entregables de esta fase:** `MODELO_DATOS.md`, `ROLES_Y_FLUJOS.md`, `IDENTIDAD_VISUAL.md`,
`BASE_DATOS_GUYTON.xlsx` (con datos DEMO) y este plan.

**Criterio de cierre:** el usuario (dueño de la academia o quien decida por él) revisa
`MODELO_DATOS.md` y `ROLES_Y_FLUJOS.md` y confirma que reflejan cómo trabaja realmente la
academia — turnos, formas de pago, modalidad de clases, etc. Cualquier corrección se hace
aquí, en el papel, no después de que existan datos reales en un Sheet.

## Fase 1 — Infraestructura

Convertir el diseño en la infraestructura real de Google que va a sostener todo lo demás.

**Qué hace el usuario:**
- Sube `BASE_DATOS_GUYTON.xlsx` a Google Sheets (Archivo → Guardar como Google Sheets, o
  arrastrarlo a Drive y abrirlo con Sheets). Puede borrar las filas DEMO o dejarlas como
  referencia temporal — pero antes de operar con alumnos reales, deben salir.
- Crea la carpeta raíz de Google Drive y, dentro, las subcarpetas por ciclo/curso según la
  convención de `MODELO_DATOS.md`.
- Comparte ambos links (Sheet y carpeta raíz) para completar `config.drive_root_id` y conectar
  todo con el backend de la Fase 2.
- Da permisos de edición al/los correos que ejecutarán el Apps Script.

**Criterio de cierre:** el Sheet existe con las 12 hojas y sus headers intactos, la carpeta
Drive existe con al menos un ciclo de prueba, y `config.drive_root_id` tiene un valor real.

## Fase 2 — Backend (Google Apps Script)

Construir la API por roles sobre el modelo de datos ya validado: autenticación simple por
`dni` + `clave_acceso` contra la hoja `usuarios`, sesión (token o similar), y endpoints que
respeten la matriz de permisos de `ROLES_Y_FLUJOS.md` (un docente no puede leer alumnos de
ciclos que no dicta; un estudiante no puede ver pagos de otro estudiante; etc.).

**Criterio de cierre:** cada endpoint tiene su prueba manual documentada (login por rol, CRUD
de las operaciones permitidas, rechazo explícito de las no permitidas), y el Apps Script queda
publicado como Web App con el acceso configurado.

## Fase 3 — Frontend

Dos superficies distintas, ambas sobre la identidad visual de `IDENTIDAD_VISUAL.md`:

- **Landing promocional** — pública, orientada a captar postulantes nuevos (lema "Asegura tu
  ingreso", información de ciclos abiertos, contacto por WhatsApp).
- **Aula** — privada, detrás de login, con la vista que corresponde a cada rol (estudiante ve
  su horario/clases/materiales/asistencia/pagos; docente sus ciclo_cursos; auxiliar sus
  herramientas de soporte; superadmin todo).

**Criterio de cierre:** un usuario de cada rol puede completar su flujo típico descrito en
`ROLES_Y_FLUJOS.md` de punta a punta usando solo la interfaz, sin tocar el Sheet a mano.

## Fase 4 — Piloto con un ciclo real

Operar un ciclo real completo (matrícula, pagos, clases, materiales, asistencia) con alumnos
reales de la academia, en paralelo o reemplazando el método actual, y recoger fricciones antes
de declarar el sistema listo para todos los ciclos.

**Criterio de cierre:** el ciclo piloto llega a su fin con datos limpios (sin la necesidad de
correcciones manuales masivas en el Sheet) y el usuario decide seguir con el sistema para el
siguiente ciclo.

---

## Decisiones tomadas en el modelo — y por qué

**Tabla puente `ciclo_cursos` (en vez de que `cursos` referencie directamente a un ciclo).**
Los cursos son un catálogo global (Matemática, Comunicación, etc.) que se repite ciclo tras
ciclo; lo que cambia por ciclo es *quién* lo dicta y *si* se dicta. Sin la tabla puente,
tendríamos que duplicar el curso completo cada ciclo solo para cambiar de docente. Con ella,
abrir un ciclo nuevo es agregar filas en `ciclo_cursos`, no reinventar el catálogo. Esta es la
pieza que hace que el sistema escale a **N ciclos simultáneos** sin tocar código ni duplicar
información.

**`horario` (plantilla semanal) separado de `clases` (sesiones fechadas).**
Son conceptos distintos aunque se parezcan: `horario` dice "los lunes de 18:00 a 20:00 hay
Matemática", como patrón recurrente. `clases` son las instancias reales — la del lunes 13 de
julio, la del lunes 20 — cada una con su propio estado (`programada`/`dictada`/`cancelada`), su
tema del día, y son el punto donde se cuelgan `materiales` y `asistencias`. Si se fusionaran,
cancelar una sola sesión o cambiarle el tema rompería el patrón general, y grabaciones/asistencia
no tendrían dónde anclarse sin fecha propia.

**`materiales.id_material_padre` (una resolución apunta a su práctica).**
En vez de duplicar título, semana y curso en cada material relacionado, una fila de tipo
`pdf_resolucion` simplemente apunta con `id_material_padre` a la fila de la `pdf_practica` que
resuelve. La plataforma los muestra juntos sin que nadie tenga que mantener dos copias de los
mismos metadatos sincronizadas a mano.

**`pagos` referencia `id_matricula`, no `dni` + `ciclo` repetidos.**
La matrícula ya sabe quién es el alumno y en qué ciclo está inscrito; repetir esos dos datos en
cada fila de `pagos` sería la redundancia exacta que la regla "cero redundancia" prohíbe, y
abriría la puerta a inconsistencias (un pago con un dni que no coincide con su ciclo).

**Un usuario, un rol.**
El padrón `usuarios` es único para todas las personas (evita duplicar a alguien que es alumno y
después docente en registros separados), pero cada fila tiene un solo `rol`. Si en la práctica
alguien cumple dos funciones (p. ej. un docente que también hace de auxiliar), el modelo pide
decidir el de mayor privilegio en esa fila — no crear un segundo usuario para la misma persona,
ni una columna de roles múltiples que complicaría la matriz de permisos sin necesidad real hoy.

**Patrón "fila pública" en `materiales`.**
Subir un archivo a Drive no lo publica: solo la fila en `materiales` con `estado: publicado` y
su `url_drive` completa hace que aparezca en la plataforma. Esto separa "el archivo existe" de
"el archivo es visible para los alumnos", que es exactamente el control que un docente necesita
para preparar contenido con anticipación sin exponerlo antes de tiempo.
