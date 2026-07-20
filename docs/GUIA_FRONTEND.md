# Guía de ejecución — Frontend del Aula (Fase 3a)

Este documento es la especificación completa para construir el **aula virtual** (la parte privada,
detrás de login) de la Academia Preuniversitaria Guyton. Está escrito para que otra persona o IA
lo ejecute paso a paso sin haber participado en el diseño previo.

**Antes de escribir una sola línea de código, lee completos:** `README.md`,
`docs/PLAN_MAESTRO.md`, `docs/MODELO_DATOS.md`, `docs/ROLES_Y_FLUJOS.md` y
`docs/IDENTIDAD_VISUAL.md`. Este documento no los reemplaza: los aterriza a código.

---

## 0. Estado real al momento de escribir esto

Lo que **ya existe** en `web/` (no hay que rehacerlo):

- Proyecto Vite + React ya scaffoldeado e instalado (`npm install` ya corrió, `node_modules` existe).
- Versiones reales: **Vite 8**, **React 19**, **react-router-dom 7**, y **oxlint** como linter
  (no ESLint — `npm run lint` ejecuta `oxlint`, y la config vive en `web/.oxlintrc.json`).
- El repositorio git ya está inicializado en `C:\PROGRAMACION\ACADEMIA GUYTON`, rama `main`,
  **sin ningún commit todavía**.

Lo que existe pero es **basura del template** y debe borrarse o reemplazarse en el Paso 1:
`src/App.css`, `src/index.css`, `src/assets/react.svg`, `src/assets/vite.svg`,
`src/assets/hero.png`, `public/favicon.svg`, `public/icons.svg` y el contenido de `src/App.jsx`.
El favicon habrá que rehacerlo con el placeholder del isotipo (la "G" sobre el gradiente),
porque el actual es el de Vite.

Lo que **no existe todavía**: absolutamente todo el código del aula.

## Decisiones ya tomadas (no las cambies sin consultar al usuario)

1. **React + Vite**, elegido por el usuario.
2. **El aula primero**, la landing pública después (será otra fase, no la hagas aquí).
3. **Toda lectura/escritura de datos pasa por `src/api/cliente.js`.** Ningún componente puede
   tener datos embebidos ni importar el mock directamente. Hoy ese archivo devuelve datos
   simulados; en la Fase 2 se cambiará por `fetch` al backend de Google Apps Script. Si respetas
   esto, migrar al backend real es editar un archivo; si no lo respetas, son veinte.

## Reglas innegociables

- **Honestidad:** nada sin confirmar se presenta como hecho. El isotipo no existe (no sabemos
  siquiera qué ave es) → usa un placeholder que **diga en pantalla** que es provisional. No
  inventes beneficios de la academia, precios, nombres de docentes ni cifras.
- **Todos los datos son DEMO.** El aula debe mostrar un aviso visible de que corre con datos de
  ejemplo mientras no exista backend.
- **DNI siempre `String` con `.trim()`.** Nunca `parseInt` — un DNI puede empezar con 0 y se
  perdería.
- **Español peruano natural** en todo el texto visible. Nada de "Ingrese su credencial de
  acceso"; sí "Ingresa tu DNI". Sin tuteo español ("vosotros"), sin mexicanismos.
- **Los ids llevan los prefijos del modelo** (`usr`, `cic`, `cur`, `cco`, `mat` matrículas,
  `mtl` materiales, `pag`, `hor`, `cls`, `asi`, `anu`). Ojo: `mat` y `mtl` son distintos a
  propósito.
- **Los campos se leen por su nombre exacto** del modelo de datos (`id_ciclo_curso`,
  `clave_acceso`, `fecha_publicacion`…). No los traduzcas ni los pases a camelCase: el backend
  de la Fase 2 los va a devolver tal cual.
- **No toques `C:\PROGRAMACION\SIMULAUNA`** — es otro proyecto, sin relación con este.
- **No modifiques** `BASE_DATOS_GUYTON.xlsx`, `docs/generar_excel.py` ni los cinco `.md` de
  diseño (salvo lo que este documento te pide agregar en el Paso 9).

---

## 1. Identidad visual (confirmada por el usuario)

