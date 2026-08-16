// ==========================================================================
// ACADEMIA GUYTON — Backend Fase 2 (Web App de Google Apps Script)
// --------------------------------------------------------------------------
// Implementa EXACTAMENTE el contrato de web/src/api/cliente.js contra el
// spreadsheet "BD Guyton" (12 hojas, ver docs/MODELO_DATOS.md). Cada funcion
// exportada de cliente.js tiene aqui su accion homonima en el router, con la
// misma logica de permisos, filtros, validaciones y formas de respuesta.
//
// DESPLIEGUE (hacerlo una sola vez y repetir el paso 4 tras CADA cambio):
//   1. Abrir el spreadsheet "BD Guyton" en Google Sheets.
//   2. Menu Extensiones > Apps Script. Pegar TODO este archivo en el editor
//      (reemplazando el contenido por defecto) y guardar.
//   3. Implementar > Nueva implementacion > tipo "Aplicacion web":
//        - Ejecutar como: "Yo" (la cuenta duena del Sheet).
//        - Quien tiene acceso: "Cualquier usuario".
//      Es necesario "Cualquier usuario" porque el frontend hara fetch() sin
//      login de Google; la barrera de seguridad es el PIN propio del sistema
//      (dni + clave_acceso), no la sesion de Google.
//   4. IMPORTANTE: tras cada cambio en el codigo hay que crear una NUEVA
//      version de la implementacion (Implementar > Administrar
//      implementaciones > editar > Version: nueva). Si no, el Web App sigue
//      sirviendo el codigo antiguo.
//   5. Copiar la URL del Web App (termina en /exec) y configurarla en el
//      frontend como VITE_API_URL (ver apps-script/README.md).
//
// NOTA CORS: el frontend debe enviar los POST con header
//   Content-Type: text/plain
// (NO application/json). Apps Script no soporta el preflight OPTIONS que el
// navegador dispara con application/json; con text/plain el fetch es "simple"
// y llega directo. El cuerpo sigue siendo un string JSON que aqui se parsea.
//
// CONTRATO HTTP:
//   GET  <url>?accion=Nombre&sesion=<json>&<param>=<valor>
//   POST <url>  body: { "accion": Nombre, "sesion": {...}, "datos": {...}, ... }
//   - Lecturas: devuelven el ARRAY ya filtrado por rol (como cliente.js).
//     Ante sesion invalida devuelven { ok: false, error } (el mock nunca
//     falla en lecturas porque confia en la sesion local; aqui se revalida).
//   - iniciarSesion: { ok: true, usuario } (sin clave_acceso) o
//     { ok: false, error } con los mismos mensajes en espanol del mock.
//   - Escrituras: { ok: true, ... } o { ok: false, error: 'mensaje en
//     espanol' }. Nunca se lanzan excepciones al cliente (try/catch global).
//
// SEGURIDAD (limitacion documentada del MVP): no hay tokens ni JWT. La
// sesion es el objeto usuario (sin clave_acceso) que el frontend guarda en
// sessionStorage y reenvia en cada request. El servidor REVALIDA en cada
// accion que el id_usuario existe en la hoja usuarios y que su rol y estado
// coinciden con la hoja (y que la cuenta sigue 'activa'), pero un atacante
// que conozca el id_usuario/rol/estado de otro usuario podria suplantarlo.
// Aceptable para el MVP aula virtual; endurecer (token firmado con caducidad)
// es trabajo de una fase posterior.
// ==========================================================================

var SPREADSHEET_ID = '1dHhkddgu42-c4tVWxdd55kz1wyMeEvhI7gYuyFc--y8';

// ---------------------------------------------------------------------------
// Esquema de hojas: nombre, campo id y tipo de cada columna.
// Tipos: 'texto' | 'fecha' ('YYYY-MM-DD') | 'hora' ('HH:MM') | 'numero'.
// Los headers se referencian LITERALMENTE (docs/MODELO_DATOS.md).
// ---------------------------------------------------------------------------
var ESQUEMAS = {
  config: {
    hoja: 'config',
    columnas: { clave: 'texto', valor: 'texto', descripcion: 'texto' },
  },
  usuarios: {
    hoja: 'usuarios', id: 'id_usuario', prefijo: 'usr',
    columnas: {
      id_usuario: 'texto', dni: 'texto', nombres: 'texto', apellidos: 'texto',
      celular: 'texto', email: 'texto', rol: 'texto', clave_acceso: 'texto',
      foto_url: 'texto', estado: 'texto', fecha_registro: 'fecha',
    },
  },
  ciclos: {
    hoja: 'ciclos', id: 'id_ciclo', prefijo: 'cic',
    columnas: {
      id_ciclo: 'texto', nombre: 'texto', anio: 'numero', fecha_inicio: 'fecha',
      fecha_fin: 'fecha', estado: 'texto', precio_matricula: 'numero',
      precio_mensualidad: 'numero', n_mensualidades: 'numero', descripcion: 'texto',
    },
  },
  cursos: {
    hoja: 'cursos', id: 'id_curso', prefijo: 'cur',
    columnas: { id_curso: 'texto', nombre: 'texto', descripcion: 'texto', orden: 'numero' },
  },
  ciclo_cursos: {
    hoja: 'ciclo_cursos', id: 'id_ciclo_curso', prefijo: 'cco',
    columnas: {
      id_ciclo_curso: 'texto', id_ciclo: 'texto', id_curso: 'texto',
      id_docente: 'texto', orden: 'numero',
    },
  },
  matriculas: {
    hoja: 'matriculas', id: 'id_matricula', prefijo: 'mat',
    columnas: {
      id_matricula: 'texto', id_usuario: 'texto', id_ciclo: 'texto', fecha: 'fecha',
      estado: 'texto', turno: 'texto', observaciones: 'texto',
    },
  },
  pagos: {
    hoja: 'pagos', id: 'id_pago', prefijo: 'pag',
    columnas: {
      id_pago: 'texto', id_matricula: 'texto', concepto: 'texto', monto: 'numero',
      fecha_reporte: 'fecha', fecha_verificacion: 'fecha', medio: 'texto',
      estado: 'texto', voucher_ref: 'texto', id_verificador: 'texto',
    },
  },
  horario: {
    hoja: 'horario', id: 'id_horario', prefijo: 'hor',
    columnas: {
      id_horario: 'texto', id_ciclo_curso: 'texto', dia_semana: 'texto',
      hora_inicio: 'hora', hora_fin: 'hora', aula_o_enlace: 'texto',
    },
  },
  clases: {
    hoja: 'clases', id: 'id_clase', prefijo: 'cls',
    columnas: {
      id_clase: 'texto', id_ciclo_curso: 'texto', fecha: 'fecha',
      hora_inicio: 'hora', hora_fin: 'hora', tema: 'texto', modalidad: 'texto',
      enlace_en_vivo: 'texto', estado: 'texto',
    },
  },
  materiales: {
    hoja: 'materiales', id: 'id_material', prefijo: 'mtl',
    columnas: {
      id_material: 'texto', id_ciclo_curso: 'texto', id_clase: 'texto',
      tipo: 'texto', titulo: 'texto', semana: 'numero', url_drive: 'texto',
      id_material_padre: 'texto', fecha_publicacion: 'fecha', id_autor: 'texto',
      estado: 'texto',
    },
  },
  asistencias: {
    hoja: 'asistencias', id: 'id_asistencia', prefijo: 'asi',
    columnas: {
      id_asistencia: 'texto', id_clase: 'texto', id_usuario: 'texto',
      estado: 'texto', id_registrador: 'texto', observacion: 'texto',
    },
  },
  anuncios: {
    hoja: 'anuncios', id: 'id_anuncio', prefijo: 'anu',
    columnas: {
      id_anuncio: 'texto', id_ciclo: 'texto', titulo: 'texto', cuerpo: 'texto',
      fecha: 'fecha', fijado: 'texto', id_autor: 'texto', estado: 'texto',
    },
  },
};

// ---------------------------------------------------------------------------
// Router HTTP
// ---------------------------------------------------------------------------

