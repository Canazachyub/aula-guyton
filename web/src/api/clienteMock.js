// ==========================================================================
// Implementacion MOCK de la capa de datos (modo DEMO, en memoria).
// Resuelve todo contra datos/mock.js con un retardo artificial de ~300 ms para
// que los estados de carga de la UI sean reales. Se usa cuando VITE_API_URL
// esta vacio; cuando tiene valor, api/cliente.js re-exporta clienteApi.js.
//
// Ningun componente importa este archivo directamente: importan api/cliente.js,
// que decide entre esta implementacion y clienteApi.js segun VITE_API_URL.
//
// Convenciones:
// - Lecturas: devuelven arrays ya FILTRADOS por rol (como hara el backend con
//   la matriz de permisos). Si el rol no tiene acceso a un recurso, el array
//   viene vacio; nunca se devuelve data ajena para que la UI la oculte.
// - Escrituras: devuelven { ok: true, ... } o { ok: false, error: 'mensaje en
//   espanol' }. Rechazan explicitamente lo no permitido; nunca lanzan.
// - DNI siempre String con trim(). Nunca parseInt sobre un DNI.
// ==========================================================================

import { db } from '../datos/mock.js'

const CLAVE_SESION = 'gy_sesion'
const RETARDO_MS = 300

const esperar = (ms = RETARDO_MS) => new Promise((resolve) => setTimeout(resolve, ms))

const hoy = () => new Date().toISOString().slice(0, 10)

// ---------------------------------------------------------------------------
// Utilidades internas (no se exportan)
// ---------------------------------------------------------------------------

function buscarUsuario(idUsuario) {
  return db.usuarios.find((u) => u.id_usuario === idUsuario) || null
}

function buscarCiclo(idCiclo) {
  return db.ciclos.find((c) => c.id_ciclo === idCiclo) || null
}

function buscarCurso(idCurso) {
  return db.cursos.find((c) => c.id_curso === idCurso) || null
}

function buscarCicloCurso(idCicloCurso) {
  return db.ciclo_cursos.find((cc) => cc.id_ciclo_curso === idCicloCurso) || null
}

function nombreCompleto(usuario) {
  return usuario ? `${usuario.nombres} ${usuario.apellidos}` : ''
}

/** Ids de ciclo donde el estudiante tiene matricula con estado 'matriculado'. */
function ciclosMatriculadosDe(idUsuario) {
  return db.matriculas
    .filter((m) => m.id_usuario === idUsuario && m.estado === 'matriculado')
    .map((m) => m.id_ciclo)
}

/** ciclo_cursos visibles segun el rol (la regla base de la matriz de permisos). */
function cicloCursosVisibles(sesion) {
  if (!sesion) return []
  switch (sesion.rol) {
    case 'superadmin':
    case 'auxiliar':
      return db.ciclo_cursos
    case 'docente':
      return db.ciclo_cursos.filter((cc) => cc.id_docente === sesion.id_usuario)
    case 'estudiante': {
      const ciclos = ciclosMatriculadosDe(sesion.id_usuario)
      return db.ciclo_cursos.filter((cc) => ciclos.includes(cc.id_ciclo))
    }
    default:
      return []
  }
}

function puedeVerCicloCurso(sesion, idCicloCurso) {
  return cicloCursosVisibles(sesion).some((cc) => cc.id_ciclo_curso === idCicloCurso)
}

/** Ids de ciclo "alcanzables" por el usuario (para anuncios por ciclo). */
function ciclosAlcanzables(sesion) {
  if (!sesion) return []
  if (sesion.rol === 'superadmin' || sesion.rol === 'auxiliar') {
    return db.ciclos.map((c) => c.id_ciclo)
  }
  return [...new Set(cicloCursosVisibles(sesion).map((cc) => cc.id_ciclo))]
}

/** Resuelve un ciclo_curso con los nombres de curso, docente y ciclo (sin duplicar datos en el mock). */
function resolverCicloCurso(cc) {
  const curso = buscarCurso(cc.id_curso)
  const docente = cc.id_docente ? buscarUsuario(cc.id_docente) : null
  const ciclo = buscarCiclo(cc.id_ciclo)
  return {
    ...cc,
    curso_nombre: curso ? curso.nombre : '(curso no encontrado)',
    docente_nombre: docente ? nombreCompleto(docente) : '',
    ciclo_nombre: ciclo ? ciclo.nombre : '',
  }
}

/** Siguiente id DEMO correlativo, ej. pag-demo-4. Los ids nunca se reutilizan. */
function siguienteIdDemo(filas, campoId, prefijo) {
  const max = filas.reduce((acc, fila) => {
    const coincidencia = new RegExp(`^${prefijo}-demo-(\\d+)$`).exec(fila[campoId])
    return coincidencia ? Math.max(acc, Number(coincidencia[1])) : acc
  }, 0)
  return `${prefijo}-demo-${max + 1}`
}

const sinPermiso = (accion) => ({ ok: false, error: `Tu rol no tiene permiso para ${accion}.` })

// ---------------------------------------------------------------------------
// Sesion
// ---------------------------------------------------------------------------