```css
:root {
  --gy-azul-noche: #050B2B;
  --gy-azul-real: #0829B8;
  --gy-azul-electrico: #145CFF;
  --gy-naranja: #FF4A18;
  --gy-blanco: #FFFFFF;
  --gy-superficie: #EDF2F7;
  --gy-gris: #64748B;

  --gy-gradiente: linear-gradient(135deg, var(--gy-azul-noche), var(--gy-azul-real), var(--gy-azul-electrico));
}
```

- **Lema:** "Asegura tu ingreso" (no lo uses dentro del aula; es de la landing).
- **Tipografías:** Montserrat ExtraBold o Anton para títulos, Inter o Poppins para UI. Están
  **propuestas, no confirmadas**. Elige Inter para UI y Montserrat para títulos, y déjalo
  anotado como provisional en tu documentación.
- **Dirección:** "academia moderna + estética competitiva" — azules profundos, naranja solo
  como acento y llamadas a la acción. Serio pero con energía, más cerca de una marca deportiva
  que de un colegio.
- **Isotipo:** ave naranja con la letra "G", **sin confirmar qué ave** y **sin archivo
  vectorial**. Usa un placeholder: un círculo o cuadrado con el gradiente de marca y una "G"
  blanca. Añade `title="Isotipo provisional - el logo real está pendiente"` y menciónalo en tu
  documentación. **No dibujes un ave inventada.** No le impongas simbología andina ni la
  conviertas en vicuña: es una decisión explícita del usuario.

---

## 2. Arquitectura de archivos a construir

```
web/src/
├── main.jsx                      punto de entrada + BrowserRouter
├── App.jsx                       rutas y guardas por rol
│
├── estilos/
│   ├── tokens.css                variables CSS de arriba (SOLO variables)
│   └── global.css                reset, tipografía base, utilidades
│
├── datos/
│   └── mock.js                   espejo EXACTO del Excel DEMO (ver sección 3)
│
├── api/
│   └── cliente.js                ÚNICA capa de datos (ver sección 4)
│
├── auth/
│   ├── SesionContexto.jsx        contexto de sesión + hook useSesion()
│   └── RutaProtegida.jsx         redirige a /entrar si no hay sesión o el rol no aplica
│
├── componentes/                  reutilizables, sin lógica de negocio
│   ├── Layout.jsx                cabecera + navegación lateral + área de contenido
│   ├── Isotipo.jsx               placeholder del logo
│   ├── Tarjeta.jsx
│   ├── Tabla.jsx
│   ├── Insignia.jsx              chip de estado con color por valor
│   ├── Boton.jsx
│   ├── EstadoVacio.jsx           "Todavía no hay materiales publicados", etc.
│   └── AvisoDemo.jsx             banner "datos de ejemplo, sin backend"
│
├── paginas/
│   └── Entrar.jsx                login con DNI + clave de acceso
│
└── paneles/
    ├── estudiante/               PanelEstudiante.jsx + sus vistas
    ├── docente/                  PanelDocente.jsx + sus vistas
    ├── auxiliar/                 PanelAuxiliar.jsx + sus vistas
    └── superadmin/               PanelSuperadmin.jsx + sus vistas
```

**Regla de ámbito:** cada carpeta de `paneles/` es independiente. Un panel nunca importa nada de
otro panel. Lo compartido vive en `componentes/`.

---

## 3. Datos mock — deben ser espejo exacto del Excel DEMO

La fuente de verdad es `docs/generar_excel.py` (las listas `SHEETS`). **Cópialos de ahí, no los
inventes ni los "mejores".** Resumen de lo que hay:

