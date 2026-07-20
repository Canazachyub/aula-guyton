# Academia Guyton — Aula Virtual

Proyecto de aula virtual para la **Academia Preuniversitaria Guyton** (Puno, Perú), academia
real que prepara postulantes para el examen de admisión universitaria. WhatsApp de contacto:
**+51 986 833 308**.

Este repositorio es **independiente** del proyecto SimulaUNA (otra plataforma, otro cliente,
otro código). No comparten base de datos, dominio ni identidad visual.

## Estado actual: Fase 0 — Diseño

Todavía no hay backend ni frontend en producción. Lo que existe hoy es el **diseño completo
del modelo de datos, los flujos por rol y la identidad visual**, más un Excel de referencia
generado por script para que el usuario pueda revisarlo y subirlo a Google Sheets cuando esté
listo.

Stack previsto para las siguientes fases (todavía no implementado):

- **Google Sheets** como base de datos (el Excel de este repo es su plantilla).
- **Google Apps Script** como API por roles, sobre sesiones simples.
- **Frontend web** (landing promocional + aula) con la identidad visual descrita en
  `docs/IDENTIDAD_VISUAL.md`.
- **Google Drive** para archivos (grabaciones, PDFs de teoría/práctica/resolución).

## Mapa de archivos

```
ACADEMIA GUYTON/
├── README.md                     (este archivo)
├── BASE_DATOS_GUYTON.xlsx        Excel de referencia con las 12 hojas + datos DEMO
├── docs/
│   ├── PLAN_MAESTRO.md            Fases del proyecto, criterios de cierre, decisiones tomadas
│   ├── MODELO_DATOS.md            Las 12 hojas columna por columna + diagrama de relaciones
│   ├── ROLES_Y_FLUJOS.md          Simulación de un día típico por rol + matriz de permisos
│   ├── IDENTIDAD_VISUAL.md        Paleta, tipografías, gradiente, y honestidad sobre lo pendiente
│   ├── GUIA_FRONTEND.md           Especificación ejecutable del frontend del aula (Fase 3a)
│   ├── BITACORA_FRONTEND.md       Qué se construyó, decisiones, pendientes y migración al backend
│   └── generar_excel.py           Script que regenera BASE_DATOS_GUYTON.xlsx desde cero
└── web/                           Aula virtual (Vite + React, Fase 3a ya construida)
    ├── index.html
    ├── public/favicon.svg         Placeholder del isotipo (el logo real está pendiente)
    └── src/
        ├── estilos/               tokens.css (variables de marca) + global.css
        ├── datos/mock.js          Espejo exacto del Excel DEMO
        ├── api/cliente.js         ÚNICA capa de datos (hoy mock; Fase 2: fetch a Apps Script)
        ├── auth/                  Sesión (sessionStorage) y rutas protegidas por rol
        ├── paginas/Entrar.jsx     Login con DNI + clave de acceso
        ├── componentes/           Layout responsive y bloques compartidos
        └── paneles/               estudiante/ docente/ auxiliar/ superadmin/
```

## Cómo regenerar el Excel

```
py -3.12 docs/generar_excel.py
```

(En esta máquina el `python` del PATH apunta a un intérprete sin `openpyxl`; usar `py -3.12`,
que sí lo tiene instalado. El script no depende de nada fuera de `openpyxl`.)

El script termina con una verificación automática: vuelve a abrir el `.xlsx` con `openpyxl` y
comprueba que existen las 13 hojas (`LEEME` + las 12 de datos) y que los headers de fila 1
coinciden exactamente con los del modelo de datos.

## Qué necesitamos del usuario para avanzar de fase

Nada de esto está inventado ni asumido — son huecos reales que hay que llenar antes de pasar
de Fase 0 a Fase 1:

1. **Confirmar o corregir el modelo de datos** (`docs/MODELO_DATOS.md`) antes de crear el
   Google Sheet real — una vez haya datos de alumnos reales, cambiar el esquema es más caro.
2. **El link del Google Sheet** una vez el usuario suba `BASE_DATOS_GUYTON.xlsx` (Archivo →
   Guardar como Google Sheets, o importar directamente).
3. **El link de la carpeta raíz de Google Drive** donde vivirán los materiales, para completar
   `config.drive_root_id` y activar la convención de carpetas descrita en `MODELO_DATOS.md`.
4. **El logo/isotipo vectorial** (SVG o AI) del ave naranja con la "G". Hoy solo tenemos la
   descripción dada por el usuario, sin archivo.
5. **Confirmación de qué ave es el isotipo** (¿fénix?, ¿águila?, ¿otra?) — no se ha confirmado,
   y no se va a forzar una identidad andina (ver nota del usuario: la mascota no debe
   presentarse como vicuña ni imponerle simbología andina que él no pidió).
6. **Fotos autorizadas** de la academia (alumnos, docentes, instalaciones) para el frontend.
7. **Lista real de ciclos, cursos, precios y docentes** — los datos de `BASE_DATOS_GUYTON.xlsx`
   son 100% DEMO (marcados con el sufijo `-demo-` en los ids y la palabra DEMO en
   observaciones/descripciones) y no deben confundirse con información real de la academia.
8. **El dominio** donde se publicará el frontend cuando exista.

Mientras esto no llegue, cualquier documento de este proyecto que necesite uno de estos datos
lo marca explícitamente como **pendiente de confirmar**, nunca como un hecho.