export async function iniciarSesion(dni, clave) {
  await esperar()
  const dniLimpio = String(dni ?? '').trim()
  const claveLimpia = String(clave ?? '').trim()

  const usuario = db.usuarios.find((u) => u.dni === dniLimpio)
  if (!usuario || usuario.clave_acceso !== claveLimpia) {
    return { ok: false, error: 'DNI o clave incorrectos. Revisa tus datos e inténtalo de nuevo.' }
  }
  if (usuario.estado !== 'activo') {
    return { ok: false, error: 'Tu cuenta está inactiva. Comunícate con la academia.' }
  }

  // La sesion nunca guarda la clave_acceso.
  const { clave_acceso: _omitida, ...sesion } = usuario
  sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
  return { ok: true, usuario: sesion }
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

/** Ciclos con inscripcion abierta que un visitante puede elegir para matricularse.
 *  Contrato publico: [{ id_ciclo, nombre, anio, estado, precio_matricula,
 *  precio_mensualidad, n_mensualidades }]. Devuelve los ciclos DEMO en estado
 *  'inscripciones_abiertas' o 'en_curso'; si ninguno califica, cae al ciclo
 *  'en_curso' para que el registro siempre se pueda probar. */
export async function obtenerCiclosAbiertos() {
  await esperar()
  const abiertos = db.ciclos.filter(
    (c) => c.estado === 'inscripciones_abiertas' || c.estado === 'en_curso',
  )
  const elegibles = abiertos.length ? abiertos : db.ciclos.filter((c) => c.estado === 'en_curso')
  return elegibles.map((c) => ({
    id_ciclo: c.id_ciclo,
    nombre: c.nombre,
    anio: c.anio,
    estado: c.estado,
    precio_matricula: c.precio_matricula,
    precio_mensualidad: c.precio_mensualidad,
    n_mensualidades: c.n_mensualidades,
  }))
}

/** Autoservicio de preinscripcion desde el login (sin sesion). Crea usuario
 *  estudiante + matricula 'preinscrito' + pago de matricula 'pendiente' EN
 *  MEMORIA y devuelve { ok:true, mensaje, ciclo_nombre }. En DEMO el voucher se
 *  ignora (no se guarda el archivo): solo se conserva voucher_ref si viene. */
export async function registrarse(datos = {}) {
  await esperar()
  const nombres = String(datos.nombres ?? '').trim()
  const apellidos = String(datos.apellidos ?? '').trim()
  const dni = String(datos.dni ?? '').trim()
  const celular = String(datos.celular ?? '').trim()
  const email = String(datos.email ?? '').trim()
  const clave = String(datos.clave ?? '').trim()
  const idCiclo = String(datos.id_ciclo ?? '').trim()
  const medio = String(datos.medio ?? '').trim()

  if (!nombres || !apellidos || !dni || !clave) {
    return { ok: false, error: 'Completa tus nombres, apellidos, DNI y clave.' }
  }
  if (clave.length < 4) {
    return { ok: false, error: 'La clave debe tener al menos 4 caracteres.' }
  }
  const ciclo = buscarCiclo(idCiclo)
  if (!ciclo) return { ok: false, error: 'Elige un ciclo válido para matricularte.' }
  const mediosValidos = ['yape', 'plin', 'efectivo', 'transferencia']
  if (!mediosValidos.includes(medio)) {
    return { ok: false, error: 'Elige un medio de pago válido.' }
  }
  if (db.usuarios.some((u) => u.dni === dni)) {
    return { ok: false, error: 'Ya existe una cuenta con ese DNI. Intenta iniciar sesión.' }
  }

  const usuario = {
    id_usuario: siguienteIdDemo(db.usuarios, 'id_usuario', 'usr'),
    dni,
    nombres,
    apellidos,
    celular,
    email,
    rol: 'estudiante',
    clave_acceso: clave,
    foto_url: '',
    estado: 'activo',
    fecha_registro: hoy(),
  }
  db.usuarios.push(usuario)

  const matricula = {
    id_matricula: siguienteIdDemo(db.matriculas, 'id_matricula', 'mat'),
    id_usuario: usuario.id_usuario,
    id_ciclo: ciclo.id_ciclo,
    fecha: hoy(),
    estado: 'preinscrito',
    turno: '',
    observaciones: 'Preinscripción desde el registro público (modo demostración)',
  }
  db.matriculas.push(matricula)

  const pago = {
    id_pago: siguienteIdDemo(db.pagos, 'id_pago', 'pag'),
    id_matricula: matricula.id_matricula,
    concepto: 'matricula',
    monto: ciclo.precio_matricula,
    fecha_reporte: hoy(),
    fecha_verificacion: '',
    medio,
    estado: 'pendiente',
    voucher_ref: String(datos.voucher_ref ?? '').trim(),
    id_verificador: '',
  }
  db.pagos.push(pago)

  return {
    ok: true,
    mensaje: 'Tu preinscripción se registró y tu pago de matrícula quedó en revisión.',
    ciclo_nombre: ciclo.nombre,
  }
}

// ---------------------------------------------------------------------------
// Lecturas (siempre reciben la sesion y filtran segun el rol)
// ---------------------------------------------------------------------------

export async function obtenerCiclosDelUsuario(sesion) {
  await esperar()
  const ids = ciclosAlcanzables(sesion)
  return db.ciclos
    .filter((c) => ids.includes(c.id_ciclo))
    .map((c) => {
      if (sesion?.rol !== 'estudiante') return c
      const matricula = db.matriculas.find(
        (m) => m.id_usuario === sesion.id_usuario && m.id_ciclo === c.id_ciclo && m.estado === 'matriculado',
      )
      return { ...c, matricula: matricula || null }
    })
}

export async function obtenerCursosDelUsuario(sesion) {
  await esperar()
  return cicloCursosVisibles(sesion)
    .map(resolverCicloCurso)
    .sort((a, b) => a.ciclo_nombre.localeCompare(b.ciclo_nombre) || a.orden - b.orden)
}

export async function obtenerHorario(sesion, idCicloCurso) {
  await esperar()
  if (!puedeVerCicloCurso(sesion, idCicloCurso)) return []
  const ORDEN_DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
  return db.horario
    .filter((h) => h.id_ciclo_curso === idCicloCurso)
    .sort((a, b) => ORDEN_DIAS.indexOf(a.dia_semana) - ORDEN_DIAS.indexOf(b.dia_semana))
}

export async function obtenerClases(sesion, idCicloCurso) {
  await esperar()
  if (!puedeVerCicloCurso(sesion, idCicloCurso)) return []
  return db.clases
    .filter((c) => c.id_ciclo_curso === idCicloCurso)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio))
}

export async function obtenerMateriales(sesion, idCicloCurso) {
  await esperar()
  if (!puedeVerCicloCurso(sesion, idCicloCurso)) return []

  // Estudiante y auxiliar solo ven lo publicado (patron "fila publica"):
  // un material en borrador NO les aparece jamas (caso de prueba: mtl-demo-3).
  const verTodo = sesion.rol === 'superadmin' || sesion.rol === 'docente'
  const visibles = db.materiales.filter(
    (m) => m.id_ciclo_curso === idCicloCurso && (verTodo || m.estado === 'publicado'),
  )

  // Las resoluciones cuelgan de su practica via id_material_padre: la UI las
  // muestra agrupadas, no sueltas. Una resolucion cuyo padre no es visible
  // (caso borde) se muestra al nivel superior para no perderla.
  const porId = new Map(visibles.map((m) => [m.id_material, m]))
  const raiz = []
  for (const m of visibles) {
    if (m.id_material_padre && porId.has(m.id_material_padre)) continue
    raiz.push({
      ...m,
      resoluciones: visibles.filter((h) => h.id_material_padre === m.id_material),
    })
  }
  return raiz.sort(
    (a, b) => (a.semana ?? 0) - (b.semana ?? 0) || a.fecha_publicacion.localeCompare(b.fecha_publicacion),
  )
}