| Hoja | Filas DEMO |
|---|---|
| `config` | nombre_academia, whatsapp (+51 986 833 308), drive_root_id (vacío), color_primario, color_acento, lema |
| `usuarios` | `usr-demo-1` Ana Quispe Mamani (superadmin, dni 70000001, clave 1111) · `usr-demo-2` Carlos Huanca Ticona (docente, 70000002, 2222) · `usr-demo-3` Rosa Flores Apaza (auxiliar, 70000003, 3333) · `usr-demo-4` Luis Condori Yucra (estudiante, 70000004, 4444) · `usr-demo-5` Maria Chura Pacco (estudiante, 70000005, 5555) |
| `ciclos` | `cic-demo-1` 2026-II (en_curso) · `cic-demo-2` 2027-I (planificado) |
| `cursos` | `cur-demo-1` Matematica · `cur-demo-2` Comunicacion |
| `ciclo_cursos` | `cco-demo-1` (cic-1+cur-1, docente usr-demo-2) · `cco-demo-2` (cic-1+cur-2, docente usr-demo-2) · `cco-demo-3` (cic-2+cur-1, **sin docente**) |
| `matriculas` | `mat-demo-1` Luis en cic-demo-1 (matriculado) · `mat-demo-2` Maria en cic-demo-1 (retirado) |
| `pagos` | `pag-demo-1` matrícula S/100 verificado · `pag-demo-2` mensualidad_1 S/250 **pendiente** · `pag-demo-3` matrícula S/100 **rechazado** (de Maria) |
| `horario` | `hor-demo-1` lunes 18:00-20:00 (cco-1) · `hor-demo-2` miercoles 18:00-20:00 (cco-2) |
| `clases` | `cls-demo-1` 2026-07-13 dictada · `cls-demo-2` 2026-07-15 dictada · `cls-demo-3` 2026-07-20 **programada, presencial** |
| `materiales` | `mtl-demo-1` pdf_practica **publicado** · `mtl-demo-2` pdf_resolucion publicado con `id_material_padre = mtl-demo-1` · `mtl-demo-3` video_grabado en **borrador** |
| `asistencias` | `asi-demo-1` Luis presente · `asi-demo-2` Luis tardanza |
| `anuncios` | `anu-demo-1` global (id_ciclo vacío), **fijado** · `anu-demo-2` de cic-demo-1 |

Estas filas están elegidas a propósito para ejercitar los casos límite: un material en borrador
que el alumno **no** debe ver, un pago rechazado, una matrícula retirada, un `ciclo_curso` sin
docente, un anuncio global vs. uno por ciclo, y una clase presencial que se sale del patrón del
horario. **Tu UI debe manejar los tres estados de cada uno correctamente.**

---

## 4. Contrato de `src/api/cliente.js`

Todas las funciones son `async` y devuelven promesas (aunque hoy resuelvan de inmediato con el
mock) — así el día que sean `fetch` reales no cambia ni una firma. Añade un retardo artificial de
~300 ms para que los estados de carga de la UI sean reales y no decorativos.

```js
// Sesión
iniciarSesion(dni, clave)        // -> { ok: true, usuario } | { ok: false, error: 'mensaje en español' }
cerrarSesion()
obtenerSesion()                  // -> usuario | null   (leído de sessionStorage)

// Lecturas (SIEMPRE reciben la sesión y filtran según el rol — ver sección 5)
obtenerCiclosDelUsuario(sesion)
obtenerCursosDelUsuario(sesion)          // ciclo_cursos ya resueltos con nombre de curso y docente
obtenerHorario(sesion, idCicloCurso)
obtenerClases(sesion, idCicloCurso)
obtenerMateriales(sesion, idCicloCurso)  // agrupa resoluciones bajo su práctica vía id_material_padre
obtenerPagos(sesion)
obtenerAsistencias(sesion, filtros)
obtenerAnuncios(sesion)
obtenerUsuarios(sesion)                  // solo superadmin

// Escrituras (mutan el mock en memoria; el cambio se pierde al recargar — DOCUMENTA esto en la UI)
registrarPago(sesion, datos)
verificarPago(sesion, idPago, decision)  // 'verificado' | 'rechazado'
guardarClase(sesion, datos)
guardarMaterial(sesion, datos)
registrarAsistencia(sesion, datos)
publicarAnuncio(sesion, datos)
```

**El filtrado por rol vive aquí, en la capa de datos — no en los componentes.** Es lo que hará el
backend real, así que simularlo en el mismo lugar mantiene la equivalencia. Si un componente
recibe datos que no le corresponden y los oculta con CSS, está mal hecho.

