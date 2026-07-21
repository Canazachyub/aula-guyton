# Bitácora del Frontend del Aula (Fase 3a)

Registro de la construcción del frontend del aula virtual, ejecutada según
`docs/GUIA_FRONTEND.md` paso a paso. Fecha de trabajo: **2026-07-20**.

---

## 1. Qué se construyó, paso por paso

| Paso | Qué se hizo | Commit |
|---|---|---|
| 1 — Limpieza y base visual | Se borró toda la basura del template de Vite (`App.css`, `index.css`, assets, `icons.svg`, favicon de Vite). Se creó `estilos/tokens.css` (solo variables: paleta y gradiente confirmados) y `estilos/global.css` (reset, tipografía base, utilidades y, luego, el sistema de componentes). Se cargaron las fuentes y se rehízo el favicon con el placeholder del isotipo. | `49fb8a9` |
| 2 — Datos mock | `datos/mock.js` como espejo exacto de las listas `SHEETS` de `docs/generar_excel.py`: las 12 colecciones con los ids `-demo-N` exactos y los nombres de campo literales del modelo. Se verificó por script que las 12 colecciones y sus ids coinciden. | `cb5cc3f` |
| 3 — Capa de datos | `api/cliente.js` con el contrato completo de la guía (sección 4): sesión, lecturas filtradas por rol, escrituras con rechazo explícito `{ ok: false, error }` y retardo artificial de 300 ms. Se verificó con un script de 40+ comprobaciones de permisos y casos límite. | `dabecc0` |
| 4 — Sesión y rutas | `auth/SesionContexto.jsx` (persiste en `sessionStorage`, clave `gy_sesion`, solo a través de `cliente.js`), `auth/RutaProtegida.jsx` (redirige a `/entrar` sin sesión y a `/panel` con rol ajeno) y las rutas por rol en `App.jsx`. | `69d2042` |
| 5 — Login | `paginas/Entrar.jsx`: DNI + clave de acceso, validación, errores en español ("DNI o clave incorrectos…", "Tu cuenta está inactiva…"), estado de carga, redirección a la ruta recordada y caja visible de entorno DEMO con las 5 credenciales. DNI siempre `String` con `trim()`. | `d826723` |
| 6 — Componentes y Layout | Todos los componentes de la guía: `Layout` (barra lateral que en celular se vuelve cajón con cortina), `Isotipo` (placeholder), `Tarjeta`, `Tabla` (scroll horizontal en móvil), `Insignia` (color por estado), `Boton`, `EstadoVacio`, `AvisoDemo` (banner permanente) y un set propio de iconos SVG. | `04a1d72` |
| 7 — Los cuatro paneles | Estudiante (`97b71be`), docente (`e3e8766`), auxiliar (`6af1b20`) y superadmin (`7fb851e`), cada uno con el menú y las capacidades de la sección 5 de la guía. | 4 commits |
| 8 — Verificación de casos límite | Los 8 casos de la guía comprobados uno por uno (detalle en la sección 4 de esta bitácora). **No requirió cambios de código: todo pasó a la primera** (los casos ya estaban cubiertos por las pruebas de la capa de datos del Paso 3). Sin commit: no hubo cambios. | — |
| 9 — Documentación | Esta bitácora + actualización del mapa de archivos del `README.md`. | (este commit) |

Tras cada paso se corrió `npm run build` y `npm run lint` desde `web/`: **ambos en
exit 0 en los 9 pasos** (ver "Warnings conocidos" en la sección 3).

---

## 2. Decisiones que tomé yo (lo que la guía dejó abierto) y por qué

- **Tipografías: Inter (UI) + Montserrat (títulos), peso 800.** La guía las da como
  propuestas no confirmadas y manda elegir esa combinación y marcarla provisional. Se
  cargan desde Google Fonts en `index.html`. PROVISIONAL hasta confirmación del usuario.
- **Placeholder del isotipo: bloque redondeado con el gradiente de marca, "G" blanca y
  borde discontinuo**, con `title="Isotipo provisional - el logo real está pendiente"` y
  `aria-label` equivalente. El borde discontinuo es la señal visual de "provisional".
  No se dibujó ningún ave (no sabemos cuál es; regla de honestidad).
