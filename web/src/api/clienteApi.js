// ==========================================================================
// Implementacion REAL de la capa de datos: fetch() contra el Web App de Google
// Apps Script (apps-script/Codigo.gs). Se usa cuando VITE_API_URL tiene valor;
// cuando esta vacio, api/cliente.js re-exporta clienteMock.js (modo DEMO).
//
// Cada funcion tiene EXACTAMENTE la misma firma y forma de respuesta que su
// homonima del mock, para que ningun componente cambie.
//
// Contrato HTTP (ver apps-script/README.md y el encabezado de Codigo.gs):
// - Lecturas (obtener*): GET  <url>?accion=Nombre&sesion=<json>&<param>=<valor>.
//   Devuelven el array/objeto ya parseado.
// - iniciarSesion y escrituras: POST <url> con header Content-Type: text/plain
//   (NO application/json: Apps Script no soporta el preflight OPTIONS) y body
//   JSON.stringify({ accion, sesion, datos, ...otrosParams }). Devuelven { ok, ... }.
// - cerrarSesion()/obtenerSesion() se quedan LOCALES (sessionStorage), igual
//   que en el mock; no viajan al backend.
// - DNI siempre String con trim(). Nunca parseInt sobre un DNI.
// ==========================================================================

const API_URL = import.meta.env.VITE_API_URL

const CLAVE_SESION = 'gy_sesion'
const ERROR_RED = 'No se pudo conectar con el servidor. Revisa tu conexión.'

// ---------------------------------------------------------------------------
// Transporte
// ---------------------------------------------------------------------------

/** Lectura GET. Los parametros objeto (sesion, filtros) viajan como JSON en la
 *  query; los primitivos (idCicloCurso, idClase) como texto plano. Un fallo de
 *  red se relanza para que el hook de carga muestre su estado de error, igual
 *  que hace la UI hoy con el mock. */
async function leer(accion, params = {}) {
  const url = new URL(API_URL)
  url.searchParams.set('accion', accion)
  Object.keys(params).forEach((clave) => {
    const valor = params[clave]
    if (valor === undefined || valor === null) return
    url.searchParams.set(clave, typeof valor === 'object' ? JSON.stringify(valor) : String(valor))
  })
  const respuesta = await fetch(url.toString(), { method: 'GET' })
  const datos = await respuesta.json()
  // Las lecturas del backend devuelven SIEMPRE un array en el caso normal. Si
  // llega un sobre { ok:false, error } (p. ej. sesion invalida o caducada), se
  // relanza como error para que el hook de carga muestre su estado de error, en
  // vez de que una vista intente iterar sobre un objeto y rompa.
  if (datos && !Array.isArray(datos) && datos.ok === false) {
    throw new Error(datos.error || 'No se pudo cargar la información.')
  }
  return datos
}

/** Escritura (o iniciarSesion) por POST. Content-Type text/plain a proposito
 *  (peticion "simple", sin preflight). Un fallo de red se traduce a la misma
 *  forma { ok: false, error } que devuelven las escrituras del backend. */
async function escribir(accion, cuerpo = {}) {
  try {
    const respuesta = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ accion, ...cuerpo }),
    })
    return await respuesta.json()
  } catch {
    return { ok: false, error: ERROR_RED }
  }
}

// ---------------------------------------------------------------------------
// Sesion
// ---------------------------------------------------------------------------

export async function iniciarSesion(dni, clave) {
  const dniLimpio = String(dni ?? '').trim()
  const claveLimpia = String(clave ?? '').trim()
  const resultado = await escribir('iniciarSesion', { datos: { dni: dniLimpio, clave: claveLimpia } })
  // Si el backend valida, se guarda el usuario en sessionStorage igual que el mock.
  if (resultado && resultado.ok) {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(resultado.usuario))
  }
  return resultado
}

export async function cerrarSesion() {
  sessionStorage.removeItem(CLAVE_SESION)
}