Cada función de escritura debe **rechazar explícitamente** lo no permitido devolviendo
`{ ok: false, error: '...' }`, nunca lanzando una excepción silenciosa.

---

## 5. Qué ve cada rol (traducción de la matriz de permisos a UI)

Fuente: `docs/ROLES_Y_FLUJOS.md`. La regla base que resume todo: **el estudiante está limitado a
su ciclo** (vía su matrícula), **el docente a sus `ciclo_cursos`** (vía `id_docente`), **el
auxiliar es soporte transversal** sin poder estructural, **el superadmin no tiene restricciones**.

### Estudiante (`usr-demo-4` / DNI 70000004 / clave 4444)
Menú: Inicio · Mi horario · Mis cursos · Materiales · Asistencia · Pagos · Anuncios.
- Solo datos de los ciclos donde tenga matrícula con estado `matriculado`.
- **Materiales: únicamente `estado = publicado`.** `mtl-demo-3` está en borrador y **no debe
  aparecerle jamás** — es el caso de prueba del patrón "fila pública".
- La resolución (`mtl-demo-2`) se muestra agrupada bajo su práctica (`mtl-demo-1`), no suelta.
- Pagos: solo los suyos. Puede reportar un pago nuevo; no puede verificarlo.
- Asistencia: solo la suya. Perfil: solo lectura.

### Docente (`usr-demo-2` / 70000002 / 2222)
Menú: Inicio · Mis cursos · Clases · Materiales · Asistencia.
- Solo los `ciclo_cursos` donde `id_docente` es él: `cco-demo-1` y `cco-demo-2`. **No debe ver
  `cco-demo-3`** (no tiene docente asignado) — caso de prueba.
- Puede crear/editar clases y marcarlas `dictada`/`cancelada`.
- Puede subir materiales y alternar `borrador` ↔ `publicado`. Al crear una resolución debe poder
  elegir a qué práctica apunta (`id_material_padre`), y solo se ofrecen prácticas **del mismo
  `id_ciclo_curso`** (regla de integridad 5).
- Ve asistencia de sus clases (lectura) y puede registrarla.
- **No ve pagos.** No crea ciclos ni cursos.

### Auxiliar (`usr-demo-3` / 70000003 / 3333)
Menú: Inicio · Asistencia · Pagos · Anuncios.
- Registra asistencia de cualquier clase.
- Ve todos los pagos y puede registrar pagos reportados.
- Publica anuncios por ciclo (no globales).
- **Punto pendiente de decisión del usuario:** la matriz dice que el auxiliar verifica pagos
  "solo si superadmin delega", pero **no existe ningún campo en el modelo que represente esa
  delegación** (aunque en el flujo simulado Rosa sí verifica pagos). Por ahora **habilita la
  verificación** y deja un comentario `// PENDIENTE: delegación no modelada, ver GUIA_FRONTEND.md
  sección 5` en el código. Anótalo en tu documentación como decisión provisional.
- No crea ciclos, cursos ni usuarios.

### Superadmin (`usr-demo-1` / 70000001 / 1111)
Menú: Inicio · Ciclos · Cursos · Asignaciones · Usuarios · Pagos · Asistencia · Anuncios · Config.
- Todo lo anterior sin restricción.
- Puede crear ciclos, cursos, y asignar docente en `ciclo_cursos` (el flujo estrella de
  `ROLES_Y_FLUJOS.md` sección 3: asignar `id_docente` a `cco-demo-3` y que el docente lo vea
  aparecer, sin tocar código).
- Publica anuncios globales (`id_ciclo` vacío) o por ciclo.

---

## 5-bis. Skills del sistema que debes usar

Se revisaron las skills instaladas en este equipo. **No existe una skill dedicada a diseño web**
— las skills de usuario de esta máquina son académicas, legales y de telecomunicaciones. Solo
tres aplican a este trabajo, y conviene tener claro el alcance real de cada una para no esperar
de ellas más de lo que dan:

### `dataviz` — obligatoria si dibujas cualquier gráfico

**Cuándo:** antes de escribir la primera línea de código de cualquier gráfico, tarjeta de
métrica (KPI), medidor, barra de progreso o fila de estadísticas. Es decir: casi seguro en el
panel del superadmin (alumnos por ciclo, pagos verificados vs. pendientes) y probablemente en el
resumen de asistencia del estudiante.

