# Despliegue a producción — Aula Guyton

Guía paso a paso para poner el aula en línea. Son tres bloques: **A)** publicar el backend
(Apps Script), **B)** conectar el frontend al backend, **C)** publicar el frontend en GitHub
Pages. Al final, el bloque **D** lista lo que sigue pendiente con honestidad.

> **YA DESPLEGADO (2026-08-15).** El aula está en línea en
> **https://canazachyub.github.io/aula-guyton/**, conectada al backend real. El repo es
> `Canazachyub/aula-guyton`, con `VITE_API_URL` configurada como variable y Pages activo. Esta
> guía queda como **referencia para redesplegar** (bloque A tras cambios en el `.gs`) y para
> entender cómo está armado. Los datos del Sheet **siguen siendo DEMO**: el aula funciona, pero
> muestra ejemplos hasta cargar datos reales (bloque D).

---

## A. Publicar el backend (Google Apps Script)

El backend es `apps-script/Codigo.gs`. Ya trae incrustados el ID del Sheet
(`1dHhk…Fc--y8`) y el de la carpeta raíz de Drive (`1yhqT4…hHJEQ`).

1. Abre el spreadsheet **BD Guyton** en Google Sheets → menú **Extensiones → Apps Script**.
2. Borra el contenido por defecto, **pega todo `Codigo.gs`** y guarda.
3. **Solo la primera vez — prepara Drive:** en el editor, selecciona la función `instalarDrive`
   en el desplegable y pulsa **Ejecutar**. Autoriza los permisos que pida Google. Esto:
   - registra `drive_root_id` en la hoja `config`, y
   - crea la estructura `Ciclo/Curso/{Grabaciones,Teoria,Practicas,Resoluciones}` y comparte la
     raíz como "cualquiera con el enlace puede ver" (para que los materiales abran sin login).
   Pega aquí el registro de ejecución si algo falla y lo diagnostico.
4. **Implementar → Nueva implementación → tipo "Aplicación web":**
   - **Ejecutar como:** *Yo* (la cuenta dueña del Sheet).
   - **Quién tiene acceso:** *Cualquier usuario*.
   (Es necesario "Cualquier usuario" porque el frontend llama por `fetch()` sin login de Google;
   la seguridad es el PIN propio del sistema: `dni` + `clave_acceso`.)
5. Autoriza y **copia la URL del Web App** (termina en `/exec`). **Esa URL es la que me falta
   para conectar** — guárdala, la usas en el bloque B y C.
6. **Cada vez que cambie el código `.gs`:** Implementar → Administrar implementaciones → ✏️ →
   Versión: *Nueva* → Implementar. Si no, sigue sirviendo la versión vieja.

---

## B. Conectar el frontend al backend (prueba local primero)

El frontend ya está preparado para funcionar en **dos modos** sin cambiar código:
- **Sin `VITE_API_URL`** → usa datos DEMO en memoria (como hasta ahora).
- **Con `VITE_API_URL`** puesto → llama al Web App real.

Para probar en tu PC antes de publicar:

1. En `web/`, crea un archivo `.env` con:
   ```
   VITE_API_URL=https://script.google.com/macros/s/XXXX/exec
   ```
   (la URL `/exec` del bloque A).
2. `cd web && npm install && npm run dev`.
3. Abre el navegador, entra con un usuario del Sheet (p. ej. DNI `70000001`, clave `1111` si aún
   están los DEMO) y confirma que los datos vienen del Sheet (no del mock).
4. Si algo no carga, abre la consola del navegador (F12) y pásame el error; lo diagnostico.

> `.env` está en `.gitignore` — no se sube. En GitHub Pages la URL se inyecta como variable de
> repositorio (bloque C), no por `.env`.

---

## C. Publicar el frontend en GitHub Pages

El repo local ya está en git (rama `main`) pero **no tiene remoto**. Tú creas el repositorio y
autorizas la subida; el resto es automático (ya hay un workflow de GitHub Actions listo en
`.github/workflows/deploy.yml`).

1. Crea un repositorio nuevo en GitHub (p. ej. `aula-guyton`). Puede ser privado o público.
2. Conéctalo y sube el código:
   ```
   git remote add origin https://github.com/<tu-usuario>/aula-guyton.git
   git push -u origin main
   ```
   (Si prefieres, dame la URL del repo y yo preparo el push para que solo lo autorices.)
3. En el repo: **Settings → Pages → Source: GitHub Actions**.
4. En el repo: **Settings → Secrets and variables → Actions → pestaña Variables → New repository
   variable**:
   - **Name:** `VITE_API_URL`
   - **Value:** la URL `/exec` del bloque A.
   (Es una *variable*, no un *secret*: la URL del Web App es pública, no confidencial.)
5. Cada `git push` a `main` dispara el workflow, que compila `web/` y publica. La dirección será
   `https://<tu-usuario>.github.io/aula-guyton/`.
6. El aula usa `HashRouter` y rutas de assets relativas, así que los enlaces profundos y el
   refrescar la página funcionan bien en Pages (no dan 404).

---

## D. Qué sigue pendiente (con honestidad)

Nada de esto está resuelto todavía; no se presenta como hecho:

1. **Datos reales.** El Sheet sigue con filas DEMO (`-demo-`). Antes de operar con alumnos:
   borrar las filas DEMO y cargar los **ciclos, cursos, docentes y precios reales** (esa lista
   sigue pendiente de tu parte). Mientras existan DEMO, la plataforma está "en producción" pero
   con datos de ejemplo.
2. **Repasos (banco de preguntas).** Está **diseñado, no construido** — ver `docs/REPASOS.md`.
   Espera tu OK a la forma de la hoja para implementarlo. En el aula ya aparece la sección con la
   mascota provisional.
3. **Clases grabadas de YouTube.** El aula ya sabe **mostrar** grabaciones de YouTube embebidas;
   falta la **lista real de videos** de tu canal para cargarlos como materiales `video_grabado`
   con su enlace, dentro del ciclo/curso que corresponda.
4. **Mascota fénix.** La imagen actual es un **placeholder** marcado como provisional. La final
   la generarás con ChatGPT y la reemplazamos.
5. **Seguridad del MVP.** La `clave_acceso` va en texto plano en el Sheet y la sesión no es un
   token firmado (el servidor revalida rol/estado en cada petición, pero no hay caducidad). Es
   aceptable para el MVP; endurecerlo es trabajo de una fase posterior.
