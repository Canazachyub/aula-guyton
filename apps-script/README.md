# Backend Fase 2 — Web App de Google Apps Script

`Codigo.gs` es el backend del aula virtual: reemplaza al mock local (`web/src/datos/mock.js`)
leyendo y escribiendo directamente sobre el spreadsheet **BD Guyton**. Implementa cada
función de `web/src/api/cliente.js` como una acción HTTP con la misma lógica de permisos
por rol, validaciones y formas de respuesta.

## Despliegue

1. Abre el spreadsheet **BD Guyton** en Google Sheets (ID
   `1dHhkddgu42-c4tVWxdd55kz1wyMeEvhI7gYuyFc--y8`).
2. Menú **Extensiones → Apps Script**. Borra el contenido por defecto y pega
   **todo** el contenido de `Codigo.gs`. Guarda.
3. **Implementar → Nueva implementación → tipo "Aplicación web"**:
   - **Ejecutar como:** `Yo` (la cuenta dueña del Sheet).
   - **Quién tiene acceso:** `Cualquier usuario`.

   Es necesario "Cualquier usuario" porque el frontend hará `fetch()` sin login de
   Google; la barrera de seguridad es el PIN propio del sistema (`dni` + `clave_acceso`).
4. Autoriza los permisos que pida Google (acceso a tus hojas de cálculo).
5. Copia la **URL del Web App** que aparece al terminar (termina en `/exec`).

> **Tras cada cambio en el código:** el Web App sigue sirviendo la versión anterior
> hasta que crees una **nueva versión** de la implementación
> (**Implementar → Administrar implementaciones → ✏️ → Versión: Nueva → Implementar**).

## Contrato HTTP

- **GET** `<url>?accion=NombreAccion&sesion=<json>&<param>=<valor>` — lecturas.
- **POST** `<url>` con cuerpo JSON `{ "accion": "...", "sesion": {...}, "datos": {...} }`.

**CORS:** los POST deben enviarse con header `Content-Type: text/plain` (no
`application/json`). Apps Script no responde al preflight `OPTIONS`; con `text/plain`
el navegador hace una petición "simple" que sí llega. El cuerpo sigue siendo JSON.

- Lecturas → devuelven el **array** ya filtrado por rol (idéntico al mock).
- `iniciarSesion` → `{ ok: true, usuario }` (sin `clave_acceso`) o `{ ok: false, error }`.
- Escrituras → `{ ok: true, ... }` o `{ ok: false, error: 'mensaje en español' }`.
- Sesión inválida/caducada → `{ ok: false, error: 'Sesión inválida o caducada...' }`
  (el frontend debe detectar `ok === false` en cualquier respuesta y redirigir al login).

## Qué configurar en el frontend (Fase 2 del cliente)

Crear `web/.env` con:

```
VITE_API_URL=https://script.google.com/macros/s/AKfy.../exec
```

y reescribir cada función de `web/src/api/cliente.js` como `fetch()` contra esa URL,
manteniendo firmas y formas de respuesta. `cerrarSesion`/`obtenerSesion` se quedan
locales (sessionStorage) como hoy.

## Seguridad (limitación conocida del MVP)

No hay tokens: el frontend reenvía el objeto sesión en cada request y el servidor
**revalida** contra la hoja `usuarios` que el `id_usuario` exista y que su `rol` y
`estado` coincidan (y que la cuenta siga `activa`). Es un PIN de MVP, no un JWT:
endurecerlo (token firmado con caducidad) queda para una fase posterior.