**Qué aporta:** una fórmula de color validada, especificaciones de ejes/leyendas/tooltips, y
reglas para que todo se lea como un solo sistema en modo claro y oscuro. Evita el resultado
típico de gráficos que cada uno usa una paleta distinta.

**Advertencia importante:** la skill trae una paleta neutra de marcador de posición y te dice
explícitamente que la cambies por la de tu marca. **Cámbiala por la paleta Guyton** de la
sección 1 — el naranja `#FF4A18` como acento y la familia de azules como serie principal. No
publiques nada con los colores por defecto de la skill.

### `artifact-design` — útil, pero con una salvedad

**Cuándo:** al empezar el Paso 6 (componentes comunes y Layout), para calibrar jerarquía visual,
espaciado, tipografía y densidad.

**Salvedad honesta:** esta skill está escrita para *Artifacts* (páginas publicadas en claude.ai),
no para una app React con Vite. Sus fundamentos de diseño son perfectamente aplicables; sus
instrucciones sobre publicar, CSP e inlining de assets **no** — ignóralas. **No conviertas el
aula en un Artifact.** El entregable es la app en `web/`.

### `codex-imagenes` — solo cuando el usuario confirme el ave

**Cuándo:** NO todavía. Esta skill genera imágenes con el CLI de Codex (`image_gen`, con chroma
key para transparencias reales) y es la herramienta correcta para producir el isotipo y las
ilustraciones del aula.

**Por qué esperar:** no sabemos qué ave es el isotipo, y generar un ave inventada contradice la
regla de honestidad del proyecto. Úsala **solo** cuando el usuario confirme el ave, o si él te
pide explícitamente explorar propuestas visuales — y en ese caso, cada imagen se etiqueta como
propuesta, no como el logo. Mientras tanto: placeholder geométrico con la "G".

### Skills que NO aplican

Todo lo demás instalado (`latex-proyecto-tesis`, `vault-to-docx`, `vault-to-pptx`,
`metodologia-investigacion`, `beamer-sustentacion`, las de licitaciones y contratos, etc.) es de
otros dominios del usuario y no tiene relación con este proyecto. No las invoques.

### Skills de mantenimiento, al final

Cuando termines el Paso 8 y todo funcione, `/simplify` sobre el código escrito para detectar
duplicación y componentes que se puedan unificar. Es limpieza de calidad, no búsqueda de bugs.

---

## 6. Pasos de ejecución

Haz **un commit por paso** (español, conventional commits: `feat:`, `fix:`, `docs:`,
`chore:`, `refactor:`). No avances al siguiente paso sin cumplir su criterio de cierre.

**Paso 1 — Limpieza y base visual.** Borra la basura del template (lista en la sección 0). Crea
`estilos/tokens.css` y `estilos/global.css`. Carga las tipografías. Deja `App.jsx` con una
pantalla mínima que use el gradiente.
*Cierre:* `npm run build` y `npm run lint` en verde; la pantalla muestra los colores de marca.

**Paso 2 — Datos mock.** Crea `datos/mock.js` como espejo exacto del Excel DEMO (sección 3).
*Cierre:* las 12 colecciones existen con los ids exactos y los nombres de campo del modelo.

**Paso 3 — Capa de datos.** Crea `api/cliente.js` con todas las funciones de la sección 4,
incluyendo el filtrado por rol y el retardo de 300 ms.
*Cierre:* las cuatro funciones de sesión funcionan y las lecturas devuelven distinto según el rol.

**Paso 4 — Sesión y rutas.** `SesionContexto.jsx` (persistir en `sessionStorage`, clave
namespaced `gy_sesion`), `RutaProtegida.jsx`, y las rutas en `App.jsx`.
*Cierre:* entrar a una ruta privada sin sesión redirige a `/entrar`; con sesión de rol
equivocado, no deja pasar.

**Paso 5 — Login.** `paginas/Entrar.jsx`: DNI + clave de acceso, errores en español
("DNI o clave incorrectos", "Tu cuenta está inactiva"), estado de carga.
*Cierre:* los 5 usuarios DEMO entran y cada uno cae en su panel. DNI se maneja como String.