export async function obtenerPagos(sesion) {
  await esperar()
  if (!sesion || sesion.rol === 'docente') return [] // el docente NO ve pagos, por ninguna via

  let filas = db.pagos
  if (sesion.rol === 'estudiante') {
    const susMatriculas = db.matriculas
      .filter((m) => m.id_usuario === sesion.id_usuario)
      .map((m) => m.id_matricula)
    filas = filas.filter((p) => susMatriculas.includes(p.id_matricula))
  }

  return filas
    .map((p) => {
      const matricula = db.matriculas.find((m) => m.id_matricula === p.id_matricula)
      const alumno = matricula ? buscarUsuario(matricula.id_usuario) : null
      const ciclo = matricula ? buscarCiclo(matricula.id_ciclo) : null
      const verificador = p.id_verificador ? buscarUsuario(p.id_verificador) : null
      return {
        ...p,
        alumno_nombre: alumno ? nombreCompleto(alumno) : '(alumno no encontrado)',
        alumno_dni: alumno ? alumno.dni : '',
        ciclo_nombre: ciclo ? ciclo.nombre : '',
        verificador_nombre: verificador ? nombreCompleto(verificador) : '',
      }
    })
    .sort((a, b) => b.fecha_reporte.localeCompare(a.fecha_reporte))
}

export async function obtenerAsistencias(sesion, filtros = {}) {
  await esperar()
  if (!sesion) return []

  let filas = db.asistencias
  if (sesion.rol === 'estudiante') {
    filas = filas.filter((a) => a.id_usuario === sesion.id_usuario)
  } else if (sesion.rol === 'docente') {
    const susClases = db.clases
      .filter((c) => cicloCursosVisibles(sesion).some((cc) => cc.id_ciclo_curso === c.id_ciclo_curso))
      .map((c) => c.id_clase)
    filas = filas.filter((a) => susClases.includes(a.id_clase))
  }
  // auxiliar y superadmin: sin restriccion adicional

  if (filtros.idClase) filas = filas.filter((a) => a.id_clase === filtros.idClase)
  if (filtros.idUsuario) filas = filas.filter((a) => a.id_usuario === filtros.idUsuario)

  return filas
    .map((a) => {
      const clase = db.clases.find((c) => c.id_clase === a.id_clase)
      const cc = clase ? buscarCicloCurso(clase.id_ciclo_curso) : null
      const curso = cc ? buscarCurso(cc.id_curso) : null
      const alumno = buscarUsuario(a.id_usuario)
      return {
        ...a,
        clase_fecha: clase ? clase.fecha : '',
        clase_tema: clase ? clase.tema : '',
        curso_nombre: curso ? curso.nombre : '',
        alumno_nombre: alumno ? nombreCompleto(alumno) : '(alumno no encontrado)',
      }
    })
    .sort((a, b) => b.clase_fecha.localeCompare(a.clase_fecha))
}

/** Alumnos con matricula 'matriculado' en el ciclo de la clase dada, con su
 *  asistencia ya registrada (si existe). Es el "papel" para pasar lista. */
export async function obtenerRosterDeClase(sesion, idClase) {
  await esperar()
  if (!sesion || sesion.rol === 'estudiante') return []
  const clase = db.clases.find((c) => c.id_clase === idClase)
  if (!clase) return []
  if (sesion.rol === 'docente' && !puedeVerCicloCurso(sesion, clase.id_ciclo_curso)) return []

  const cc = buscarCicloCurso(clase.id_ciclo_curso)
  return db.matriculas
    .filter((m) => m.id_ciclo === cc.id_ciclo && m.estado === 'matriculado')
    .map((m) => {
      const alumno = buscarUsuario(m.id_usuario)
      const asistencia = db.asistencias.find(
        (a) => a.id_clase === idClase && a.id_usuario === m.id_usuario,
      )
      return {
        id_usuario: m.id_usuario,
        id_matricula: m.id_matricula,
        nombres: alumno ? alumno.nombres : '',
        apellidos: alumno ? alumno.apellidos : '',
        dni: alumno ? alumno.dni : '',
        asistencia: asistencia || null,
      }
    })
    .sort((a, b) => a.apellidos.localeCompare(b.apellidos))
}

export async function obtenerAnuncios(sesion) {
  await esperar()
  if (!sesion) return []
  const idsCiclos = ciclosAlcanzables(sesion)
  return db.anuncios
    .filter((a) => {
      if (sesion.rol !== 'superadmin' && a.estado !== 'publicado') return false
      return a.id_ciclo === '' || idsCiclos.includes(a.id_ciclo)
    })
    .map((a) => {
      const autor = buscarUsuario(a.id_autor)
      const ciclo = a.id_ciclo ? buscarCiclo(a.id_ciclo) : null
      return {
        ...a,
        autor_nombre: autor ? nombreCompleto(autor) : '',
        ciclo_nombre: ciclo ? ciclo.nombre : '',
      }
    })
    .sort((a, b) => {
      if (a.fijado !== b.fijado) return a.fijado === 'si' ? -1 : 1
      return b.fecha.localeCompare(a.fecha)
    })
}

/** Matriculas resueltas con alumno y ciclo. Estudiante: solo las suyas.
 *  Auxiliar y superadmin: todas (las necesitan para registrar pagos).
 *  Docente: ninguna. */
export async function obtenerMatriculas(sesion) {
  await esperar()
  if (!sesion || sesion.rol === 'docente') return []
  let filas = db.matriculas
  if (sesion.rol === 'estudiante') {
    filas = filas.filter((m) => m.id_usuario === sesion.id_usuario)
  }
  return filas
    .map((m) => {
      const alumno = buscarUsuario(m.id_usuario)
      const ciclo = buscarCiclo(m.id_ciclo)
      return {
        ...m,
        alumno_nombre: alumno ? nombreCompleto(alumno) : '(alumno no encontrado)',
        alumno_dni: alumno ? alumno.dni : '',
        ciclo_nombre: ciclo ? ciclo.nombre : '',
        n_mensualidades: ciclo ? ciclo.n_mensualidades : 0,
      }
    })
    .sort((a, b) => a.ciclo_nombre.localeCompare(b.ciclo_nombre) || a.alumno_nombre.localeCompare(b.alumno_nombre))
}