// Cada entrada: { fn, publica?, escritura? }. Las lecturas aceptan GET y POST;
// las escrituras e iniciarSesion deberian llegar por POST (no se fuerza).
var ACCIONES = {
  // Sesion
  iniciarSesion: { fn: accIniciarSesion, publica: true },
  // Lecturas
  obtenerCiclosDelUsuario: { fn: accObtenerCiclosDelUsuario },
  obtenerCursosDelUsuario: { fn: accObtenerCursosDelUsuario },
  obtenerHorario: { fn: accObtenerHorario },
  obtenerClases: { fn: accObtenerClases },
  obtenerMateriales: { fn: accObtenerMateriales },
  obtenerPagos: { fn: accObtenerPagos },
  obtenerAsistencias: { fn: accObtenerAsistencias },
  obtenerRosterDeClase: { fn: accObtenerRosterDeClase },
  obtenerAnuncios: { fn: accObtenerAnuncios },
  obtenerMatriculas: { fn: accObtenerMatriculas },
  obtenerUsuarios: { fn: accObtenerUsuarios },
  obtenerConfig: { fn: accObtenerConfig },
  obtenerCursosCatalogo: { fn: accObtenerCursosCatalogo },
  // Escrituras
  registrarPago: { fn: accRegistrarPago, escritura: true },
  verificarPago: { fn: accVerificarPago, escritura: true },
  guardarClase: { fn: accGuardarClase, escritura: true },
  guardarMaterial: { fn: accGuardarMaterial, escritura: true },
  registrarAsistencia: { fn: accRegistrarAsistencia, escritura: true },
  publicarAnuncio: { fn: accPublicarAnuncio, escritura: true },
  guardarCiclo: { fn: accGuardarCiclo, escritura: true },
  guardarCurso: { fn: accGuardarCurso, escritura: true },
  guardarAsignacion: { fn: accGuardarAsignacion, escritura: true },
  guardarUsuario: { fn: accGuardarUsuario, escritura: true },
  // Banqueo (banco de preguntas de practica; hojas de CARGA DIFERIDA, ver seccion Banqueo)
  obtenerBanqueoCursos: { fn: accObtenerBanqueoCursos },
  obtenerBanqueoTemas: { fn: accObtenerBanqueoTemas },
  obtenerBanqueoPreguntas: { fn: accObtenerBanqueoPreguntas },
  obtenerBanqueoProgreso: { fn: accObtenerBanqueoProgreso },
  registrarRespuestaBanqueo: { fn: accRegistrarRespuestaBanqueo, escritura: true },
};

function doGet(e) {
  return manejar(e && e.parameter ? e.parameter : {});
}

function doPost(e) {
  var cuerpo = {};
  if (e && e.postData && e.postData.contents) {
    try {
      cuerpo = JSON.parse(e.postData.contents);
    } catch (err) {
      return responder({ ok: false, error: 'El cuerpo de la petición no es JSON válido.' });
    }
  }
  return manejar(cuerpo);
}