**Paso 6 — Componentes comunes y Layout.** Todo lo de `componentes/`, incluido el `AvisoDemo` y
el `Isotipo` placeholder.
*Cierre:* el layout se ve bien en escritorio y en celular (muchos alumnos entrarán desde el
teléfono — esto no es opcional).

**Paso 7 — Los cuatro paneles.** Constrúyelos en este orden: estudiante → docente → auxiliar →
superadmin. Cada uno según la sección 5.
*Cierre por panel:* el flujo típico de ese rol descrito en `ROLES_Y_FLUJOS.md` se puede recorrer
entero desde la interfaz.

**Paso 8 — Verificación de casos límite.** Comprueba una por una:
1. El estudiante **no** ve `mtl-demo-3` (borrador).
2. La resolución aparece agrupada bajo su práctica.
3. El docente **no** ve `cco-demo-3`.
4. El docente **no** tiene acceso a pagos por ninguna ruta.
5. El estudiante solo ve sus propios pagos y asistencias.
6. Maria (`usr-demo-5`, retirada) entra al sistema pero **no** ve el contenido del ciclo.
7. El anuncio global se ve desde cualquier ciclo; el de `cic-demo-1` solo desde ese.
8. Todas las tablas tienen su estado vacío, no una tabla en blanco.

**Paso 9 — Documentación.** Ver sección 8.

## 7. Loop de verificación (obligatorio)

Al terminar **cada** paso:

```bash
cd "C:\PROGRAMACION\ACADEMIA GUYTON\web"
npm run build
npm run lint
```

Ambos deben salir con **exit 0**. Si fallan, corrige y repite, **máximo 10 intentos**. Si a los
10 intentos no llega, **detente y reporta honestamente** qué falla y qué intentaste — no
silencies el error, no desactives la regla del linter para que pase, y no declares terminado algo
que no lo está.

Recuerda que el linter es **oxlint**, no ESLint.

## 8. Qué debes documentar (Paso 9)

El usuario pidió explícitamente que dejes constancia de todo lo que hagas. Crea
**`docs/BITACORA_FRONTEND.md`** con:

1. **Qué construiste**, paso por paso, con la fecha.
2. **Decisiones que tomaste tú** y por qué (tipografía elegida, estructura de un panel, forma del
   placeholder del isotipo…). Todo lo que este documento dejó abierto y tuviste que resolver.
3. **Lo que quedó pendiente o provisional**, sin maquillarlo: la delegación de verificación de
   pagos del auxiliar, el isotipo placeholder, las tipografías sin confirmar, las escrituras que
   se pierden al recargar.
4. **El mapa de archivos final** que construiste.
5. **Cómo levantar el proyecto** (`npm install`, `npm run dev`) y **las 5 credenciales DEMO** para
   probar cada rol.
6. **Qué hay que cambiar cuando exista el backend real** — concretamente, qué funciones de
   `api/cliente.js` pasan a ser `fetch` y contra qué endpoints.

Actualiza también el **mapa de archivos del `README.md`** para incluir `web/` y los dos
documentos nuevos. No toques el resto del README.

## 9. Qué NO hacer

- No construyas la landing pública (es otra fase).
- No inventes el logo, ni dibujes un ave, ni le pongas simbología andina.
- No inventes datos de la academia: precios, docentes reales, cantidad de alumnos, tasa de
  ingreso, testimonios. Todo lo que muestres viene del mock DEMO.
- No cambies los nombres de campo del modelo de datos ni los prefijos de id.
- No uses `parseInt` en un DNI.
- No metas llamadas a datos dentro de los componentes: todo pasa por `api/cliente.js`.
- No instales librerías de UI pesadas (Material UI, Bootstrap, Tailwind) sin preguntar — la
  identidad visual es propia y una librería genérica la va a pelear. CSS plano con las variables
  de marca es suficiente.
- No toques `C:\PROGRAMACION\SIMULAUNA`.
- No modifiques el Excel, el script que lo genera, ni los cinco `.md` de diseño.