export async function obtenerUsuarios(sesion) {
  await esperar()
  if (sesion?.rol !== 'superadmin') return []
  return db.usuarios.map(({ clave_acceso: _omitida, ...u }) => u)
}

export async function obtenerConfig(sesion) {
  await esperar()
  if (sesion?.rol !== 'superadmin') return []
  return db.config
}

/** Catalogo global de cursos (no confundir con obtenerCursosDelUsuario, que
 *  devuelve ciclo_cursos resueltos segun el rol). Solo superadmin. */
export async function obtenerCursosCatalogo(sesion) {
  await esperar()
  if (sesion?.rol !== 'superadmin') return []
  return [...db.cursos].sort((a, b) => a.orden - b.orden)
}

// ---------------------------------------------------------------------------
// Escrituras (mutan el mock EN MEMORIA: los cambios se pierden al recargar.
// Rechazan explicitamente lo no permitido con { ok: false, error }.)
// ---------------------------------------------------------------------------

export async function registrarPago(sesion, datos) {
  await esperar()
  if (!sesion || sesion.rol === 'docente') return sinPermiso('registrar pagos')

  const matricula = db.matriculas.find((m) => m.id_matricula === datos.id_matricula)
  if (!matricula) return { ok: false, error: 'No se encontró la matrícula indicada.' }
  if (
    sesion.rol === 'estudiante' &&
    (matricula.id_usuario !== sesion.id_usuario || matricula.estado === 'retirado')
  ) {
    return { ok: false, error: 'Solo puedes reportar pagos de tu propia matrícula activa.' }
  }

  const ciclo = buscarCiclo(matricula.id_ciclo)
  const conceptosValidos = ['matricula', ...Array.from({ length: ciclo.n_mensualidades }, (_, i) => `mensualidad_${i + 1}`)]
  if (!conceptosValidos.includes(datos.concepto)) {
    return { ok: false, error: 'El concepto no corresponde a este ciclo.' }
  }
  const monto = Number(datos.monto)
  if (!Number.isFinite(monto) || monto <= 0) {
    return { ok: false, error: 'Ingresa un monto válido mayor que cero.' }
  }
  const mediosValidos = ['yape', 'plin', 'efectivo', 'transferencia']
  if (!mediosValidos.includes(datos.medio)) {
    return { ok: false, error: 'Elige un medio de pago válido.' }
  }

  const pago = {
    id_pago: siguienteIdDemo(db.pagos, 'id_pago', 'pag'),
    id_matricula: matricula.id_matricula,
    concepto: datos.concepto,
    monto,
    fecha_reporte: hoy(),
    fecha_verificacion: '',
    medio: datos.medio,
    estado: 'pendiente',
    voucher_ref: String(datos.voucher_ref ?? '').trim(),
    id_verificador: '',
  }
  db.pagos.push(pago)
  return { ok: true, pago }
}

export async function verificarPago(sesion, idPago, decision) {
  await esperar()
  // PENDIENTE: delegación no modelada, ver GUIA_FRONTEND.md sección 5.
  // La matriz dice que el auxiliar verifica "solo si superadmin delega", pero el
  // modelo no tiene campo para esa delegacion; por ahora se habilita al auxiliar.
  if (sesion?.rol !== 'superadmin' && sesion?.rol !== 'auxiliar') {
    return sinPermiso('verificar pagos')
  }
  if (decision !== 'verificado' && decision !== 'rechazado') {
    return { ok: false, error: 'Decisión inválida: usa "verificado" o "rechazado".' }
  }
  const pago = db.pagos.find((p) => p.id_pago === idPago)
  if (!pago) return { ok: false, error: 'No se encontró el pago.' }

  pago.estado = decision
  pago.fecha_verificacion = hoy()
  pago.id_verificador = sesion.id_usuario

  // Con la matricula pagada y verificada, la matricula pasa de preinscrito a
  // matriculado (flujo del estudiante, ROLES_Y_FLUJOS.md paso 3).
  if (decision === 'verificado' && pago.concepto === 'matricula') {
    const matricula = db.matriculas.find((m) => m.id_matricula === pago.id_matricula)
    if (matricula && matricula.estado === 'preinscrito') {
      matricula.estado = 'matriculado'
    }
  }
  return { ok: true, pago }
}

export async function guardarClase(sesion, datos) {
  await esperar()
  if (sesion?.rol !== 'superadmin' && sesion?.rol !== 'docente') {
    return sinPermiso('programar o editar clases')
  }
  if (sesion.rol === 'docente' && !puedeVerCicloCurso(sesion, datos.id_ciclo_curso)) {
    return { ok: false, error: 'Solo puedes gestionar clases de tus propios cursos.' }
  }
  if (!datos.fecha || !datos.hora_inicio || !datos.hora_fin || !String(datos.tema ?? '').trim()) {
    return { ok: false, error: 'Completa fecha, horas y tema de la clase.' }
  }
  if (!['presencial', 'virtual'].includes(datos.modalidad)) {
    return { ok: false, error: 'La modalidad debe ser "presencial" o "virtual".' }
  }
  if (!['programada', 'dictada', 'cancelada'].includes(datos.estado)) {
    return { ok: false, error: 'Estado de clase inválido.' }
  }

  if (datos.id_clase) {
    const clase = db.clases.find((c) => c.id_clase === datos.id_clase)
    if (!clase) return { ok: false, error: 'No se encontró la clase.' }
    Object.assign(clase, {
      fecha: datos.fecha,
      hora_inicio: datos.hora_inicio,
      hora_fin: datos.hora_fin,
      tema: String(datos.tema).trim(),
      modalidad: datos.modalidad,
      enlace_en_vivo: String(datos.enlace_en_vivo ?? '').trim(),
      estado: datos.estado,
    })
    return { ok: true, clase }
  }

  const clase = {
    id_clase: siguienteIdDemo(db.clases, 'id_clase', 'cls'),
    id_ciclo_curso: datos.id_ciclo_curso,
    fecha: datos.fecha,
    hora_inicio: datos.hora_inicio,
    hora_fin: datos.hora_fin,
    tema: String(datos.tema).trim(),
    modalidad: datos.modalidad,
    enlace_en_vivo: String(datos.enlace_en_vivo ?? '').trim(),
    estado: datos.estado,
  }
  db.clases.push(clase)
  return { ok: true, clase }
}

