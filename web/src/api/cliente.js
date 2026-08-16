// ==========================================================================
// UNICA capa de datos del aula. Ningun componente importa el mock ni el cliente
// real por su cuenta: todo pasa por aqui (ver docs/GUIA_FRONTEND.md seccion 4).
//
// Este archivo es solo un SELECTOR: elige la implementacion segun el entorno.
//   - Si import.meta.env.VITE_API_URL tiene valor  -> clienteApi.js  (fetch al
//     Web App de Google Apps Script, backend real).
//   - Si esta vacio o undefined                    -> clienteMock.js (datos DEMO
//     en memoria, con retardo artificial para estados de carga reales).
//
// Ambas implementaciones exponen EXACTAMENTE las mismas funciones con las
// mismas firmas y formas de respuesta, asi que ningun componente cambia sus
// imports: siguen importando de '../api/cliente.js'. Cambiar de modo es solo
// definir (o dejar vacio) VITE_API_URL en el entorno de build; no se toca codigo.
// ==========================================================================

import * as clienteApi from './clienteApi.js'
import * as clienteMock from './clienteMock.js'

const impl = import.meta.env.VITE_API_URL ? clienteApi : clienteMock

// Bandera de entorno: true cuando NO hay backend real configurado (VITE_API_URL
// vacio => corre el mock en memoria). La UI la usa para mostrar avisos "DEMO"
// SOLO en ese modo; en produccion (con VITE_API_URL) deben desaparecer.
export const MODO_DEMO = !import.meta.env.VITE_API_URL

// Sesion
export const iniciarSesion = impl.iniciarSesion
export const cerrarSesion = impl.cerrarSesion
export const obtenerSesion = impl.obtenerSesion

// Registro / matricula publica (sin sesion, desde el login)
export const obtenerCiclosAbiertos = impl.obtenerCiclosAbiertos
export const registrarse = impl.registrarse

// Lecturas
export const obtenerCiclosDelUsuario = impl.obtenerCiclosDelUsuario
export const obtenerCursosDelUsuario = impl.obtenerCursosDelUsuario
export const obtenerHorario = impl.obtenerHorario
export const obtenerClases = impl.obtenerClases
export const obtenerMateriales = impl.obtenerMateriales
export const obtenerPagos = impl.obtenerPagos
export const obtenerAsistencias = impl.obtenerAsistencias
export const obtenerRosterDeClase = impl.obtenerRosterDeClase
export const obtenerAnuncios = impl.obtenerAnuncios
export const obtenerMatriculas = impl.obtenerMatriculas
export const obtenerUsuarios = impl.obtenerUsuarios
export const obtenerConfig = impl.obtenerConfig
export const obtenerCursosCatalogo = impl.obtenerCursosCatalogo

// Banqueo Guyton (lecturas)
export const obtenerBanqueoCursos = impl.obtenerBanqueoCursos
export const obtenerBanqueoTemas = impl.obtenerBanqueoTemas
export const obtenerBanqueoPreguntas = impl.obtenerBanqueoPreguntas
export const obtenerBanqueoProgreso = impl.obtenerBanqueoProgreso

// Escrituras
export const registrarPago = impl.registrarPago
export const verificarPago = impl.verificarPago
export const guardarClase = impl.guardarClase
export const guardarMaterial = impl.guardarMaterial
export const registrarAsistencia = impl.registrarAsistencia
export const publicarAnuncio = impl.publicarAnuncio
export const guardarCiclo = impl.guardarCiclo
export const guardarCurso = impl.guardarCurso
export const guardarAsignacion = impl.guardarAsignacion
export const guardarUsuario = impl.guardarUsuario

// Banqueo Guyton (escritura)
export const registrarRespuestaBanqueo = impl.registrarRespuestaBanqueo