function responder(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

function manejar(params) {
  var lock = null;
  try {
    var accion = String(params.accion || '').trim();
    var def = ACCIONES[accion];
    if (!def) {
      return responder({ ok: false, error: 'Acción desconocida: ' + (accion || '(vacía)') + '.' });
    }

    // Los parametros estructurados pueden llegar como string JSON (tipico en GET).
    ['sesion', 'datos', 'filtros'].forEach(function (campo) {
      if (typeof params[campo] === 'string' && /^[{[]/.test(params[campo].trim())) {
        try { params[campo] = JSON.parse(params[campo]); } catch (err) { /* se deja como string */ }
      }
    });

    var bd = cargarBd();

    var sesion = null;
    if (!def.publica) {
      sesion = revalidarSesion(bd, params.sesion);
      if (!sesion) {
        return responder({ ok: false, error: 'Sesión inválida o caducada. Vuelve a iniciar sesión.' });
      }
    }

    // Las escrituras toman un lock para que dos requests concurrentes no
    // generen el mismo id correlativo ni pisen filas.
    if (def.escritura) {
      lock = LockService.getScriptLock();
      lock.waitLock(25000);
    }

    return responder(def.fn(bd, sesion, params));
  } catch (err) {
    Logger.log('Error en accion "%s": %s\n%s', params && params.accion, err, err && err.stack);
    return responder({ ok: false, error: 'Error interno del servidor. Inténtalo de nuevo.' });
  } finally {
    if (lock) {
      try { lock.releaseLock(); } catch (err) { /* ya liberado */ }
    }
  }
}

/** Revalida la sesion contra la hoja usuarios: el id debe existir y su rol y
 *  estado deben coincidir con la hoja (y la cuenta debe seguir activa).
 *  Devuelve el usuario FRESCO de la hoja (sin clave_acceso) como sesion. */
function revalidarSesion(bd, sesionCruda) {
  if (!sesionCruda || typeof sesionCruda !== 'object') return null;
  var usuario = buscarUsuario(bd, sesionCruda.id_usuario);
  if (!usuario) return null;
  if (usuario.rol !== sesionCruda.rol || usuario.estado !== sesionCruda.estado) return null;
  if (usuario.estado !== 'activo') return null;
  return sinClave(usuario);
}

// ---------------------------------------------------------------------------
// Capa de datos: lectura/normalizacion de hojas y escritura por headers
// ---------------------------------------------------------------------------

/** Lee las 12 hojas una vez por ejecucion y construye:
 *  - bd.d.<tabla>: array plano de objetos (misma forma que el mock).
 *  - bd.t.<tabla>: { hoja, headers, col, filas: [{ datos, rowNum }], porId }. */
function cargarBd() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone();
  var bd = { t: {}, d: {}, tz: tz };
  Object.keys(ESQUEMAS).forEach(function (nombre) {
    var esquema = ESQUEMAS[nombre];
    var hoja = ss.getSheetByName(esquema.hoja);
    if (!hoja) throw new Error('No existe la hoja "' + esquema.hoja + '" en el spreadsheet.');
    var valores = hoja.getDataRange().getValues();
    var headers = valores.length ? valores[0].map(function (h) { return String(h).trim(); }) : [];
    var col = {};
    headers.forEach(function (h, i) { col[h] = i; });
    Object.keys(esquema.columnas).forEach(function (c) {
      if (!(c in col)) throw new Error('La hoja "' + esquema.hoja + '" no tiene la columna "' + c + '".');
    });
    var tabla = { hoja: hoja, headers: headers, col: col, filas: [], porId: {}, esquema: esquema };
    for (var i = 1; i < valores.length; i++) {
      var filaCruda = valores[i];
      var vacia = filaCruda.every(function (v) { return v === '' || v === null; });
      if (vacia) continue;
      var datos = {};
      headers.forEach(function (h, j) {
        datos[h] = normalizar(filaCruda[j], esquema.columnas[h] || 'texto', tz);
      });
      var ref = { datos: datos, rowNum: i + 1 };
      tabla.filas.push(ref);
      if (esquema.id && datos[esquema.id] !== '') tabla.porId[datos[esquema.id]] = ref;
    }
    bd.t[nombre] = tabla;
    bd.d[nombre] = tabla.filas.map(function (f) { return f.datos; });
  });
  return bd;
}

/** Normaliza una celda al tipo del modelo: fechas y horas a string (con la
 *  zona horaria DEL SPREADSHEET para no desfasar), numeros a Number, y celdas
 *  vacias a '' (nunca null), igual que en el mock. */
function normalizar(valor, tipo, tz) {
  if (valor === null || valor === undefined || valor === '') return '';
  if (tipo === 'fecha' || tipo === 'hora') {
    if (Object.prototype.toString.call(valor) === '[object Date]') {
      if (isNaN(valor.getTime())) return '';
      return Utilities.formatDate(valor, tz, tipo === 'fecha' ? 'yyyy-MM-dd' : 'HH:mm');
    }
    return String(valor).trim();
  }
  if (tipo === 'numero') {
    var n = Number(valor);
    return isFinite(n) ? n : '';
  }
  return String(valor).trim();
}

function buscarRef(bd, tabla, id) {
  var t = bd.t[tabla];
  return (id !== undefined && id !== null && t.porId[id]) || null;
}

function buscarFila(bd, tabla, id) {
  var ref = buscarRef(bd, tabla, id);
  return ref ? ref.datos : null;
}

/** Actualiza solo las columnas indicadas, localizadas por HEADER (nunca por
 *  indice hardcodeado). Mantiene sincronizada la copia en memoria. */
function actualizarFila(bd, tabla, id, campos) {
  var t = bd.t[tabla];
  var ref = buscarRef(bd, tabla, id);
  if (!ref) throw new Error('No se encontró la fila con id ' + id + ' en ' + tabla + '.');
  Object.keys(campos).forEach(function (campo) {
    if (!(campo in t.col)) throw new Error('Columna desconocida "' + campo + '" en hoja ' + t.esquema.hoja + '.');
    t.hoja.getRange(ref.rowNum, t.col[campo] + 1).setValue(campos[campo]);
    ref.datos[campo] = campos[campo];
  });
  return ref.datos;
}

/** Agrega una fila nueva con appendRow respetando el ORDEN DE HEADERS.
 *  Mantiene sincronizadas las estructuras en memoria. */
function agregarFila(bd, tabla, objeto) {
  var t = bd.t[tabla];
  var datos = {};
  t.headers.forEach(function (h) {
    datos[h] = objeto[h] !== undefined && objeto[h] !== null ? objeto[h] : '';
  });
  t.hoja.appendRow(t.headers.map(function (h) { return datos[h]; }));
  var ref = { datos: datos, rowNum: t.hoja.getLastRow() };
  t.filas.push(ref);
  if (t.esquema.id && datos[t.esquema.id] !== '') t.porId[datos[t.esquema.id]] = ref;
  return datos;
}

/** Siguiente id correlativo: prefijo-NNN (3 digitos). Soporta los ids DEMO
 *  existentes (prefijo-demo-N): toma el maximo entre ambos formatos, asi los
 *  ids reales nunca colisionan con los demo. Los ids nunca se reutilizan. */
function siguienteId(bd, tabla) {
  var t = bd.t[tabla];
  var prefijo = t.esquema.prefijo;
  var campoId = t.esquema.id;
  var reReal = new RegExp('^' + prefijo + '-(\\d+)$');
  var reDemo = new RegExp('^' + prefijo + '-demo-(\\d+)$');
  var max = bd.d[tabla].reduce(function (acc, fila) {
    var m = reReal.exec(fila[campoId]) || reDemo.exec(fila[campoId]);
    return m ? Math.max(acc, Number(m[1])) : acc;
  }, 0);
  var correlativo = String(max + 1);
  while (correlativo.length < 3) correlativo = '0' + correlativo;
  return prefijo + '-' + correlativo;
}

/** 'YYYY-MM-DD' de hoy en la zona horaria del spreadsheet. */
function hoy(bd) {
  return Utilities.formatDate(new Date(), bd.tz, 'yyyy-MM-dd');
}

// ---------------------------------------------------------------------------
// Utilidades de negocio (espejo de las de cliente.js)
// ---------------------------------------------------------------------------

function buscarUsuario(bd, idUsuario) { return buscarFila(bd, 'usuarios', idUsuario); }
function buscarCiclo(bd, idCiclo) { return buscarFila(bd, 'ciclos', idCiclo); }
function buscarCurso(bd, idCurso) { return buscarFila(bd, 'cursos', idCurso); }
function buscarCicloCurso(bd, idCicloCurso) { return buscarFila(bd, 'ciclo_cursos', idCicloCurso); }

function nombreCompleto(usuario) {
  return usuario ? usuario.nombres + ' ' + usuario.apellidos : '';
}

function sinClave(usuario) {
  var copia = {};
  Object.keys(usuario).forEach(function (k) { if (k !== 'clave_acceso') copia[k] = usuario[k]; });
  return copia;
}

/** Ids de ciclo donde el estudiante tiene matricula con estado 'matriculado'. */
function ciclosMatriculadosDe(bd, idUsuario) {
  return bd.d.matriculas
    .filter(function (m) { return m.id_usuario === idUsuario && m.estado === 'matriculado'; })
    .map(function (m) { return m.id_ciclo; });
}

/** ciclo_cursos visibles segun el rol (la regla base de la matriz de permisos). */
function cicloCursosVisibles(bd, sesion) {
  if (!sesion) return [];
  switch (sesion.rol) {
    case 'superadmin':
    case 'auxiliar':
      return bd.d.ciclo_cursos;
    case 'docente':
      return bd.d.ciclo_cursos.filter(function (cc) { return cc.id_docente === sesion.id_usuario; });
    case 'estudiante': {
      var ciclos = ciclosMatriculadosDe(bd, sesion.id_usuario);
      return bd.d.ciclo_cursos.filter(function (cc) { return ciclos.indexOf(cc.id_ciclo) !== -1; });
    }
    default:
      return [];
  }
}

function puedeVerCicloCurso(bd, sesion, idCicloCurso) {
  return cicloCursosVisibles(bd, sesion).some(function (cc) { return cc.id_ciclo_curso === idCicloCurso; });
}

/** Ids de ciclo "alcanzables" por el usuario (para anuncios por ciclo). */
function ciclosAlcanzables(bd, sesion) {
  if (!sesion) return [];
  if (sesion.rol === 'superadmin' || sesion.rol === 'auxiliar') {
    return bd.d.ciclos.map(function (c) { return c.id_ciclo; });
  }
  var vistos = {};
  cicloCursosVisibles(bd, sesion).forEach(function (cc) { vistos[cc.id_ciclo] = true; });
  return Object.keys(vistos);
}

/** Resuelve un ciclo_curso con los nombres de curso, docente y ciclo. */
function resolverCicloCurso(bd, cc) {
  var curso = buscarCurso(bd, cc.id_curso);
  var docente = cc.id_docente ? buscarUsuario(bd, cc.id_docente) : null;
  var ciclo = buscarCiclo(bd, cc.id_ciclo);
  var resuelto = {};
  Object.keys(cc).forEach(function (k) { resuelto[k] = cc[k]; });
  resuelto.curso_nombre = curso ? curso.nombre : '(curso no encontrado)';
  resuelto.docente_nombre = docente ? nombreCompleto(docente) : '';
  resuelto.ciclo_nombre = ciclo ? ciclo.nombre : '';
  return resuelto;
}

function sinPermiso(accion) {
  return { ok: false, error: 'Tu rol no tiene permiso para ' + accion + '.' };
}

// ---------------------------------------------------------------------------
// Sesion
// ---------------------------------------------------------------------------

function accIniciarSesion(bd, sesion, params) {
  var datos = params.datos || params;
  var dniLimpio = String(datos.dni != null ? datos.dni : '').trim();
  var claveLimpia = String(datos.clave != null ? datos.clave : '').trim();

  var usuario = bd.d.usuarios.filter(function (u) { return u.dni === dniLimpio; })[0] || null;
  if (!usuario || usuario.clave_acceso !== claveLimpia) {
    return { ok: false, error: 'DNI o clave incorrectos. Revisa tus datos e inténtalo de nuevo.' };
  }
  if (usuario.estado !== 'activo') {
    return { ok: false, error: 'Tu cuenta está inactiva. Comunícate con la academia.' };
  }
  // La sesion nunca incluye la clave_acceso.
  return { ok: true, usuario: sinClave(usuario) };
}

// ---------------------------------------------------------------------------
// Lecturas (devuelven arrays ya FILTRADOS por rol, igual que cliente.js)
// ---------------------------------------------------------------------------

function accObtenerCiclosDelUsuario(bd, sesion) {
  var ids = ciclosAlcanzables(bd, sesion);
  return bd.d.ciclos
    .filter(function (c) { return ids.indexOf(c.id_ciclo) !== -1; })
    .map(function (c) {
      if (!sesion || sesion.rol !== 'estudiante') return c;
      var matricula = bd.d.matriculas.filter(function (m) {
        return m.id_usuario === sesion.id_usuario && m.id_ciclo === c.id_ciclo && m.estado === 'matriculado';
      })[0];
      var copia = {};
      Object.keys(c).forEach(function (k) { copia[k] = c[k]; });
      copia.matricula = matricula || null;
      return copia;
    });
}

function accObtenerCursosDelUsuario(bd, sesion) {
  return cicloCursosVisibles(bd, sesion)
    .map(function (cc) { return resolverCicloCurso(bd, cc); })
    .sort(function (a, b) {
      return String(a.ciclo_nombre).localeCompare(String(b.ciclo_nombre)) || (a.orden - b.orden);
    });
}

function accObtenerHorario(bd, sesion, params) {
  var idCicloCurso = params.idCicloCurso;
  if (!puedeVerCicloCurso(bd, sesion, idCicloCurso)) return [];
  var ORDEN_DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return bd.d.horario
    .filter(function (h) { return h.id_ciclo_curso === idCicloCurso; })
    .sort(function (a, b) {
      return ORDEN_DIAS.indexOf(a.dia_semana) - ORDEN_DIAS.indexOf(b.dia_semana);
    });
}

function accObtenerClases(bd, sesion, params) {
  var idCicloCurso = params.idCicloCurso;
  if (!puedeVerCicloCurso(bd, sesion, idCicloCurso)) return [];
  return bd.d.clases
    .filter(function (c) { return c.id_ciclo_curso === idCicloCurso; })
    .sort(function (a, b) {
      return a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio);
    });
}

function accObtenerMateriales(bd, sesion, params) {
  var idCicloCurso = params.idCicloCurso;
  if (!puedeVerCicloCurso(bd, sesion, idCicloCurso)) return [];

  // Estudiante y auxiliar solo ven lo publicado (patron "fila publica"):
  // un material en borrador NO les aparece jamas.
  var verTodo = sesion.rol === 'superadmin' || sesion.rol === 'docente';
  var visibles = bd.d.materiales.filter(function (m) {
    return m.id_ciclo_curso === idCicloCurso && (verTodo || m.estado === 'publicado');
  });

  // Las resoluciones cuelgan de su practica via id_material_padre. Una
  // resolucion cuyo padre no es visible se muestra al nivel superior.
  var porId = {};
  visibles.forEach(function (m) { porId[m.id_material] = m; });
  var raiz = [];
  visibles.forEach(function (m) {
    if (m.id_material_padre && porId[m.id_material_padre]) return;
    var copia = {};
    Object.keys(m).forEach(function (k) { copia[k] = m[k]; });
    copia.resoluciones = visibles.filter(function (h) { return h.id_material_padre === m.id_material; });
    raiz.push(copia);
  });
  return raiz.sort(function (a, b) {
    var sa = a.semana === '' ? 0 : Number(a.semana);
    var sb = b.semana === '' ? 0 : Number(b.semana);
    return (sa - sb) || a.fecha_publicacion.localeCompare(b.fecha_publicacion);
  });
}

function accObtenerPagos(bd, sesion) {
  if (!sesion || sesion.rol === 'docente') return []; // el docente NO ve pagos, por ninguna via

  var filas = bd.d.pagos;
  if (sesion.rol === 'estudiante') {
    var susMatriculas = bd.d.matriculas
      .filter(function (m) { return m.id_usuario === sesion.id_usuario; })
      .map(function (m) { return m.id_matricula; });
    filas = filas.filter(function (p) { return susMatriculas.indexOf(p.id_matricula) !== -1; });
  }

  return filas
    .map(function (p) {
      var matricula = buscarFila(bd, 'matriculas', p.id_matricula);
      var alumno = matricula ? buscarUsuario(bd, matricula.id_usuario) : null;
      var ciclo = matricula ? buscarCiclo(bd, matricula.id_ciclo) : null;
      var verificador = p.id_verificador ? buscarUsuario(bd, p.id_verificador) : null;
      var copia = {};
      Object.keys(p).forEach(function (k) { copia[k] = p[k]; });
      copia.alumno_nombre = alumno ? nombreCompleto(alumno) : '(alumno no encontrado)';
      copia.alumno_dni = alumno ? alumno.dni : '';
      copia.ciclo_nombre = ciclo ? ciclo.nombre : '';
      copia.verificador_nombre = verificador ? nombreCompleto(verificador) : '';
      return copia;
    })
    .sort(function (a, b) { return b.fecha_reporte.localeCompare(a.fecha_reporte); });
}

function accObtenerAsistencias(bd, sesion, params) {
  if (!sesion) return [];
  var filtros = params.filtros || params.datos || {};

  var filas = bd.d.asistencias;
  if (sesion.rol === 'estudiante') {
    filas = filas.filter(function (a) { return a.id_usuario === sesion.id_usuario; });
  } else if (sesion.rol === 'docente') {
    var visibles = cicloCursosVisibles(bd, sesion);
    var susClases = bd.d.clases
      .filter(function (c) {
        return visibles.some(function (cc) { return cc.id_ciclo_curso === c.id_ciclo_curso; });
      })
      .map(function (c) { return c.id_clase; });
    filas = filas.filter(function (a) { return susClases.indexOf(a.id_clase) !== -1; });
  }
  // auxiliar y superadmin: sin restriccion adicional

  if (filtros.idClase) filas = filas.filter(function (a) { return a.id_clase === filtros.idClase; });
  if (filtros.idUsuario) filas = filas.filter(function (a) { return a.id_usuario === filtros.idUsuario; });

  return filas
    .map(function (a) {
      var clase = buscarFila(bd, 'clases', a.id_clase);
      var cc = clase ? buscarCicloCurso(bd, clase.id_ciclo_curso) : null;
      var curso = cc ? buscarCurso(bd, cc.id_curso) : null;
      var alumno = buscarUsuario(bd, a.id_usuario);
      var copia = {};
      Object.keys(a).forEach(function (k) { copia[k] = a[k]; });
      copia.clase_fecha = clase ? clase.fecha : '';
      copia.clase_tema = clase ? clase.tema : '';
      copia.curso_nombre = curso ? curso.nombre : '';
      copia.alumno_nombre = alumno ? nombreCompleto(alumno) : '(alumno no encontrado)';
      return copia;
    })
    .sort(function (a, b) { return b.clase_fecha.localeCompare(a.clase_fecha); });
}

/** Alumnos con matricula 'matriculado' en el ciclo de la clase dada, con su
 *  asistencia ya registrada (si existe). Es el "papel" para pasar lista. */
function accObtenerRosterDeClase(bd, sesion, params) {
  var idClase = params.idClase;
  if (!sesion || sesion.rol === 'estudiante') return [];
  var clase = buscarFila(bd, 'clases', idClase);
  if (!clase) return [];
  if (sesion.rol === 'docente' && !puedeVerCicloCurso(bd, sesion, clase.id_ciclo_curso)) return [];

  var cc = buscarCicloCurso(bd, clase.id_ciclo_curso);
  return bd.d.matriculas
    .filter(function (m) { return m.id_ciclo === cc.id_ciclo && m.estado === 'matriculado'; })
    .map(function (m) {
      var alumno = buscarUsuario(bd, m.id_usuario);
      var asistencia = bd.d.asistencias.filter(function (a) {
        return a.id_clase === idClase && a.id_usuario === m.id_usuario;
      })[0];
      return {
        id_usuario: m.id_usuario,
        id_matricula: m.id_matricula,
        nombres: alumno ? alumno.nombres : '',
        apellidos: alumno ? alumno.apellidos : '',
        dni: alumno ? alumno.dni : '',
        asistencia: asistencia || null,
      };
    })
    .sort(function (a, b) { return a.apellidos.localeCompare(b.apellidos); });
}

function accObtenerAnuncios(bd, sesion) {
  if (!sesion) return [];
  var idsCiclos = ciclosAlcanzables(bd, sesion);
  return bd.d.anuncios
    .filter(function (a) {
      if (sesion.rol !== 'superadmin' && a.estado !== 'publicado') return false;
      return a.id_ciclo === '' || idsCiclos.indexOf(a.id_ciclo) !== -1;
    })
    .map(function (a) {
      var autor = buscarUsuario(bd, a.id_autor);
      var ciclo = a.id_ciclo ? buscarCiclo(bd, a.id_ciclo) : null;
      var copia = {};
      Object.keys(a).forEach(function (k) { copia[k] = a[k]; });
      copia.autor_nombre = autor ? nombreCompleto(autor) : '';
      copia.ciclo_nombre = ciclo ? ciclo.nombre : '';
      return copia;
    })
    .sort(function (a, b) {
      if (a.fijado !== b.fijado) return a.fijado === 'si' ? -1 : 1;
      return b.fecha.localeCompare(a.fecha);
    });
}

/** Matriculas resueltas con alumno y ciclo. Estudiante: solo las suyas.
 *  Auxiliar y superadmin: todas. Docente: ninguna. */
function accObtenerMatriculas(bd, sesion) {
  if (!sesion || sesion.rol === 'docente') return [];
  var filas = bd.d.matriculas;
  if (sesion.rol === 'estudiante') {
    filas = filas.filter(function (m) { return m.id_usuario === sesion.id_usuario; });
  }
  return filas
    .map(function (m) {
      var alumno = buscarUsuario(bd, m.id_usuario);
      var ciclo = buscarCiclo(bd, m.id_ciclo);
      var copia = {};
      Object.keys(m).forEach(function (k) { copia[k] = m[k]; });
      copia.alumno_nombre = alumno ? nombreCompleto(alumno) : '(alumno no encontrado)';
      copia.alumno_dni = alumno ? alumno.dni : '';
      copia.ciclo_nombre = ciclo ? ciclo.nombre : '';
      copia.n_mensualidades = ciclo ? ciclo.n_mensualidades : 0;
      return copia;
    })
    .sort(function (a, b) {
      return String(a.ciclo_nombre).localeCompare(String(b.ciclo_nombre)) ||
        String(a.alumno_nombre).localeCompare(String(b.alumno_nombre));
    });
}

function accObtenerUsuarios(bd, sesion) {
  if (!sesion || sesion.rol !== 'superadmin') return [];
  return bd.d.usuarios.map(sinClave);
}

function accObtenerConfig(bd, sesion) {
  if (!sesion || sesion.rol !== 'superadmin') return [];
  return bd.d.config;
}

/** Catalogo global de cursos (no confundir con obtenerCursosDelUsuario).
 *  Solo superadmin. */
function accObtenerCursosCatalogo(bd, sesion) {
  if (!sesion || sesion.rol !== 'superadmin') return [];
  return bd.d.cursos.slice().sort(function (a, b) { return a.orden - b.orden; });
}

// ---------------------------------------------------------------------------
// Escrituras (devuelven { ok: true, ... } o { ok: false, error })
// ---------------------------------------------------------------------------

function accRegistrarPago(bd, sesion, params) {
  var datos = params.datos || {};
  if (!sesion || sesion.rol === 'docente') return sinPermiso('registrar pagos');

  var matricula = buscarFila(bd, 'matriculas', datos.id_matricula);
  if (!matricula) return { ok: false, error: 'No se encontró la matrícula indicada.' };
  if (
    sesion.rol === 'estudiante' &&
    (matricula.id_usuario !== sesion.id_usuario || matricula.estado === 'retirado')
  ) {
    return { ok: false, error: 'Solo puedes reportar pagos de tu propia matrícula activa.' };
  }

  var ciclo = buscarCiclo(bd, matricula.id_ciclo);
  var conceptosValidos = ['matricula'];
  for (var i = 1; i <= (ciclo ? Number(ciclo.n_mensualidades) : 0); i++) {
    conceptosValidos.push('mensualidad_' + i);
  }
  if (conceptosValidos.indexOf(datos.concepto) === -1) {
    return { ok: false, error: 'El concepto no corresponde a este ciclo.' };
  }
  var monto = Number(datos.monto);
  if (!isFinite(monto) || monto <= 0) {
    return { ok: false, error: 'Ingresa un monto válido mayor que cero.' };
  }
  var mediosValidos = ['yape', 'plin', 'efectivo', 'transferencia'];
  if (mediosValidos.indexOf(datos.medio) === -1) {
    return { ok: false, error: 'Elige un medio de pago válido.' };
  }

  var pago = {
    id_pago: siguienteId(bd, 'pagos'),
    id_matricula: matricula.id_matricula,
    concepto: datos.concepto,
    monto: monto,
    fecha_reporte: hoy(bd),
    fecha_verificacion: '',
    medio: datos.medio,
    estado: 'pendiente',
    voucher_ref: String(datos.voucher_ref != null ? datos.voucher_ref : '').trim(),
    id_verificador: '',
  };
  agregarFila(bd, 'pagos', pago);
  return { ok: true, pago: pago };
}

function accVerificarPago(bd, sesion, params) {
  // PENDIENTE: delegación no modelada (ver GUIA_FRONTEND.md seccion 5). La
  // matriz dice que el auxiliar verifica "solo si superadmin delega", pero el
  // modelo no tiene campo para esa delegacion; por ahora se habilita al auxiliar.
  if (!sesion || (sesion.rol !== 'superadmin' && sesion.rol !== 'auxiliar')) {
    return sinPermiso('verificar pagos');
  }
  var idPago = params.idPago != null ? params.idPago : (params.datos || {}).id_pago;
  var decision = params.decision != null ? params.decision : (params.datos || {}).decision;
  if (decision !== 'verificado' && decision !== 'rechazado') {
    return { ok: false, error: 'Decisión inválida: usa "verificado" o "rechazado".' };
  }
  var pago = buscarFila(bd, 'pagos', idPago);
  if (!pago) return { ok: false, error: 'No se encontró el pago.' };

  actualizarFila(bd, 'pagos', pago.id_pago, {
    estado: decision,
    fecha_verificacion: hoy(bd),
    id_verificador: sesion.id_usuario,
  });

  // Con la matricula pagada y verificada, la matricula pasa de preinscrito a
  // matriculado (flujo del estudiante, ROLES_Y_FLUJOS.md paso 3).
  if (decision === 'verificado' && pago.concepto === 'matricula') {
    var matricula = buscarFila(bd, 'matriculas', pago.id_matricula);
    if (matricula && matricula.estado === 'preinscrito') {
      actualizarFila(bd, 'matriculas', matricula.id_matricula, { estado: 'matriculado' });
    }
  }
  return { ok: true, pago: pago };
}

function accGuardarClase(bd, sesion, params) {
  var datos = params.datos || {};
  if (!sesion || (sesion.rol !== 'superadmin' && sesion.rol !== 'docente')) {
    return sinPermiso('programar o editar clases');
  }
  if (sesion.rol === 'docente' && !puedeVerCicloCurso(bd, sesion, datos.id_ciclo_curso)) {
    return { ok: false, error: 'Solo puedes gestionar clases de tus propios cursos.' };
  }
  if (!datos.fecha || !datos.hora_inicio || !datos.hora_fin || !String(datos.tema != null ? datos.tema : '').trim()) {
    return { ok: false, error: 'Completa fecha, horas y tema de la clase.' };
  }
  if (['presencial', 'virtual'].indexOf(datos.modalidad) === -1) {
    return { ok: false, error: 'La modalidad debe ser "presencial" o "virtual".' };
  }
  if (['programada', 'dictada', 'cancelada'].indexOf(datos.estado) === -1) {
    return { ok: false, error: 'Estado de clase inválido.' };
  }

  if (datos.id_clase) {
    if (!buscarFila(bd, 'clases', datos.id_clase)) {
      return { ok: false, error: 'No se encontró la clase.' };
    }
    var clase = actualizarFila(bd, 'clases', datos.id_clase, {
      fecha: datos.fecha,
      hora_inicio: datos.hora_inicio,
      hora_fin: datos.hora_fin,
      tema: String(datos.tema).trim(),
      modalidad: datos.modalidad,
      enlace_en_vivo: String(datos.enlace_en_vivo != null ? datos.enlace_en_vivo : '').trim(),
      estado: datos.estado,
    });
    return { ok: true, clase: clase };
  }

  var claseNueva = {
    id_clase: siguienteId(bd, 'clases'),
    id_ciclo_curso: datos.id_ciclo_curso,
    fecha: datos.fecha,
    hora_inicio: datos.hora_inicio,
    hora_fin: datos.hora_fin,
    tema: String(datos.tema).trim(),
    modalidad: datos.modalidad,
    enlace_en_vivo: String(datos.enlace_en_vivo != null ? datos.enlace_en_vivo : '').trim(),
    estado: datos.estado,
  };
  agregarFila(bd, 'clases', claseNueva);
  return { ok: true, clase: claseNueva };
}

function accGuardarMaterial(bd, sesion, params) {
  var datos = params.datos || {};
  if (!sesion || (sesion.rol !== 'superadmin' && sesion.rol !== 'docente')) {
    return sinPermiso('subir o editar materiales');
  }
  if (sesion.rol === 'docente' && !puedeVerCicloCurso(bd, sesion, datos.id_ciclo_curso)) {
    return { ok: false, error: 'Solo puedes gestionar materiales de tus propios cursos.' };
  }
  var tiposValidos = ['video_grabado', 'pdf_teoria', 'pdf_practica', 'pdf_resolucion', 'enlace'];
  if (tiposValidos.indexOf(datos.tipo) === -1) {
    return { ok: false, error: 'Tipo de material inválido.' };
  }
  if (!String(datos.titulo != null ? datos.titulo : '').trim() ||
      !String(datos.url_drive != null ? datos.url_drive : '').trim()) {
    return { ok: false, error: 'Completa el título y el enlace del material.' };
  }
  if (['borrador', 'publicado'].indexOf(datos.estado) === -1) {
    return { ok: false, error: 'Estado de material inválido.' };
  }

  // Regla de integridad 5: una resolucion solo puede apuntar a una practica
  // del MISMO id_ciclo_curso.
  var idMaterialPadre = '';
  if (datos.tipo === 'pdf_resolucion') {
    var padre = buscarFila(bd, 'materiales', datos.id_material_padre);
    if (!padre || padre.tipo !== 'pdf_practica' || padre.id_ciclo_curso !== datos.id_ciclo_curso) {
      return { ok: false, error: 'La resolución debe apuntar a una práctica del mismo curso.' };
    }
    idMaterialPadre = padre.id_material;
  }

  var semana = (datos.semana === '' || datos.semana === null || datos.semana === undefined)
    ? '' : Number(datos.semana);

  if (datos.id_material) {
    if (!buscarFila(bd, 'materiales', datos.id_material)) {
      return { ok: false, error: 'No se encontró el material.' };
    }
    var material = actualizarFila(bd, 'materiales', datos.id_material, {
      tipo: datos.tipo,
      titulo: String(datos.titulo).trim(),
      semana: semana,
      url_drive: String(datos.url_drive).trim(),
      id_material_padre: idMaterialPadre,
      estado: datos.estado,
    });
    return { ok: true, material: material };
  }

  var materialNuevo = {
    id_material: siguienteId(bd, 'materiales'),
    id_ciclo_curso: datos.id_ciclo_curso,
    id_clase: datos.id_clase || '',
    tipo: datos.tipo,
    titulo: String(datos.titulo).trim(),
    semana: semana,
    url_drive: String(datos.url_drive).trim(),
    id_material_padre: idMaterialPadre,
    fecha_publicacion: hoy(bd),
    id_autor: sesion.id_usuario,
    estado: datos.estado,
  };
  agregarFila(bd, 'materiales', materialNuevo);
  return { ok: true, material: materialNuevo };
}

/** Registra (o corrige) asistencia. Acepta un solo registro
 *  { id_clase, id_usuario, estado, observacion } o una lista pasada de una vez:
 *  { id_clase, registros: [{ id_usuario, estado, observacion }] }. */
function accRegistrarAsistencia(bd, sesion, params) {
  var datos = params.datos || {};
  if (!sesion || sesion.rol === 'estudiante') return sinPermiso('registrar asistencia');

  var clase = buscarFila(bd, 'clases', datos.id_clase);
  if (!clase) return { ok: false, error: 'No se encontró la clase.' };
  if (sesion.rol === 'docente' && !puedeVerCicloCurso(bd, sesion, clase.id_ciclo_curso)) {
    return { ok: false, error: 'Solo puedes registrar asistencia de tus propias clases.' };
  }

  var registros = Array.isArray(datos.registros)
    ? datos.registros
    : [{ id_usuario: datos.id_usuario, estado: datos.estado, observacion: datos.observacion }];
  var estadosValidos = ['presente', 'tardanza', 'falta', 'justificado'];

  for (var i = 0; i < registros.length; i++) {
    if (estadosValidos.indexOf(registros[i].estado) === -1) {
      return { ok: false, error: 'Estado de asistencia inválido.' };
    }
    if (!buscarUsuario(bd, registros[i].id_usuario)) {
      return { ok: false, error: 'No se encontró al alumno.' };
    }
  }

  var guardadas = registros.map(function (r) {
    var existente = bd.d.asistencias.filter(function (a) {
      return a.id_clase === clase.id_clase && a.id_usuario === r.id_usuario;
    })[0];
    if (existente) {
      return actualizarFila(bd, 'asistencias', existente.id_asistencia, {
        estado: r.estado,
        observacion: String(r.observacion != null ? r.observacion : '').trim(),
        id_registrador: sesion.id_usuario,
      });
    }
    var nueva = {
      id_asistencia: siguienteId(bd, 'asistencias'),
      id_clase: clase.id_clase,
      id_usuario: r.id_usuario,
      estado: r.estado,
      id_registrador: sesion.id_usuario,
      observacion: String(r.observacion != null ? r.observacion : '').trim(),
    };
    agregarFila(bd, 'asistencias', nueva);
    return nueva;
  });
  return { ok: true, asistencias: guardadas };
}

function accPublicarAnuncio(bd, sesion, params) {
  var datos = params.datos || {};
  if (!sesion || (sesion.rol !== 'superadmin' && sesion.rol !== 'auxiliar')) {
    return sinPermiso('publicar anuncios');
  }
  // El auxiliar publica solo anuncios POR CICLO; los globales son del superadmin.
  if (sesion.rol === 'auxiliar' && !datos.id_ciclo) {
    return { ok: false, error: 'Como auxiliar solo puedes publicar anuncios de un ciclo.' };
  }
  if (datos.id_ciclo && !buscarCiclo(bd, datos.id_ciclo)) {
    return { ok: false, error: 'El ciclo indicado no existe.' };
  }
  if (!String(datos.titulo != null ? datos.titulo : '').trim() ||
      !String(datos.cuerpo != null ? datos.cuerpo : '').trim()) {
    return { ok: false, error: 'Completa el título y el contenido del anuncio.' };
  }

  var anuncio = {
    id_anuncio: siguienteId(bd, 'anuncios'),
    id_ciclo: datos.id_ciclo || '',
    titulo: String(datos.titulo).trim(),
    cuerpo: String(datos.cuerpo).trim(),
    fecha: hoy(bd),
    fijado: datos.fijado === 'si' ? 'si' : 'no',
    id_autor: sesion.id_usuario,
    estado: 'publicado',
  };
  agregarFila(bd, 'anuncios', anuncio);
  return { ok: true, anuncio: anuncio };
}

// --- Escrituras estructurales: solo superadmin -------------------------------

function accGuardarCiclo(bd, sesion, params) {
  var datos = params.datos || {};
  if (!sesion || sesion.rol !== 'superadmin') return sinPermiso('crear o editar ciclos');

  var estadosValidos = ['planificado', 'inscripciones_abiertas', 'en_curso', 'finalizado'];
  if (!String(datos.nombre != null ? datos.nombre : '').trim()) {
    return { ok: false, error: 'El ciclo necesita un nombre.' };
  }
  if (estadosValidos.indexOf(datos.estado) === -1) {
    return { ok: false, error: 'Estado de ciclo inválido.' };
  }

  if (datos.id_ciclo) {
    var existente = buscarCiclo(bd, datos.id_ciclo);
    if (!existente) return { ok: false, error: 'No se encontró el ciclo.' };
    var ciclo = actualizarFila(bd, 'ciclos', datos.id_ciclo, {
      nombre: String(datos.nombre).trim(),
      fecha_inicio: datos.fecha_inicio || existente.fecha_inicio,
      fecha_fin: datos.fecha_fin || existente.fecha_fin,
      estado: datos.estado,
    });
    return { ok: true, ciclo: ciclo };
  }

  var cicloNuevo = {
    id_ciclo: siguienteId(bd, 'ciclos'),
    nombre: String(datos.nombre).trim(),
    anio: Number(datos.anio) || new Date().getFullYear(),
    fecha_inicio: datos.fecha_inicio || '',
    fecha_fin: datos.fecha_fin || '',
    estado: datos.estado,
    precio_matricula: Number(datos.precio_matricula) || 0,
    precio_mensualidad: Number(datos.precio_mensualidad) || 0,
    n_mensualidades: Number(datos.n_mensualidades) || 0,
    descripcion: String(datos.descripcion != null ? datos.descripcion : '').trim(),
  };
  agregarFila(bd, 'ciclos', cicloNuevo);
  return { ok: true, ciclo: cicloNuevo };
}

function accGuardarCurso(bd, sesion, params) {
  var datos = params.datos || {};
  if (!sesion || sesion.rol !== 'superadmin') return sinPermiso('crear o editar cursos');
  if (!String(datos.nombre != null ? datos.nombre : '').trim()) {
    return { ok: false, error: 'El curso necesita un nombre.' };
  }

  if (datos.id_curso) {
    if (!buscarCurso(bd, datos.id_curso)) {
      return { ok: false, error: 'No se encontró el curso.' };
    }
    var curso = actualizarFila(bd, 'cursos', datos.id_curso, {
      nombre: String(datos.nombre).trim(),
      descripcion: String(datos.descripcion != null ? datos.descripcion : '').trim(),
    });
    return { ok: true, curso: curso };
  }

  var cursoNuevo = {
    id_curso: siguienteId(bd, 'cursos'),
    nombre: String(datos.nombre).trim(),
    descripcion: String(datos.descripcion != null ? datos.descripcion : '').trim(),
    orden: bd.d.cursos.length + 1,
  };
  agregarFila(bd, 'cursos', cursoNuevo);
  return { ok: true, curso: cursoNuevo };
}

/** Crea un ciclo_curso o reasigna su docente. Es el "flujo estrella": asignar
 *  id_docente a un ciclo_curso hace que aparezca en el panel del docente. */
function accGuardarAsignacion(bd, sesion, params) {
  var datos = params.datos || {};
  if (!sesion || sesion.rol !== 'superadmin') return sinPermiso('gestionar asignaciones');

  if (datos.id_ciclo_curso) {
    var ccExistente = buscarCicloCurso(bd, datos.id_ciclo_curso);
    if (!ccExistente) return { ok: false, error: 'No se encontró la asignación.' };
    if (datos.id_docente) {
      var docenteEdit = buscarUsuario(bd, datos.id_docente);
      if (!docenteEdit || docenteEdit.rol !== 'docente') {
        return { ok: false, error: 'El usuario elegido no es docente.' };
      }
    }
    var cc = actualizarFila(bd, 'ciclo_cursos', datos.id_ciclo_curso, {
      id_docente: datos.id_docente || '',
    });
    return { ok: true, ciclo_curso: cc };
  }

  if (!buscarCiclo(bd, datos.id_ciclo)) return { ok: false, error: 'El ciclo indicado no existe.' };
  if (!buscarCurso(bd, datos.id_curso)) return { ok: false, error: 'El curso indicado no existe.' };
  if (datos.id_docente) {
    var docente = buscarUsuario(bd, datos.id_docente);
    if (!docente || docente.rol !== 'docente') {
      return { ok: false, error: 'El usuario elegido no es docente.' };
    }
  }
  var duplicada = bd.d.ciclo_cursos.filter(function (x) {
    return x.id_ciclo === datos.id_ciclo && x.id_curso === datos.id_curso;
  })[0];
  if (duplicada) return { ok: false, error: 'Ese curso ya está asignado en ese ciclo.' };

  var orden = bd.d.ciclo_cursos.filter(function (x) { return x.id_ciclo === datos.id_ciclo; }).length + 1;
  var ccNuevo = {
    id_ciclo_curso: siguienteId(bd, 'ciclo_cursos'),
    id_ciclo: datos.id_ciclo,
    id_curso: datos.id_curso,
    id_docente: datos.id_docente || '',
    orden: orden,
  };
  agregarFila(bd, 'ciclo_cursos', ccNuevo);
  return { ok: true, ciclo_curso: ccNuevo };
}

/** Reasigna rol o estado de cuenta de un usuario. Solo superadmin. */
function accGuardarUsuario(bd, sesion, params) {
  var datos = params.datos || {};
  if (!sesion || sesion.rol !== 'superadmin') return sinPermiso('editar usuarios');

  var usuario = buscarUsuario(bd, datos.id_usuario);
  if (!usuario) return { ok: false, error: 'No se encontró al usuario.' };
  var rolesValidos = ['superadmin', 'docente', 'auxiliar', 'estudiante'];
  if (rolesValidos.indexOf(datos.rol) === -1) return { ok: false, error: 'Rol inválido.' };
  if (['activo', 'inactivo'].indexOf(datos.estado) === -1) {
    return { ok: false, error: 'Estado inválido.' };
  }
  if (usuario.id_usuario === sesion.id_usuario && (datos.rol !== 'superadmin' || datos.estado !== 'activo')) {
    return { ok: false, error: 'No puedes quitarte a ti mismo el rol ni desactivar tu propia cuenta.' };
  }

  var actualizado = actualizarFila(bd, 'usuarios', usuario.id_usuario, {
    rol: datos.rol,
    estado: datos.estado,
  });
  return { ok: true, usuario: sinClave(actualizado) };
}

// ---------------------------------------------------------------------------
// Instalacion de Drive — se ejecuta A MANO desde el editor de Apps Script
// (menu Ejecutar), NO por HTTP. Hace dos cosas:
//   1. Registra el id de la carpeta raiz en config.drive_root_id.
//   2. Crea la estructura de carpetas de docs/MODELO_DATOS.md:
//        <raiz>/<Ciclo>/<Curso>/{Grabaciones, Teoria, Practicas, Resoluciones}
// Es idempotente: se puede correr de nuevo sin duplicar nada (reutiliza las
// carpetas existentes por nombre). La raiz queda compartida como "cualquier
// persona con el enlace puede ver", y los archivos subidos dentro heredan ese
// permiso — asi los enlaces url_drive de la hoja materiales funcionan para
// los estudiantes sin login de Google.
// ---------------------------------------------------------------------------

var DRIVE_ROOT_ID = '1yhqT4qCO8WjT7B0B2BaeSo0vxtqhHJEQ';

function instalarDrive() {
  var raiz = DriveApp.getFolderById(DRIVE_ROOT_ID);
  raiz.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var bd = cargarBd();

  // 1. config.drive_root_id (actualizar la fila si existe, agregarla si no)
  var t = bd.t.config;
  var refConfig = null;
  for (var i = 0; i < t.filas.length; i++) {
    if (t.filas[i].datos.clave === 'drive_root_id') { refConfig = t.filas[i]; break; }
  }
  if (refConfig) {
    t.hoja.getRange(refConfig.rowNum, t.col['valor'] + 1).setValue(DRIVE_ROOT_ID);
  } else {
    t.hoja.appendRow(['drive_root_id', DRIVE_ROOT_ID, 'Id de la carpeta raíz de Drive donde se guardan videos y materiales']);
  }

  // 2. Estructura de carpetas por ciclo y curso dictado
  var subcarpetas = ['Grabaciones', 'Teoria', 'Practicas', 'Resoluciones'];
  bd.d.ciclos.forEach(function (ciclo) {
    var carpetaCiclo = obtenerOCrearCarpeta(raiz, ciclo.nombre);
    bd.d.ciclo_cursos.forEach(function (cc) {
      if (cc.id_ciclo !== ciclo.id_ciclo) return;
      var curso = buscarCurso(bd, cc.id_curso);
      if (!curso) return;
      var carpetaCurso = obtenerOCrearCarpeta(carpetaCiclo, curso.nombre);
      subcarpetas.forEach(function (nombre) {
        obtenerOCrearCarpeta(carpetaCurso, nombre);
      });
    });
  });

  Logger.log('Drive instalado. Raiz: %s (%s). Estructura sincronizada.', raiz.getName(), DRIVE_ROOT_ID);
}

/** Devuelve la subcarpeta `nombre` dentro de `padre`, creandola si no existe. */
function obtenerOCrearCarpeta(padre, nombre) {
  var it = padre.getFoldersByName(nombre);
  return it.hasNext() ? it.next() : padre.createFolder(nombre);
}

// ==========================================================================
// BANQUEO — banco de preguntas de practica (CARGA DIFERIDA)
// --------------------------------------------------------------------------
// Dos hojas NUEVAS en el mismo spreadsheet BD Guyton, subidas aparte por el
// usuario (pueden NO existir aun; se maneja su ausencia con gracia):
//   - banqueo_preguntas (~2800 filas): id_pregunta, curso, tema, subtema,
//     enunciado, opcion_1..5, correcta (num 1..5), justificacion, tiempo_seg,
//     imagen_url, fuente, estado ('publicado'/'borrador').
//   - banqueo_progreso: id_progreso (prefijo bqp), id_usuario, curso,
//     respondidas, correctas, ultima_practica.
//
// RENDIMIENTO (regla critica): estas hojas NO estan en ESQUEMAS ni en
// cargarBd() — con ~2800 filas frenarian CADA llamada del API. Se leen SOLO
// dentro de las acciones de banqueo, on-demand, con getDataRange().getValues()
// y SIEMPRE por nombre de header (nunca por indice fijo). No se cachea el
// payload de preguntas (excede el limite de 100KB por clave de CacheService);
// solo se cachea el resumen liviano de cursos.
// ==========================================================================

var BANQUEO_HOJA_PREGUNTAS = 'banqueo_preguntas';
var BANQUEO_HOJA_PROGRESO = 'banqueo_progreso';
var BANQUEO_CACHE_CURSOS = 'banqueo_cursos_v1';
var BANQUEO_CACHE_SEG = 300; // 5 min: el resumen de cursos solo cambia al re-subir la hoja.

/** Lee una hoja de banqueo on-demand abriendo el spreadsheet por SPREADSHEET_ID.
 *  Devuelve null si la hoja NO existe (se trata como "banco no configurado").
 *  Estructura: { hoja, headers, col:{header->indice}, filas:[{cruda, rowNum}] }.
 *  Nunca se referencia por indice fijo: siempre via `col[header]`. */
function leerHojaBanqueo(nombreHoja) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var hoja = ss.getSheetByName(nombreHoja);
  if (!hoja) return null;
  var valores = hoja.getDataRange().getValues();
  if (!valores.length) return { hoja: hoja, headers: [], col: {}, filas: [] };
  var headers = valores[0].map(function (h) { return String(h).trim(); });
  var col = {};
  headers.forEach(function (h, i) { col[h] = i; });
  var filas = [];
  for (var i = 1; i < valores.length; i++) {
    var cruda = valores[i];
    var vacia = cruda.every(function (v) { return v === '' || v === null; });
    if (vacia) continue;
    filas.push({ cruda: cruda, rowNum: i + 1 });
  }
  return { hoja: hoja, headers: headers, col: col, filas: filas };
}