export async function guardarMaterial(sesion, datos) {
  await esperar()
  if (sesion?.rol !== 'superadmin' && sesion?.rol !== 'docente') {
    return sinPermiso('subir o editar materiales')
  }
  if (sesion.rol === 'docente' && !puedeVerCicloCurso(sesion, datos.id_ciclo_curso)) {
    return { ok: false, error: 'Solo puedes gestionar materiales de tus propios cursos.' }
  }
  const tiposValidos = ['video_grabado', 'pdf_teoria', 'pdf_practica', 'pdf_resolucion', 'enlace']
  if (!tiposValidos.includes(datos.tipo)) {
    return { ok: false, error: 'Tipo de material inválido.' }
  }
  if (!String(datos.titulo ?? '').trim() || !String(datos.url_drive ?? '').trim()) {
    return { ok: false, error: 'Completa el título y el enlace del material.' }
  }
  if (!['borrador', 'publicado'].includes(datos.estado)) {
    return { ok: false, error: 'Estado de material inválido.' }
  }

  // Regla de integridad 5: una resolucion solo puede apuntar a una practica
  // del MISMO id_ciclo_curso.
  let idMaterialPadre = ''
  if (datos.tipo === 'pdf_resolucion') {
    const padre = db.materiales.find((m) => m.id_material === datos.id_material_padre)
    if (!padre || padre.tipo !== 'pdf_practica' || padre.id_ciclo_curso !== datos.id_ciclo_curso) {
      return { ok: false, error: 'La resolución debe apuntar a una práctica del mismo curso.' }
    }
    idMaterialPadre = padre.id_material
  }

  if (datos.id_material) {
    const material = db.materiales.find((m) => m.id_material === datos.id_material)
    if (!material) return { ok: false, error: 'No se encontró el material.' }
    Object.assign(material, {
      tipo: datos.tipo,
      titulo: String(datos.titulo).trim(),
      semana: datos.semana === '' || datos.semana == null ? '' : Number(datos.semana),
      url_drive: String(datos.url_drive).trim(),
      id_material_padre: idMaterialPadre,
      estado: datos.estado,
    })
    return { ok: true, material }
  }

  const material = {
    id_material: siguienteIdDemo(db.materiales, 'id_material', 'mtl'),
    id_ciclo_curso: datos.id_ciclo_curso,
    id_clase: datos.id_clase || '',
    tipo: datos.tipo,
    titulo: String(datos.titulo).trim(),
    semana: datos.semana === '' || datos.semana == null ? '' : Number(datos.semana),
    url_drive: String(datos.url_drive).trim(),
    id_material_padre: idMaterialPadre,
    fecha_publicacion: hoy(),
    id_autor: sesion.id_usuario,
    estado: datos.estado,
  }
  db.materiales.push(material)
  return { ok: true, material }
}

/** Registra (o corrige) asistencia. Acepta un solo registro
 *  { id_clase, id_usuario, estado, observacion } o una lista pasada de una vez:
 *  { id_clase, registros: [{ id_usuario, estado, observacion }] }. */
export async function registrarAsistencia(sesion, datos) {
  await esperar()
  if (!sesion || sesion.rol === 'estudiante') return sinPermiso('registrar asistencia')

  const clase = db.clases.find((c) => c.id_clase === datos.id_clase)
  if (!clase) return { ok: false, error: 'No se encontró la clase.' }
  if (sesion.rol === 'docente' && !puedeVerCicloCurso(sesion, clase.id_ciclo_curso)) {
    return { ok: false, error: 'Solo puedes registrar asistencia de tus propias clases.' }
  }

  const registros = Array.isArray(datos.registros)
    ? datos.registros
    : [{ id_usuario: datos.id_usuario, estado: datos.estado, observacion: datos.observacion }]
  const estadosValidos = ['presente', 'tardanza', 'falta', 'justificado']

  for (const r of registros) {
    if (!estadosValidos.includes(r.estado)) {
      return { ok: false, error: 'Estado de asistencia inválido.' }
    }
    if (!buscarUsuario(r.id_usuario)) {
      return { ok: false, error: 'No se encontró al alumno.' }
    }
  }

  const guardadas = registros.map((r) => {
    const existente = db.asistencias.find(
      (a) => a.id_clase === clase.id_clase && a.id_usuario === r.id_usuario,
    )
    if (existente) {
      existente.estado = r.estado
      existente.observacion = String(r.observacion ?? '').trim()
      existente.id_registrador = sesion.id_usuario
      return existente
    }
    const nueva = {
      id_asistencia: siguienteIdDemo(db.asistencias, 'id_asistencia', 'asi'),
      id_clase: clase.id_clase,
      id_usuario: r.id_usuario,
      estado: r.estado,
      id_registrador: sesion.id_usuario,
      observacion: String(r.observacion ?? '').trim(),
    }
    db.asistencias.push(nueva)
    return nueva
  })
  return { ok: true, asistencias: guardadas }
}

export async function publicarAnuncio(sesion, datos) {
  await esperar()
  if (sesion?.rol !== 'superadmin' && sesion?.rol !== 'auxiliar') {
    return sinPermiso('publicar anuncios')
  }
  // El auxiliar publica solo anuncios POR CICLO; los globales son del superadmin.
  if (sesion.rol === 'auxiliar' && !datos.id_ciclo) {
    return { ok: false, error: 'Como auxiliar solo puedes publicar anuncios de un ciclo.' }
  }
  if (datos.id_ciclo && !buscarCiclo(datos.id_ciclo)) {
    return { ok: false, error: 'El ciclo indicado no existe.' }
  }
  if (!String(datos.titulo ?? '').trim() || !String(datos.cuerpo ?? '').trim()) {
    return { ok: false, error: 'Completa el título y el contenido del anuncio.' }
  }

  const anuncio = {
    id_anuncio: siguienteIdDemo(db.anuncios, 'id_anuncio', 'anu'),
    id_ciclo: datos.id_ciclo || '',
    titulo: String(datos.titulo).trim(),
    cuerpo: String(datos.cuerpo).trim(),
    fecha: hoy(),
    fijado: datos.fijado === 'si' ? 'si' : 'no',
    id_autor: sesion.id_usuario,
    estado: 'publicado',
  }
  db.anuncios.push(anuncio)
  return { ok: true, anuncio }
}

// --- Escrituras estructurales: solo superadmin -------------------------------