- **Todo el CSS vive en dos archivos** (`tokens.css` + `global.css`) con clases de un
  solo sistema (`gy-*`). La guía prohíbe librerías de UI y pide CSS plano; un sistema de
  clases compartidas evita la dispersión de estilos inline. Los iconos son SVG propios
  (24×24, trazo) para no arrastrar una librería de iconos.
- **Escrituras del superadmin añadidas al contrato** (`guardarCiclo`, `guardarCurso`,
  `guardarAsignacion`, `guardarUsuario`): la sección 4 de la guía no las lista, pero la
  sección 5 exige que el superadmin cree ciclos/cursos y asigne docente (el "flujo
  estrella" de `ROLES_Y_FLUJOS.md`), así que el contrato se extendió lo mínimo necesario.
  `guardarUsuario` solo edita rol y estado, e impide que el superadmin se quite el rol o
  desactive su propia cuenta.
- **Lecturas añadidas al contrato** (también mínimas y documentadas aquí):
  `obtenerMatriculas` (el auxiliar necesita la lista de matrículas para registrar pagos;
  devuelve las propias al estudiante, todas a auxiliar/superadmin, vacío al docente),
  `obtenerRosterDeClase` (el "papel" para pasar lista: alumnos matriculados del ciclo de
  esa clase con su asistencia si ya existe), `obtenerConfig` y `obtenerCursosCatalogo`
  (solo superadmin).
- **`PasarLista` y los bloques `GestionPagos` / `GestionAsistencia` / `GestionAnuncios`
  viven en `componentes/` aunque hablan con la capa de datos.** La guía dice que
  `componentes/` no tiene lógica de negocio, pero también que un panel nunca importa de
  otro panel y que lo compartido vive en `componentes/`. Pagos/Asistencia/Anuncios son
  literalmente la misma vista para auxiliar y superadmin, y PasarLista la usan tres
  roles: la alternativa era duplicar cuatro vistas. Cada archivo lleva la nota de la
  excepción en su cabecera.
- **Los ids nuevos creados desde la UI siguen el patrón DEMO** (`pag-demo-4`, etc.):
  todo lo que existe en este entorno es de ejemplo y debe ser reconocible como tal.
  Correlativos, nunca reutilizados (regla 7 del modelo).
- **`verificarPago` tiene efecto secundario intencional**: al verificar un pago de
  concepto `matricula` sobre una matrícula `preinscrito`, esta pasa a `matriculado`
  (es el paso 3 del flujo del estudiante en `ROLES_Y_FLUJOS.md`).
- **`registrarAsistencia` hace upsert** (si ya existe fila para esa clase+alumno, la
  corrige en vez de duplicar) y acepta la lista completa de una vez
  (`{ id_clase, registros: [...] }`), porque pasar lista es una sola acción.
- **Config en solo lectura.** La matriz dice que el superadmin edita `config`, pero la
  sección 4 no incluye escritura de config; se dejó vista de solo lectura con nota en la
  propia UI. Pendiente real, listado en la sección 3.
- **El `AvisoDemo` no se puede ocultar** a propósito: la regla de honestidad manda que la
  interfaz diga siempre que corre con datos de ejemplo; el banner además documenta que
  las escrituras se pierden al recargar (lo pide la sección 4 de la guía).
- **Skills `dataviz` y `artifact-design`: no existen en este entorno.** Se intentó
  invocarlas (la guía sección 5-bis las pedía) y la herramienta de skills respondió que
  no están en el listado disponible (solo hay skills internas del CLI). Se aplicó
  manualmente lo que la guía resume de ellas: una sola familia de colores de marca en
  KPIs y barras (azules como serie, naranja solo acento), jerarquía número-grande +
  rótulo, y el layout calibrado con la dirección "academia moderna + estética
  competitiva". No se usó ninguna paleta de ejemplo. `codex-imagenes` tampoco se usó
  (correctamente: el ave no está confirmada).

---

## 3. Lo que quedó pendiente o provisional (sin maquillar)

- **Delegación de verificación de pagos del auxiliar: NO modelada.** La matriz dice
  "solo si superadmin delega" pero no existe campo para esa delegación. Decisión
  provisional (manda la guía, sección 5): la verificación está **habilitada** para el
  auxiliar, con comentario `PENDIENTE` en `api/cliente.js` (`verificarPago`). Cuando el
  usuario decida cómo se modela la delegación, hay que tocar esa función y la vista de
  Pagos del auxiliar.
- **Isotipo placeholder.** El logo real (ave naranja + "G") no existe como archivo y no
  se sabe qué ave es. Todo lo que muestra la app (favicon, login, barra lateral) es el
  bloque "G" + gradiente, marcado como provisional en pantalla. Reemplazar
  `componentes/Isotipo.jsx` y `public/favicon.svg` cuando llegue el vectorial.
- **Tipografías sin confirmar** (Inter + Montserrat elegidas como punto de partida).
- **Las escrituras se pierden al recargar.** El mock vive en memoria; no hay backend ni
  persistencia. El banner DEMO lo dice en toda la app.
- **Edición de `config` sin UI** (solo lectura). El contrato tampoco tiene escritura de
  config; definir endpoint en la Fase 2 si se quiere editable.
- **El superadmin no tiene UI de Clases ni de Materiales** (su menú, según la guía, no
  las incluye). La capa de datos sí le permite esas operaciones; si se quiere UI, son
  vistas nuevas que reutilicen los bloques del docente.
- **Warning de linter conocido y aceptado** (exit 0): `react/only-export-components`
  sobre `useSesion` en `auth/SesionContexto.jsx`. La guía manda hook y proveedor en el
  mismo archivo; no se desactivó la regla.
- **`/simplify` no se corrió**: no existe como comando/skill en este entorno. En su
  lugar se hizo una revisión manual de duplicación, de la que salieron los bloques
  compartidos `Gestion*` (ver sección 2).
- **Sin pruebas de navegador automatizadas** (no se instaló ninguna librería de test;
  la guía prohíbe instalar sin preguntar). La verificación fue: script contra la capa de
  datos (60+ aserciones), revisión de código de las vistas y smoke test del build con
  `vite preview` (HTTP 200). El recorrido manual final con las 5 cuentas queda para el
  usuario — los flujos están listos para eso.

---

## 4. Verificación de los 8 casos límite (Paso 8)

Script temporal ejecutado contra `api/cliente.js` (donde vive el filtrado por rol) más
revisión de código de las vistas. Resultado: **8/8 en verde**.

1. ✅ El estudiante **no** ve `mtl-demo-3` (borrador): no aparece en ningún listado suyo
   ni del auxiliar; el docente y el superadmin sí lo ven.
2. ✅ La resolución `mtl-demo-2` llega agrupada bajo su práctica `mtl-demo-1`
   (`resoluciones` dentro de la fila raíz, nunca suelta).
3. ✅ El docente **no** ve `cco-demo-3` (sin docente): ni en su lista de cursos, ni
   leyendo materiales/clases/horario de ese id, ni escribiendo en él.
4. ✅ El docente **no** tiene acceso a pagos por ninguna vía: `obtenerPagos` y
   `obtenerMatriculas` devuelven vacío, `registrarPago` y `verificarPago` rechazan, y en
   `paneles/docente/` no existe ninguna referencia a pagos (ni menú ni rutas).
5. ✅ El estudiante solo ve sus propios pagos (Luis: sus 2; Maria: solo el suyo
   rechazado) y sus propias asistencias.
6. ✅ Maria (`usr-demo-5`, retirada) inicia sesión (cuenta activa) pero no ve ciclos,
   cursos, horario, clases ni materiales del ciclo, y no puede reportar pagos desde su
   matrícula retirada. Su Inicio muestra el estado vacío "No tienes una matrícula activa".
7. ✅ El anuncio global (`anu-demo-1`) lo ven todos (incluida Maria, que no tiene ciclo);
   el de `cic-demo-1` (`anu-demo-2`) solo quienes alcanzan ese ciclo.
8. ✅ Todas las tablas tienen estado vacío: `Tabla` cae por defecto en `EstadoVacio` y
   las 17 vistas de paneles tienen su rama de vacío (verificado con búsqueda de
   `EstadoVacio|vacio=` en `src/paneles`).

---

## 5. Mapa de archivos final

```
web/
├── index.html                     lang="es", fuentes, favicon placeholder
├── public/
│   └── favicon.svg                "G" sobre gradiente (PROVISIONAL)
└── src/
    ├── main.jsx                   punto de entrada + BrowserRouter
    ├── App.jsx                    rutas y guardas por rol
    ├── estilos/
    │   ├── tokens.css             SOLO variables (paleta, gradiente, tipos, estados)
    │   └── global.css             reset, base y sistema de clases gy-*
    ├── datos/
    │   └── mock.js                espejo EXACTO del Excel DEMO (no tocar desde UI)
    ├── api/
    │   └── cliente.js             ÚNICA capa de datos (filtrado por rol, 300 ms)
    ├── auth/
    │   ├── SesionContexto.jsx     contexto de sesión + useSesion() (gy_sesion)
    │   └── RutaProtegida.jsx      redirige a /entrar o a /panel según sesión/rol
    ├── paginas/
    │   └── Entrar.jsx             login DNI + clave
    ├── componentes/
    │   ├── Layout.jsx             barra lateral / cajón móvil + cabecera + AvisoDemo
    │   ├── Isotipo.jsx            placeholder del logo (PROVISIONAL)
    │   ├── Tarjeta.jsx  Tabla.jsx  Insignia.jsx  Boton.jsx
    │   ├── EstadoVacio.jsx        vacíos de listas y tablas
    │   ├── AvisoDemo.jsx          banner permanente de entorno DEMO
    │   ├── Cargando.jsx           indicador de carga
    │   ├── Icono.jsx              iconos SVG propios
    │   ├── formatos.js            soles, fechas, días, conceptos, tipos (presentación)
    │   ├── useDatos.js            hook de carga { datos, cargando, error, recargar }
    │   ├── FormularioPago.jsx     reportar pago (estudiante/auxiliar/superadmin)
    │   ├── FormularioAnuncio.jsx  publicar anuncio (auxiliar/superadmin)
    │   ├── PasarLista.jsx         pasar lista (docente/auxiliar/superadmin) *
    │   ├── GestionPagos.jsx       tabla + verificar/rechazar + registrar *
    │   ├── GestionAsistencia.jsx  PasarLista + historial *
    │   └── GestionAnuncios.jsx    formulario + listado (global opcional) *
    │                              (* con lógica de datos: excepción documentada, sec. 2)
    └── paneles/
        ├── estudiante/  PanelEstudiante + Inicio, Horario, Cursos, Materiales,
        │                Asistencia, Pagos, Anuncios
        ├── docente/     PanelDocente + Inicio, Cursos, Clases, Materiales, Asistencia
        ├── auxiliar/    PanelAuxiliar + Inicio, Asistencia, Pagos, Anuncios
        └── superadmin/  PanelSuperadmin + Inicio, Ciclos, Cursos, Asignaciones,
                         Usuarios, Pagos, Asistencia, Anuncios, Config
```

---

## 6. Cómo levantar el proyecto y credenciales DEMO

```bash
cd "C:\PROGRAMACION\ACADEMIA GUYTON\web"
npm install        # solo la primera vez (node_modules ya existe si no lo borraste)
npm run dev        # desarrollo (Vite, normalmente http://localhost:5173)
```

Otros comandos: `npm run build` (build de producción en `dist/`),
`npm run preview` (sirve el build), `npm run lint` (oxlint).

**Credenciales DEMO** (todas las cuentas son de ejemplo; la propia pantalla de acceso
las muestra y permite autocompletar con un clic):

| Rol | Nombre | DNI | Clave | Qué deberías ver |
|---|---|---|---|---|
| Superadmin | Ana Quispe Mamani | `70000001` | `1111` | Todo: ciclos, cursos, asignaciones, usuarios, pagos, asistencia, anuncios, config |
| Docente | Carlos Huanca Ticona | `70000002` | `2222` | Solo sus 2 cursos de 2026-II; sin pagos. Su borrador `mtl-demo-3` sí le aparece |
| Auxiliar | Rosa Flores Apaza | `70000003` | `3333` | Asistencia de todo, todos los pagos (puede verificar — provisional), anuncios por ciclo |
| Estudiante | Luis Condori Yucra | `70000004` | `4444` | Solo su ciclo: horario, materiales publicados (la grabación en borrador NO), sus pagos y su asistencia |
| Estudiante retirada | Maria Chura Pacco | `70000005` | `5555` | Entra, pero sin contenido del ciclo (matrícula retirada); solo el anuncio global y su pago rechazado |

Flujos de prueba sugeridos (todos completables solo con la interfaz):

- **Estudiante**: entrar con Luis → ver horario → Materiales (práctica + resolución
  agrupada; sin borradores) → Pagos → reportar una mensualidad (queda pendiente).
- **Docente**: entrar con Carlos → Clases → marcar `cls-demo-3` como dictada →
  Materiales → publicar el borrador `mtl-demo-3` → (salir y entrar como Luis: ahora sí
  aparece) → Asistencia → pasar lista.
- **Auxiliar**: entrar con Rosa → Pagos → verificar el pago pendiente de Luis →
  Asistencia → pasar lista → Anuncios → publicar uno para 2026-II.
- **Superadmin (flujo estrella)**: entrar con Ana → Asignaciones → asignar a Carlos en
  `cco-demo-3` (2027-I) → entrar como Carlos: el curso nuevo ya le aparece → Ciclos →
  cambiar 2027-I a "inscripciones abiertas".

---

## 7. Qué hay que cambiar cuando exista el backend real

**Solo `src/api/cliente.js`.** Ningún componente importa el mock ni tiene datos
embebidos: el día que el Web App de Apps Script exista, las firmas y las formas de
respuesta se mantienen y solo cambia la implementación interna de cada función, de
"leer/mutar `db`" a `fetch`. Sesión: hoy `sessionStorage` guarda el usuario; con
backend se guardará el token que devuelva el login (mismo sitio, misma clave
`gy_sesion` o similar) y se enviará en cada petición.

Mapeo propuesto función → endpoint del Web App (`/exec`), a aterrizar en la Fase 2:

| Función actual | Método y ruta sugerida |
|---|---|
| `iniciarSesion(dni, clave)` | `POST /exec` `{ accion: 'login', dni, clave }` → `{ ok, token, usuario }` |
| `cerrarSesion()` / `obtenerSesion()` | Local (borrar/leer token). Opcional: `POST { accion: 'logout' }` si el backend invalida tokens |
| `obtenerCiclosDelUsuario` | `GET /exec?accion=ciclos` (+ token) |
| `obtenerCursosDelUsuario` | `GET /exec?accion=ciclo_cursos` |
| `obtenerHorario(idCicloCurso)` | `GET /exec?accion=horario&id=…` |
| `obtenerClases(idCicloCurso)` | `GET /exec?accion=clases&id=…` |
| `obtenerMateriales(idCicloCurso)` | `GET /exec?accion=materiales&id=…` (el agrupado de resoluciones puede quedarse en el cliente o moverse al servidor; la forma de respuesta ya está definida) |
| `obtenerPagos` | `GET /exec?accion=pagos` |
| `obtenerMatriculas` | `GET /exec?accion=matriculas` |
| `obtenerAsistencias(filtros)` | `GET /exec?accion=asistencias&idClase=…` |
| `obtenerRosterDeClase(idClase)` | `GET /exec?accion=roster&idClase=…` |
| `obtenerAnuncios` | `GET /exec?accion=anuncios` |
| `obtenerUsuarios` / `obtenerConfig` / `obtenerCursosCatalogo` | `GET /exec?accion=usuarios|config|cursos` (superadmin) |
| `registrarPago` | `POST /exec` `{ accion: 'registrar_pago', … }` |
| `verificarPago(idPago, decision)` | `POST /exec` `{ accion: 'verificar_pago', id_pago, decision }` |
| `guardarClase` / `guardarMaterial` | `POST /exec` `{ accion: 'guardar_clase'|'guardar_material', … }` (con y sin id = editar/crear) |
| `registrarAsistencia` | `POST /exec` `{ accion: 'registrar_asistencia', id_clase, registros }` |
| `publicarAnuncio` | `POST /exec` `{ accion: 'publicar_anuncio', … }` |
| `guardarCiclo` / `guardarCurso` / `guardarAsignacion` / `guardarUsuario` | `POST /exec` `{ accion: 'guardar_ciclo'|'guardar_curso'|'guardar_asignacion'|'guardar_usuario', … }` (superadmin) |

Puntos a no perder de vista en la migración:

- **El filtrado por rol debe vivir en el servidor** (como hoy vive en `cliente.js`);
  la UI nunca debe recibir datos que luego "oculta".
- **Las reglas de integridad ya están codificadas aquí** y son trasladables tal cual al
  `.gs`: resolución → práctica del mismo `id_ciclo_curso`; concepto de pago dentro de
  `n_mensualidades`; FKs existentes; ids correlativos sin reutilización; matrícula que
  pasa a `matriculado` al verificar su pago de matrícula.
- **El retardo de 300 ms se elimina** (existía para ejercitar los estados de carga).
- **Resolver la delegación del auxiliar** antes de exponer `verificar_pago` en
  producción (ver sección 3).
- **Los nombres de campo ya son los del Sheet** (`id_ciclo_curso`, `clave_acceso`,
  `fecha_publicacion`…): las respuestas del backend pueden serializar las filas tal
  cual y la UI las consume sin cambios.

---

## 8. Rediseño visual (misma fecha, segunda iteración)

El usuario pidió una interfaz "menos simple": navegación más agradable, cajas tipo
**bento**, responsive de verdad y fuera el look genérico. Se rehízo la capa visual
completa sin tocar datos ni lógica:

- **Sistema**: `global.css` reescrito — retícula bento de 12 columnas
  (`gy-bento` + `gy-bs-3/4/6/8`), tarjetas con borde fino y sombra en capas, cuadros
  de ícono con tintes de la familia de marca, nav lateral tipo *pill* (item activo
  blanco con ícono naranja), cabecera pegajosa con desenfoque y chip de fecha,
  botones con micro-interacción (elevación + sombra de color), inputs con anillo de
  foco suave, insignias con punto de color, banner DEMO más delgado (sigue sin
  poder ocultarse).
- **Tablas responsive de verdad**: por debajo de 720 px cada fila se convierte en
  tarjeta apilada con sus etiquetas (vía `data-etiqueta`), en vez de scroll
  horizontal. Cero cambios de markup: lo aplica el CSS a todas las tablas.
- **Componentes nuevos**: `Heroe` (banda con el gradiente de marca y arte
  **geométrico** — círculos y cuadrados, nunca un ave inventada) y `Kpi`
  (cuadro de ícono + número grande + rótulo + pie). Los cuatro Inicio se
  rearmaron en bento alrededor de ellos; el EstadoVacio también lleva arte
  geométrico de marca.
- **Login split**: panel de marca (gradiente + isotipo placeholder + nota honesta
  de entorno DEMO) junto al panel de formulario; en celular se apila.
- **Skills aplicadas** (descargadas por el usuario a `docs/SKILLS/` y extraídas a
  `.agents/skills/`, que es el directorio que este CLI escanea):
  `design-system-builder` (checklist de sistema completo: colores, tipografía,
  componentes, espaciado, estados, movimiento — su paso de Tailwind/lucide se
  omitió porque la guía prohíbe librerías de UI), `data-viz-renderer` (su patrón
  de stat-card/dashboard valida el diseño de `Kpi` e Inicio del superadmin; su
  script genera HTML suelto, que no encaja en una app React con datos vivos, así
  que no se usó para la app), `browse` (verificación visual con capturas).
  `theme-factory` no aplica: la paleta Guyton ya está confirmada y un tema preset
  la violaría. Para invocación automática de las skills hace falta `/reload` o
  una sesión nueva; aquí se leyeron y aplicaron directamente.
- **Lo que NO cambió**: paleta, gradiente, tipografías provisionales, placeholder
  del isotipo, banner DEMO, ni una sola línea de la capa de datos ni de los
  flujos por rol.
