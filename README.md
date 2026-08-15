# Academia Guyton — Aula Virtual

Proyecto de aula virtual para la **Academia Preuniversitaria Guyton** (Puno, Perú), academia
real que prepara postulantes para el examen de admisión universitaria. WhatsApp de contacto:
**+51 986 833 308**.

Este repositorio es **independiente** del proyecto SimulaUNA (otra plataforma, otro cliente,
otro código). No comparten base de datos, dominio ni identidad visual.

## Estado actual: rumbo a producción

- **Fase 0 — Diseño:** completa (modelo de datos, roles y flujos, identidad visual).
- **Fase 1 — Infraestructura:** el Sheet **BD Guyton** existe en Google Sheets y la carpeta raíz
  de Drive también; sus ids están incrustados en `apps-script/Codigo.gs`.
- **Fase 2 — Backend (Apps Script):** implementado y **desplegado** como Web App; probado contra
  el Sheet real (login por rol, lecturas filtradas por permiso, escrituras).
- **Fase 3a — Aula (frontend React):** los 4 paneles por rol están construidos. La capa de datos
  puede correr en **modo DEMO** (mock en memoria) o **conectada al backend real** con solo
  definir `VITE_API_URL` (ver `docs/DESPLIEGUE.md`).

> **Nota honesta:** los datos del Sheet siguen siendo **DEMO** (filas `-demo-`). "Producción"
> aquí significa *plataforma lista y conectada*, no que ya haya alumnos reales cargados. Antes de
> operar con alumnos hay que borrar los DEMO y cargar los ciclos/cursos/docentes reales.

Stack: **Google Sheets** (BD) · **Google Apps Script** (API por roles) · **React + Vite**
(aula) · **Google Drive** (materiales) · **GitHub Pages** (hosting del frontend).

## Mapa de archivos

```
ACADEMIA GUYTON/
├── README.md                     (este archivo)
├── BASE_DATOS_GUYTON.xlsx        Excel de referencia con las 12 hojas + datos DEMO
├── apps-script/
│   ├── Codigo.gs                 Backend: Web App de Apps Script (API por roles sobre el Sheet)
│   └── README.md                 Despliegue del Web App y contrato HTTP
├── .github/workflows/
│   └── deploy.yml                Publica web/ en GitHub Pages en cada push a main
├── docs/
│   ├── PLAN_MAESTRO.md           Fases del proyecto, criterios de cierre, decisiones tomadas
│   ├── MODELO_DATOS.md           Las 12 hojas columna por columna + diagrama de relaciones
│   ├── ROLES_Y_FLUJOS.md         Simulación de un día típico por rol + matriz de permisos
│   ├── IDENTIDAD_VISUAL.md       Paleta, tipografías, gradiente, y honestidad sobre lo pendiente
│   ├── GUIA_FRONTEND.md          Especificación ejecutable del frontend del aula (Fase 3a)
│   ├── BITACORA_FRONTEND.md      Qué se construyó en el frontend, decisiones y pendientes
│   ├── DESPLIEGUE.md             Guía para encender producción (backend + conexión + GitHub Pages)
│   ├── REPASOS.md                Diseño del banco de práctica (PROPUESTA, pendiente de OK)
│   └── generar_excel.py          Script que regenera BASE_DATOS_GUYTON.xlsx desde cero
└── web/                          Aula virtual (Vite + React)
    ├── .env.example              Documenta VITE_API_URL (vacío = modo DEMO)
    ├── index.html
    ├── public/
    │   ├── favicon.svg           Placeholder del isotipo (el logo real está pendiente)
    │   └── mascota-fenix-placeholder.svg   Mascota fénix PROVISIONAL (se generará después)
    └── src/
        ├── estilos/              tokens.css (variables de marca) + global.css
        ├── datos/mock.js         Espejo exacto del Excel DEMO
        ├── api/
        │   ├── cliente.js        Selector: usa clienteApi si hay VITE_API_URL, si no clienteMock
        │   ├── clienteApi.js     Implementación real (fetch al Web App de Apps Script)
        │   └── clienteMock.js    Implementación DEMO (datos en memoria)
        ├── auth/                 Sesión (sessionStorage) y rutas protegidas por rol
        ├── paginas/Entrar.jsx    Login con DNI + clave de acceso
        ├── componentes/          Layout responsive y bloques compartidos
        └── paneles/              estudiante/ (incl. Repasos placeholder) docente/ auxiliar/ superadmin/
```

## Cómo levantar el aula localmente

```
cd web
npm install
npm run dev
```

- **Sin `web/.env`** → arranca en modo DEMO (datos de ejemplo en memoria).
- **Con `web/.env`** que defina `VITE_API_URL=<url .../exec del Web App>` → usa el backend real.

Usuarios DEMO para probar (DNI / clave): `70000001`/`1111` superadmin · `70000002`/`2222`
docente · `70000003`/`3333` auxiliar · `70000004`/`4444` estudiante.

## Despliegue a producción

Los pasos completos están en **`docs/DESPLIEGUE.md`**: publicar el Web App de Apps Script,
conectar el frontend (`VITE_API_URL`), y publicar en GitHub Pages con el workflow ya incluido.

## Cómo regenerar el Excel

```
py -3.12 docs/generar_excel.py
```

(En esta máquina el `python` del PATH no tiene `openpyxl`; usar `py -3.12`, que sí lo tiene.)
El script verifica al final que existen las 13 hojas y que los headers de fila 1 coinciden con
el modelo de datos.

## Qué falta de parte del usuario para cerrar producción

1. **Crear el repositorio en GitHub** y autorizar la subida (para activar GitHub Pages).
2. Configurar `VITE_API_URL` como **variable de repositorio** en GitHub (la URL del Web App).
3. **Datos reales**: borrar las filas DEMO y cargar **ciclos, cursos, docentes y precios**
   reales (los del Excel son 100% DEMO).
4. **OK al diseño de Repasos** (`docs/REPASOS.md`) para construir el banco de preguntas.
5. **Lista de videos del canal de YouTube** para cargarlos como grabaciones (`video_grabado`).
6. **Logo/isotipo vectorial** y la **imagen final de la mascota fénix** (el usuario la generará).
7. **Fotos autorizadas** de la academia y el **dominio** final, si se usará uno propio.

Mientras esto no llegue, cualquier documento que necesite uno de estos datos lo marca como
**pendiente de confirmar**, nunca como un hecho.