export async function guardarCiclo(sesion, datos) {
  await esperar()
  if (sesion?.rol !== 'superadmin') return sinPermiso('crear o editar ciclos')

  const estadosValidos = ['planificado', 'inscripciones_abiertas', 'en_curso', 'finalizado']
  if (!String(datos.nombre ?? '').trim()) return { ok: false, error: 'El ciclo necesita un nombre.' }
  if (!estadosValidos.includes(datos.estado)) return { ok: false, error: 'Estado de ciclo inválido.' }

  if (datos.id_ciclo) {
    const ciclo = buscarCiclo(datos.id_ciclo)
    if (!ciclo) return { ok: false, error: 'No se encontró el ciclo.' }
    Object.assign(ciclo, {
      nombre: String(datos.nombre).trim(),
      fecha_inicio: datos.fecha_inicio || ciclo.fecha_inicio,
      fecha_fin: datos.fecha_fin || ciclo.fecha_fin,
      estado: datos.estado,
    })
    return { ok: true, ciclo }
  }

  const ciclo = {
    id_ciclo: siguienteIdDemo(db.ciclos, 'id_ciclo', 'cic'),
    nombre: String(datos.nombre).trim(),
    anio: Number(datos.anio) || new Date().getFullYear(),
    fecha_inicio: datos.fecha_inicio || '',
    fecha_fin: datos.fecha_fin || '',
    estado: datos.estado,
    precio_matricula: Number(datos.precio_matricula) || 0,
    precio_mensualidad: Number(datos.precio_mensualidad) || 0,
    n_mensualidades: Number(datos.n_mensualidades) || 0,
    descripcion: String(datos.descripcion ?? '').trim(),
  }
  db.ciclos.push(ciclo)
  return { ok: true, ciclo }
}

export async function guardarCurso(sesion, datos) {
  await esperar()
  if (sesion?.rol !== 'superadmin') return sinPermiso('crear o editar cursos')
  if (!String(datos.nombre ?? '').trim()) return { ok: false, error: 'El curso necesita un nombre.' }

  if (datos.id_curso) {
    const curso = buscarCurso(datos.id_curso)
    if (!curso) return { ok: false, error: 'No se encontró el curso.' }
    curso.nombre = String(datos.nombre).trim()
    curso.descripcion = String(datos.descripcion ?? '').trim()
    return { ok: true, curso }
  }

  const curso = {
    id_curso: siguienteIdDemo(db.cursos, 'id_curso', 'cur'),
    nombre: String(datos.nombre).trim(),
    descripcion: String(datos.descripcion ?? '').trim(),
    orden: db.cursos.length + 1,
  }
  db.cursos.push(curso)
  return { ok: true, curso }
}

/** Crea un ciclo_curso o reasigna su docente. Es el "flujo estrella": asignar
 *  id_docente a un ciclo_curso hace que aparezca en el panel del docente. */
export async function guardarAsignacion(sesion, datos) {
  await esperar()
  if (sesion?.rol !== 'superadmin') return sinPermiso('gestionar asignaciones')

  if (datos.id_ciclo_curso) {
    const cc = buscarCicloCurso(datos.id_ciclo_curso)
    if (!cc) return { ok: false, error: 'No se encontró la asignación.' }
    if (datos.id_docente) {
      const docente = buscarUsuario(datos.id_docente)
      if (!docente || docente.rol !== 'docente') {
        return { ok: false, error: 'El usuario elegido no es docente.' }
      }
    }
    cc.id_docente = datos.id_docente || ''
    return { ok: true, ciclo_curso: cc }
  }

  if (!buscarCiclo(datos.id_ciclo)) return { ok: false, error: 'El ciclo indicado no existe.' }
  if (!buscarCurso(datos.id_curso)) return { ok: false, error: 'El curso indicado no existe.' }
  if (datos.id_docente) {
    const docente = buscarUsuario(datos.id_docente)
    if (!docente || docente.rol !== 'docente') {
      return { ok: false, error: 'El usuario elegido no es docente.' }
    }
  }
  const duplicada = db.ciclo_cursos.find(
    (cc) => cc.id_ciclo === datos.id_ciclo && cc.id_curso === datos.id_curso,
  )
  if (duplicada) return { ok: false, error: 'Ese curso ya está asignado en ese ciclo.' }

  const cc = {
    id_ciclo_curso: siguienteIdDemo(db.ciclo_cursos, 'id_ciclo_curso', 'cco'),
    id_ciclo: datos.id_ciclo,
    id_curso: datos.id_curso,
    id_docente: datos.id_docente || '',
    orden: db.ciclo_cursos.filter((x) => x.id_ciclo === datos.id_ciclo).length + 1,
  }
  db.ciclo_cursos.push(cc)
  return { ok: true, ciclo_curso: cc }
}

// ---------------------------------------------------------------------------
// Banqueo Guyton UNA Puno (practica de preguntas de opcion multiple).
// Lecturas del banco publicado + progreso EN MEMORIA por usuario y curso.
// El banco DEMO son preguntas inventadas de muestra (ver datos/mock.js).
// ---------------------------------------------------------------------------

/** Solo las preguntas publicadas se sirven al alumno (patron "fila publica"). */
function preguntasPublicadas() {
  return db.banqueo_preguntas.filter((p) => p.estado === 'publicado')
}