/** Valor de una celda por HEADER (no por indice). '' si el header no existe. */
function celdaBanqueo(h, cruda, header) {
  var i = h.col[header];
  return i === undefined ? '' : cruda[i];
}

/** Formatea un valor de fecha (Date de getValues o string) a 'YYYY-MM-DD'. */
function textoFechaBanqueo(valor, tz) {
  if (valor === null || valor === undefined || valor === '') return '';
  if (Object.prototype.toString.call(valor) === '[object Date]') {
    if (isNaN(valor.getTime())) return '';
    return Utilities.formatDate(valor, tz, 'yyyy-MM-dd');
  }
  return String(valor).trim();
}

/** Baraja un array in-place (Fisher-Yates). Math.random esta permitido en GAS. */
function barajarBanqueo(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

/** Calcula [{curso, total}] de las preguntas 'publicado'. [] si no hay hoja. */
function calcularBanqueoCursos() {
  var h = leerHojaBanqueo(BANQUEO_HOJA_PREGUNTAS);
  if (!h) return [];
  if (h.col['curso'] === undefined) return [];
  var conteo = {};
  h.filas.forEach(function (f) {
    if (String(celdaBanqueo(h, f.cruda, 'estado')).trim() !== 'publicado') return;
    var curso = String(celdaBanqueo(h, f.cruda, 'curso')).trim();
    if (!curso) return;
    conteo[curso] = (conteo[curso] || 0) + 1;
  });
  return Object.keys(conteo)
    .map(function (c) { return { curso: c, total: conteo[c] }; })
    .sort(function (a, b) { return a.curso.localeCompare(b.curso); });
}

/** Cursos con preguntas publicadas y su conteo. Cachea SOLO este resumen
 *  liviano (no las preguntas). [] si la hoja no existe. */
function accObtenerBanqueoCursos(bd, sesion) {
  var cache = CacheService.getScriptCache();
  var guardado = cache.get(BANQUEO_CACHE_CURSOS);
  if (guardado) {
    try { return JSON.parse(guardado); } catch (err) { /* recalcular */ }
  }
  var resultado = calcularBanqueoCursos();
  try { cache.put(BANQUEO_CACHE_CURSOS, JSON.stringify(resultado), BANQUEO_CACHE_SEG); } catch (err) { /* sin cache */ }
  return resultado;
}

/** Temas (con conteo) de las preguntas 'publicado' de un curso, para que el
 *  estudiante pueda filtrar su practica por tema. [] si la hoja no existe o
 *  falta el `curso`. */
function accObtenerBanqueoTemas(bd, sesion, params) {
  var datos = params.datos || {};
  var curso = String((params.curso != null ? params.curso : datos.curso) || '').trim();
  if (!curso) return [];
  var h = leerHojaBanqueo(BANQUEO_HOJA_PREGUNTAS);
  if (!h) return [];
  if (h.col['curso'] === undefined) return [];
  var conteo = {};
  h.filas.forEach(function (f) {
    var cr = f.cruda;
    if (String(celdaBanqueo(h, cr, 'estado')).trim() !== 'publicado') return;
    if (String(celdaBanqueo(h, cr, 'curso')).trim() !== curso) return;
    var tema = String(celdaBanqueo(h, cr, 'tema')).trim() || '(sin tema)';
    conteo[tema] = (conteo[tema] || 0) + 1;
  });
  return Object.keys(conteo)
    .map(function (t) { return { tema: t, total: conteo[t] }; })
    .sort(function (a, b) { return a.tema.localeCompare(b.tema); });
}

/** Preguntas 'publicado' de un curso (filtradas por tema si viene), barajadas
 *  y cortadas a `limite` (por defecto 10). Es PRACTICA: incluye correcta y
 *  justificacion. [] si la hoja no existe o no hay coincidencias. */
function accObtenerBanqueoPreguntas(bd, sesion, params) {
  var datos = params.datos || {};
  var curso = String((params.curso != null ? params.curso : datos.curso) || '').trim();
  if (!curso) return [];
  var tema = String((params.tema != null ? params.tema : datos.tema) || '').trim();
  var limiteRaw = params.limite != null ? params.limite : datos.limite;
  var limite = Number(limiteRaw);
  if (!isFinite(limite) || limite <= 0) limite = 10;
  limite = Math.floor(limite);

  var h = leerHojaBanqueo(BANQUEO_HOJA_PREGUNTAS);
  if (!h) return [];
  if (h.col['curso'] === undefined) return [];

  var preguntas = [];
  h.filas.forEach(function (f) {
    var cr = f.cruda;
    if (String(celdaBanqueo(h, cr, 'estado')).trim() !== 'publicado') return;
    if (String(celdaBanqueo(h, cr, 'curso')).trim() !== curso) return;
    if (tema && String(celdaBanqueo(h, cr, 'tema')).trim() !== tema) return;

    var correctaNum = Number(celdaBanqueo(h, cr, 'correcta'));
    var opciones = [];
    var correctaCompacta = '';
    ['opcion_1', 'opcion_2', 'opcion_3', 'opcion_4', 'opcion_5'].forEach(function (o, idx) {
      var val = celdaBanqueo(h, cr, o);
      val = val === null || val === undefined ? '' : String(val).trim();
      if (val === '') return;
      opciones.push(val);
      // Al compactar (descartar opciones vacias) la posicion de la correcta
      // puede moverse; se re-mapea al indice 1-based dentro de `opciones`, para
      // que el frontend (que numera las opciones devueltas) marque bien la
      // correcta aunque haya un hueco intermedio en la hoja.
      if (idx + 1 === correctaNum) correctaCompacta = opciones.length;
    });
    preguntas.push({
      id_pregunta: String(celdaBanqueo(h, cr, 'id_pregunta')).trim(),
      curso: String(celdaBanqueo(h, cr, 'curso')).trim(),
      tema: String(celdaBanqueo(h, cr, 'tema')).trim(),
      subtema: String(celdaBanqueo(h, cr, 'subtema')).trim(),
      enunciado: String(celdaBanqueo(h, cr, 'enunciado')).trim(),
      opciones: opciones,
      correcta: correctaCompacta || (isFinite(correctaNum) ? correctaNum : ''),
      justificacion: String(celdaBanqueo(h, cr, 'justificacion')).trim(),
      imagen_url: String(celdaBanqueo(h, cr, 'imagen_url')).trim(),
      fuente: String(celdaBanqueo(h, cr, 'fuente')).trim(),
    });
  });

  barajarBanqueo(preguntas);
  return preguntas.slice(0, limite);
}

/** Filas de banqueo_progreso del usuario en sesion, con porcentaje calculado
 *  (correctas/respondidas*100, 0 si respondidas=0). [] si la hoja no existe. */
function accObtenerBanqueoProgreso(bd, sesion) {
  var h = leerHojaBanqueo(BANQUEO_HOJA_PROGRESO);
  if (!h) return [];
  if (h.col['id_usuario'] === undefined) return [];
  var out = [];
  h.filas.forEach(function (f) {
    var cr = f.cruda;
    if (String(celdaBanqueo(h, cr, 'id_usuario')).trim() !== sesion.id_usuario) return;
    var respondidas = Number(celdaBanqueo(h, cr, 'respondidas')) || 0;
    var correctas = Number(celdaBanqueo(h, cr, 'correctas')) || 0;
    var porcentaje = respondidas > 0 ? Math.round((correctas / respondidas) * 100) : 0;
    out.push({
      id_progreso: String(celdaBanqueo(h, cr, 'id_progreso')).trim(),
      id_usuario: sesion.id_usuario,
      curso: String(celdaBanqueo(h, cr, 'curso')).trim(),
      respondidas: respondidas,
      correctas: correctas,
      ultima_practica: textoFechaBanqueo(celdaBanqueo(h, cr, 'ultima_practica'), bd.tz),
      porcentaje: porcentaje,
    });
  });
  return out;
}

/** Siguiente id de progreso: bqp-NNN (3 digitos). Soporta ids demo
 *  (bqp-demo-N) para que no colisionen. Opera sobre la hoja leida. */
function siguienteIdBanqueoProgreso(h) {
  var reReal = /^bqp-(\d+)$/;
  var reDemo = /^bqp-demo-(\d+)$/;
  var max = h.filas.reduce(function (acc, f) {
    var id = String(celdaBanqueo(h, f.cruda, 'id_progreso')).trim();
    var m = reReal.exec(id) || reDemo.exec(id);
    return m ? Math.max(acc, Number(m[1])) : acc;
  }, 0);
  var correlativo = String(max + 1);
  while (correlativo.length < 3) correlativo = '0' + correlativo;
  return 'bqp-' + correlativo;
}

/** Actualiza o crea la fila de progreso para (idUsuario, curso): +1 respondida,
 *  +1 correcta si `correcta`, ultima_practica = hoyStr. Localiza columnas por
 *  header (nunca por indice). Mantiene sincronizada la copia leida `h`. */
function registrarProgresoBanqueo(h, idUsuario, curso, correcta, hoyStr) {
  var col = h.col;
  var existente = null;
  for (var i = 0; i < h.filas.length; i++) {
    var cr = h.filas[i].cruda;
    if (String(celdaBanqueo(h, cr, 'id_usuario')).trim() === idUsuario &&
        String(celdaBanqueo(h, cr, 'curso')).trim() === curso) {
      existente = h.filas[i];
      break;
    }
  }

  if (existente) {
    var respondidas = (Number(celdaBanqueo(h, existente.cruda, 'respondidas')) || 0) + 1;
    var correctas = (Number(celdaBanqueo(h, existente.cruda, 'correctas')) || 0) + (correcta ? 1 : 0);
    h.hoja.getRange(existente.rowNum, col['respondidas'] + 1).setValue(respondidas);
    h.hoja.getRange(existente.rowNum, col['correctas'] + 1).setValue(correctas);
    h.hoja.getRange(existente.rowNum, col['ultima_practica'] + 1).setValue(hoyStr);
    existente.cruda[col['respondidas']] = respondidas;
    existente.cruda[col['correctas']] = correctas;
    existente.cruda[col['ultima_practica']] = hoyStr;
    return {
      id_progreso: String(celdaBanqueo(h, existente.cruda, 'id_progreso')).trim(),
      id_usuario: idUsuario,
      curso: curso,
      respondidas: respondidas,
      correctas: correctas,
      ultima_practica: hoyStr,
    };
  }

  var nuevoId = siguienteIdBanqueoProgreso(h);
  var respondidasN = 1;
  var correctasN = correcta ? 1 : 0;
  var fila = h.headers.map(function (header) {
    switch (header) {
      case 'id_progreso': return nuevoId;
      case 'id_usuario': return idUsuario;
      case 'curso': return curso;
      case 'respondidas': return respondidasN;
      case 'correctas': return correctasN;
      case 'ultima_practica': return hoyStr;
      default: return '';
    }
  });
  h.hoja.appendRow(fila);
  var cruda = fila.slice();
  h.filas.push({ cruda: cruda, rowNum: h.hoja.getLastRow() });
  return {
    id_progreso: nuevoId,
    id_usuario: idUsuario,
    curso: curso,
    respondidas: respondidasN,
    correctas: correctasN,
    ultima_practica: hoyStr,
  };
}

/** Registra una respuesta (o lista de respuestas) de practica. Params:
 *  datos:{ curso, correcta_bool } o datos:{ respuestas:[{curso, correcta_bool}] }.
 *  Escritura con lock (lo toma manejar()). Si banqueo_progreso no existe:
 *  { ok:false, error:'El banco aún no está configurado.' }. */
function accRegistrarRespuestaBanqueo(bd, sesion, params) {
  var datos = params.datos || {};
  var esLista = Array.isArray(datos.respuestas);
  var respuestas = esLista
    ? datos.respuestas
    : [{ curso: datos.curso, correcta_bool: datos.correcta_bool }];

  var h = leerHojaBanqueo(BANQUEO_HOJA_PROGRESO);
  if (!h) return { ok: false, error: 'El banco aún no está configurado.' };

  var requeridas = ['id_progreso', 'id_usuario', 'curso', 'respondidas', 'correctas', 'ultima_practica'];
  for (var r = 0; r < requeridas.length; r++) {
    if (h.col[requeridas[r]] === undefined) {
      return { ok: false, error: 'La hoja de progreso del banco no tiene la columna "' + requeridas[r] + '".' };
    }
  }

  var hoyStr = hoy(bd);
  var acumulado = [];
  for (var k = 0; k < respuestas.length; k++) {
    var curso = String(respuestas[k] && respuestas[k].curso != null ? respuestas[k].curso : '').trim();
    if (!curso) return { ok: false, error: 'Falta indicar el curso de la respuesta.' };
    var cb = respuestas[k].correcta_bool;
    var correcta = cb === true || cb === 'true' || cb === 1 || cb === '1';
    acumulado.push(registrarProgresoBanqueo(h, sesion.id_usuario, curso, correcta, hoyStr));
  }

  return { ok: true, progreso: esLista ? acumulado : acumulado[0] };
}