export async function obtenerSesion() {
  try {
    const cruda = sessionStorage.getItem(CLAVE_SESION)
    if (!cruda) return null
    const sesion = JSON.parse(cruda)
    return sesion && sesion.id_usuario && sesion.rol ? sesion : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Registro / matricula publica (sin sesion, desde el login)
// ---------------------------------------------------------------------------

/** Ciclos con inscripcion abierta (GET publico, sin sesion). */
export async function obtenerCiclosAbiertos() {
  return leer('obtenerCiclosAbiertos', {})
}

/** Autoservicio de preinscripcion (POST publico, sin sesion). El voucher viaja
 *  como voucher_base64/voucher_tipo/voucher_nombre dentro de `datos`. */
export async function registrarse(datos) {
  return escribir('registrarse', { datos })
}

// ---------------------------------------------------------------------------
// Lecturas (GET) — mismas firmas que el mock
// ---------------------------------------------------------------------------

export async function obtenerCiclosDelUsuario(sesion) {
  return leer('obtenerCiclosDelUsuario', { sesion })
}

export async function obtenerCursosDelUsuario(sesion) {
  return leer('obtenerCursosDelUsuario', { sesion })
}

export async function obtenerHorario(sesion, idCicloCurso) {
  return leer('obtenerHorario', { sesion, idCicloCurso })
}

export async function obtenerClases(sesion, idCicloCurso) {
  return leer('obtenerClases', { sesion, idCicloCurso })
}

export async function obtenerMateriales(sesion, idCicloCurso) {
  return leer('obtenerMateriales', { sesion, idCicloCurso })
}

export async function obtenerPagos(sesion) {
  return leer('obtenerPagos', { sesion })
}

export async function obtenerAsistencias(sesion, filtros = {}) {
  return leer('obtenerAsistencias', { sesion, filtros })
}

export async function obtenerRosterDeClase(sesion, idClase) {
  return leer('obtenerRosterDeClase', { sesion, idClase })
}

export async function obtenerAnuncios(sesion) {
  return leer('obtenerAnuncios', { sesion })
}

export async function obtenerMatriculas(sesion) {
  return leer('obtenerMatriculas', { sesion })
}

export async function obtenerUsuarios(sesion) {
  return leer('obtenerUsuarios', { sesion })
}

export async function obtenerConfig(sesion) {
  return leer('obtenerConfig', { sesion })
}

export async function obtenerCursosCatalogo(sesion) {
  return leer('obtenerCursosCatalogo', { sesion })
}

// --- Banqueo Guyton UNA Puno (lecturas GET) ---------------------------------

export async function obtenerBanqueoCursos(sesion) {
  return leer('obtenerBanqueoCursos', { sesion })
}

export async function obtenerBanqueoTemas(sesion, { curso } = {}) {
  return leer('obtenerBanqueoTemas', { sesion, curso })
}

export async function obtenerBanqueoPreguntas(sesion, { curso, tema, limite } = {}) {
  return leer('obtenerBanqueoPreguntas', { sesion, curso, tema, limite })
}

export async function obtenerBanqueoProgreso(sesion) {
  return leer('obtenerBanqueoProgreso', { sesion })
}

export async function obtenerBanqueoRanking(sesion) {
  return leer('obtenerBanqueoRanking', { sesion })
}

// --- Simulacros (ficha optica de calificacion) ------------------------------

export async function obtenerSimulacros(sesion) {
  return leer('obtenerSimulacros', { sesion })
}

// ---------------------------------------------------------------------------
// Escrituras (POST) — mismas firmas y formas de respuesta que el mock
// ---------------------------------------------------------------------------

export async function registrarPago(sesion, datos) {
  return escribir('registrarPago', { sesion, datos })
}

export async function verificarPago(sesion, idPago, decision) {
  // Codigo.gs lee idPago/decision como parametros sueltos del cuerpo.
  return escribir('verificarPago', { sesion, idPago, decision })
}

export async function guardarClase(sesion, datos) {
  return escribir('guardarClase', { sesion, datos })
}

export async function guardarMaterial(sesion, datos) {
  return escribir('guardarMaterial', { sesion, datos })
}

export async function registrarAsistencia(sesion, datos) {
  return escribir('registrarAsistencia', { sesion, datos })
}

export async function publicarAnuncio(sesion, datos) {
  return escribir('publicarAnuncio', { sesion, datos })
}

export async function guardarCiclo(sesion, datos) {
  return escribir('guardarCiclo', { sesion, datos })
}

export async function guardarCurso(sesion, datos) {
  return escribir('guardarCurso', { sesion, datos })
}

export async function guardarAsignacion(sesion, datos) {
  return escribir('guardarAsignacion', { sesion, datos })
}

export async function guardarUsuario(sesion, datos) {
  return escribir('guardarUsuario', { sesion, datos })
}

export async function crearUsuario(sesion, datos) {
  return escribir('crearUsuario', { sesion, datos })
}

export async function asignarCursosACiclo(sesion, datos) {
  return escribir('asignarCursosACiclo', { sesion, datos })
}

export async function registrarSimulacro(sesion, datos) {
  return escribir('registrarSimulacro', { sesion, datos })
}

export async function guardarSimulacroPdf(sesion, datos) {
  return escribir('guardarSimulacroPdf', { sesion, datos })
}

/** Registra una respuesta del banqueo (escritura POST, patron `escribir`). */
export async function registrarRespuestaBanqueo(sesion, datos) {
  return escribir('registrarRespuestaBanqueo', { sesion, datos })
}