/** Baraja una copia del arreglo (Fisher–Yates). No muta el original. */
function barajar(filas) {
  const copia = [...filas]
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

/** Fila de progreso del usuario para un curso; la crea si aun no existe. */
function progresoDe(idUsuario, curso) {
  let fila = db.banqueo_progreso.find((p) => p.id_usuario === idUsuario && p.curso === curso)
  if (!fila) {
    fila = { id_usuario: idUsuario, curso, respondidas: 0, correctas: 0 }
    db.banqueo_progreso.push(fila)
  }
  return fila
}

/** Cursos con banco disponible: [{ curso, total }] (solo preguntas publicadas). */
export async function obtenerBanqueoCursos(sesion) {
  await esperar()
  if (!sesion) return []
  const conteo = new Map()
  for (const p of preguntasPublicadas()) {
    conteo.set(p.curso, (conteo.get(p.curso) ?? 0) + 1)
  }
  return [...conteo.entries()]
    .map(([curso, total]) => ({ curso, total }))
    .sort((a, b) => a.curso.localeCompare(b.curso))
}

/** Temas de un curso con su conteo: [{ tema, total }] (solo preguntas
 *  publicadas del curso). Alimenta el selector de tema antes de practicar. */
export async function obtenerBanqueoTemas(sesion, { curso } = {}) {
  await esperar()
  if (!sesion || !curso) return []
  const conteo = new Map()
  for (const p of preguntasPublicadas()) {
    if (p.curso !== curso) continue
    const tema = p.tema || '(sin tema)'
    conteo.set(tema, (conteo.get(tema) ?? 0) + 1)
  }
  return [...conteo.entries()]
    .map(([tema, total]) => ({ tema, total }))
    .sort((a, b) => a.tema.localeCompare(b.tema))
}

/** Preguntas publicadas de un curso (opcionalmente de un tema), hasta 'limite'.
 *  Cuando hay 'limite', las preguntas se barajan antes de recortar para que
 *  cada tanda sea distinta (Fisher–Yates sobre una copia, no muta el banco). */
export async function obtenerBanqueoPreguntas(sesion, { curso, tema, limite } = {}) {
  await esperar()
  if (!sesion || !curso) return []
  let filas = preguntasPublicadas().filter((p) => p.curso === curso)
  if (tema) filas = filas.filter((p) => p.tema === tema)
  if (limite != null && Number.isFinite(Number(limite))) {
    filas = barajar(filas).slice(0, Number(limite))
  }
  // Se devuelve una copia para que la UI no mute el banco del mock.
  return filas.map((p) => ({
    id_pregunta: p.id_pregunta,
    curso: p.curso,
    tema: p.tema,
    subtema: p.subtema,
    enunciado: p.enunciado,
    opciones: [...p.opciones],
    correcta: p.correcta,
    justificacion: p.justificacion,
    fuente: p.fuente ?? '',
    imagen_url: p.imagen_url ?? '',
  }))
}

/** Registra una respuesta (acertada o no) y devuelve el progreso actualizado. */
export async function registrarRespuestaBanqueo(sesion, { curso, correcta_bool } = {}) {
  await esperar()
  if (!sesion) return sinPermiso('practicar el banqueo')
  if (!curso) return { ok: false, error: 'Falta indicar el curso de la pregunta.' }

  const fila = progresoDe(sesion.id_usuario, curso)
  fila.respondidas += 1
  if (correcta_bool) fila.correctas += 1
  const porcentaje = fila.respondidas ? Math.round((fila.correctas / fila.respondidas) * 100) : 0
  return { ok: true, progreso: { curso, respondidas: fila.respondidas, correctas: fila.correctas, porcentaje } }
}

/** Progreso del usuario por curso: [{ curso, respondidas, correctas, porcentaje }]. */
export async function obtenerBanqueoProgreso(sesion) {
  await esperar()
  if (!sesion) return []
  return db.banqueo_progreso
    .filter((p) => p.id_usuario === sesion.id_usuario)
    .map((p) => ({
      curso: p.curso,
      respondidas: p.respondidas,
      correctas: p.correctas,
      porcentaje: p.respondidas ? Math.round((p.correctas / p.respondidas) * 100) : 0,
    }))
}

/** Reasigna rol o estado de cuenta de un usuario. Solo superadmin. */
export async function guardarUsuario(sesion, datos) {
  await esperar()
  if (sesion?.rol !== 'superadmin') return sinPermiso('editar usuarios')

  const usuario = buscarUsuario(datos.id_usuario)
  if (!usuario) return { ok: false, error: 'No se encontró al usuario.' }
  const rolesValidos = ['superadmin', 'docente', 'auxiliar', 'estudiante']
  if (!rolesValidos.includes(datos.rol)) return { ok: false, error: 'Rol inválido.' }
  if (!['activo', 'inactivo'].includes(datos.estado)) return { ok: false, error: 'Estado inválido.' }
  if (usuario.id_usuario === sesion.id_usuario && (datos.rol !== 'superadmin' || datos.estado !== 'activo')) {
    return { ok: false, error: 'No puedes quitarte a ti mismo el rol ni desactivar tu propia cuenta.' }
  }

  usuario.rol = datos.rol
  usuario.estado = datos.estado
  const { clave_acceso: _omitida, ...publico } = usuario
  return { ok: true, usuario: publico }
}

/** Crea un usuario a mano (mock). Solo superadmin; DNI único; clave = DNI si no se da. */
export async function crearUsuario(sesion, datos) {
  await esperar()
  if (sesion?.rol !== 'superadmin') return sinPermiso('crear usuarios')
  const dni = String(datos.dni ?? '').trim()
  const nombres = String(datos.nombres ?? '').trim()
  const rolesValidos = ['superadmin', 'docente', 'auxiliar', 'estudiante']
  if (!dni) return { ok: false, error: 'El usuario necesita un DNI.' }
  if (!nombres) return { ok: false, error: 'El usuario necesita al menos un nombre.' }
  if (!rolesValidos.includes(datos.rol)) return { ok: false, error: 'Rol inválido.' }
  if (db.usuarios.some((u) => String(u.dni).trim() === dni)) {
    return { ok: false, error: `Ya existe un usuario con el DNI ${dni}.` }
  }
  const clave = String(datos.clave_acceso ?? '').trim() || dni
  const nuevo = {
    id_usuario: siguienteIdDemo(db.usuarios, 'id_usuario', 'usr'),
    dni, nombres, apellidos: String(datos.apellidos ?? '').trim(),
    celular: String(datos.celular ?? '').trim(), email: String(datos.email ?? '').trim(),
    rol: datos.rol, clave_acceso: clave, foto_url: '', estado: 'activo', fecha_registro: hoy(),
  }
  db.usuarios.push(nuevo)
  const { clave_acceso: _o, ...publico } = nuevo
  return { ok: true, usuario: publico, clave_inicial: clave }
}

/** Asigna en bloque una lista de cursos a un ciclo (mock). */
export async function asignarCursosACiclo(sesion, datos) {
  await esperar()
  if (sesion?.rol !== 'superadmin') return sinPermiso('gestionar asignaciones')
  if (!buscarCiclo(datos.id_ciclo)) return { ok: false, error: 'El ciclo indicado no existe.' }
  const ids = Array.isArray(datos.id_cursos) ? datos.id_cursos : []
  const yaEnCiclo = new Set(db.ciclo_cursos.filter((x) => x.id_ciclo === datos.id_ciclo).map((x) => x.id_curso))
  let orden = db.ciclo_cursos.filter((x) => x.id_ciclo === datos.id_ciclo).length
  let creados = 0
  for (const idCurso of ids) {
    if (yaEnCiclo.has(idCurso) || !buscarCurso(idCurso)) continue
    orden += 1
    db.ciclo_cursos.push({
      id_ciclo_curso: siguienteIdDemo(db.ciclo_cursos, 'id_ciclo_curso', 'cco'),
      id_ciclo: datos.id_ciclo, id_curso: idCurso, id_docente: '', orden,
    })
    yaEnCiclo.add(idCurso)
    creados += 1
  }
  return { ok: true, creados }
}

/** Ranking del banqueo (mock): agrega banqueo_progreso de todos los usuarios. */
export async function obtenerBanqueoRanking(sesion) {
  await esperar()
  if (!sesion) return { ranking: [], yo: null, total: 0 }
  const porUsuario = {}
  for (const p of db.banqueo_progreso ?? []) {
    const id = p.id_usuario
    if (!porUsuario[id]) porUsuario[id] = { id_usuario: id, respondidas: 0, correctas: 0 }
    porUsuario[id].respondidas += p.respondidas
    porUsuario[id].correctas += p.correctas
  }
  const corto = (u) => {
    if (!u) return 'Estudiante'
    const n = String(u.nombres ?? '').trim().split(/\s+/)[0] || 'Estudiante'
    const a = String(u.apellidos ?? '').trim()
    return a ? `${n} ${a.charAt(0).toUpperCase()}.` : n
  }
  const lista = Object.values(porUsuario).map((r) => ({
    id_usuario: r.id_usuario, nombre: corto(buscarUsuario(r.id_usuario)),
    respondidas: r.respondidas, correctas: r.correctas,
    porcentaje: r.respondidas ? Math.round((r.correctas / r.respondidas) * 100) : 0,
  }))
  lista.sort((a, b) => b.correctas - a.correctas || b.porcentaje - a.porcentaje)
  lista.forEach((x, i) => { x.puesto = i + 1 })
  const yo = lista.find((x) => x.id_usuario === sesion.id_usuario) || null
  return { ranking: lista.slice(0, 20), yo, total: lista.length }
}

// --- Simulacros (mock) ------------------------------------------------------

let simulacroInfo = { pdf_url: '', titulo: '', fecha: '' }

export async function obtenerSimulacros(sesion) {
  await esperar()
  if (!sesion) return { info: simulacroInfo, areas: [], config: {}, mis: [], ranking: [], yo: null, total: 0 }
  const cfg = db.simulacro_config ?? []
  const porArea = {}
  for (const r of cfg) {
    const area = String(r.area).trim()
    if (!area) continue
    ;(porArea[area] ||= []).push({
      curso: String(r.curso).trim(), preguntas: Number(r.preguntas) || 0,
      puntos_pregunta: Number(r.puntos_pregunta) || 0, ponderacion: Number(r.ponderacion) || 0,
    })
  }
  const sims = db.simulacros ?? []
  const mis = sims.filter((s) => s.id_usuario === sesion.id_usuario)
  const mejor = {}
  for (const s of sims) {
    const id = s.id_usuario || s.dni
    if (!mejor[id] || Number(s.puntaje) > Number(mejor[id].puntaje)) {
      mejor[id] = { id_usuario: s.id_usuario, dni: s.dni, nombre: s.nombre, area: s.area, puntaje: Number(s.puntaje) || 0, porcentaje: Number(s.porcentaje) || 0 }
    }
  }
  const ranking = Object.values(mejor).sort((a, b) => b.puntaje - a.puntaje)
  ranking.forEach((x, i) => { x.puesto = i + 1 })
  return {
    info: simulacroInfo, areas: Object.keys(porArea).sort(), config: porArea, mis,
    ranking: ranking.slice(0, 20), yo: ranking.find((x) => x.id_usuario === sesion.id_usuario) || null, total: ranking.length,
  }
}

export async function registrarSimulacro(sesion, datos) {
  await esperar()
  if (!sesion) return sinPermiso('registrar un simulacro')
  const area = String(datos.area ?? '').trim()
  if (!area) return { ok: false, error: 'Elige tu área.' }
  const pesos = (db.simulacro_config ?? []).filter((r) => String(r.area).trim() === area)
  if (pesos.length === 0) return { ok: false, error: `El área "${area}" no está configurada en el prospecto.` }
  const reportado = {}
  for (const r of datos.respuestas ?? []) reportado[String(r.curso).trim()] = Number(r.aciertos) || 0
  let puntaje = 0, puntajeMax = 0, correctas = 0, total = 0
  const detalle = pesos.map((p) => {
    const curso = String(p.curso).trim()
    const preguntas = Number(p.preguntas) || 0, puntos = Number(p.puntos_pregunta) || 0, pond = Number(p.ponderacion) || 0
    const ac = Math.max(0, Math.min(reportado[curso] || 0, preguntas))
    const pMax = preguntas * puntos * pond, pObt = ac * puntos * pond
    puntaje += pObt; puntajeMax += pMax; correctas += ac; total += preguntas
    return { curso, aciertos: ac, preguntas, puntaje: Math.round(pObt * 100) / 100, puntaje_max: Math.round(pMax * 100) / 100 }
  })
  puntaje = Math.round(puntaje * 100) / 100; puntajeMax = Math.round(puntajeMax * 100) / 100
  const porcentaje = puntajeMax > 0 ? Math.round((puntaje / puntajeMax) * 100) : 0
  const fila = {
    id_simulacro: siguienteIdDemo(db.simulacros ?? [], 'id_simulacro', 'sim'),
    id_usuario: sesion.id_usuario, dni: String(datos.dni ?? sesion.dni ?? '').trim(),
    nombre: String(datos.nombre ?? nombreCompleto(sesion)).trim(), area, fecha: hoy(),
    puntaje, puntaje_max: puntajeMax, correctas, total, porcentaje, detalle: JSON.stringify(detalle),
  }
  ;(db.simulacros ||= []).push(fila)
  return { ok: true, resultado: { ...fila, detalle } }
}

export async function guardarSimulacroPdf(sesion, datos) {
  await esperar()
  if (sesion?.rol !== 'superadmin') return sinPermiso('publicar el simulacro')
  const url = String(datos.pdf_url ?? '').trim() || (datos.pdf_base64 ? 'demo://pdf-subido' : '')
  if (!url) return { ok: false, error: 'Sube un PDF o pega el enlace del PDF del simulacro.' }
  simulacroInfo = { pdf_url: url, titulo: String(datos.titulo ?? '').trim() || 'Simulacro', fecha: hoy() }
  return { ok: true, ...simulacroInfo }
}
