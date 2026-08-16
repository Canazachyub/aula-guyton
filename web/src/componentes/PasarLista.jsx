// Bloque compartido "pasar lista": elegir curso y clase, marcar el estado de
// cada alumno matriculado y guardar de una sola vez. Lo usan docente (solo sus
// clases), auxiliar (cualquier clase) y superadmin.
//
// NOTA DE ARQUITECTURA: es la unica pieza de componentes/ que habla con la
// capa de datos. Vive aqui (y no duplicada en tres paneles) porque la regla
// mayor de la guia es que un panel nunca importa de otro panel.

import { useState } from 'react'
import { useSesion } from '../auth/SesionContexto.jsx'
import {
  obtenerClases,
  obtenerCursosDelUsuario,
  obtenerRosterDeClase,
  registrarAsistencia,
} from '../api/cliente.js'
import { useDatos } from './useDatos.js'
import Boton from './Boton.jsx'
import Cargando from './Cargando.jsx'
import EstadoVacio from './EstadoVacio.jsx'
import Tarjeta from './Tarjeta.jsx'
import { fechaCorta } from './formatos.js'

const ESTADOS = ['presente', 'tardanza', 'falta', 'justificado']

export default function PasarLista() {
  const { sesion } = useSesion()
  const [idCicloCurso, setIdCicloCurso] = useState('')
  const [idClase, setIdClase] = useState('')
  const [marcas, setMarcas] = useState({})
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const cursos = useDatos(() => obtenerCursosDelUsuario(sesion), sesion.id_usuario, `pasar-lista-cursos:${sesion.id_usuario}`)
  const clases = useDatos(
    () => (idCicloCurso ? obtenerClases(sesion, idCicloCurso) : Promise.resolve([])),
    idCicloCurso,
    `pasar-lista-clases:${idCicloCurso}:${sesion.id_usuario}`,
  )
  const roster = useDatos(
    async () => {
      if (!idClase) return []
      const filas = await obtenerRosterDeClase(sesion, idClase)
      const iniciales = {}
      for (const f of filas) {
        iniciales[f.id_usuario] = f.asistencia?.estado ?? 'presente'
      }
      setMarcas(iniciales)
      setMensaje(null)
      return filas
    },
    idClase,
    `pasar-lista-roster:${idClase}:${sesion.id_usuario}`,
  )

  const alGuardar = async () => {
    setMensaje(null)
    setGuardando(true)
    const registros = roster.datos.map((f) => ({
      id_usuario: f.id_usuario,
      estado: marcas[f.id_usuario] ?? 'presente',
    }))
    const resultado = await registrarAsistencia(sesion, { id_clase: idClase, registros })
    setGuardando(false)
    if (resultado.ok) {
      setMensaje({ tipo: 'exito', texto: 'Lista guardada.' })
      roster.recargar()
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

  if (cursos.cargando) return <Cargando texto="Cargando tus cursos…" />
  if (cursos.error) return <p className="gy-alerta gy-alerta--error">{cursos.error}</p>
  if (cursos.datos.length === 0) {
    return <EstadoVacio titulo="No tienes cursos disponibles" detalle="Cuando te asignen un curso, podrás pasar lista aquí." />
  }

  return (
    <Tarjeta titulo="Pasar lista">
      <div className="gy-grilla gy-grilla--2">
        <div className="gy-campo">
          <label className="gy-etiqueta" htmlFor="pl-curso">Curso</label>
          <select
            id="pl-curso"
            className="gy-select"
            value={idCicloCurso}
            onChange={(e) => { setIdCicloCurso(e.target.value); setIdClase('') }}
          >
            <option value="">Elige un curso…</option>
            {cursos.datos.map((cc) => (
              <option key={cc.id_ciclo_curso} value={cc.id_ciclo_curso}>
                {cc.curso_nombre} — {cc.ciclo_nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="gy-campo">
          <label className="gy-etiqueta" htmlFor="pl-clase">Clase</label>
          <select
            id="pl-clase"
            className="gy-select"
            value={idClase}
            onChange={(e) => setIdClase(e.target.value)}
            disabled={!idCicloCurso || clases.cargando}
          >
            <option value="">Elige una clase…</option>
            {(clases.datos ?? []).map((c) => (
              <option key={c.id_clase} value={c.id_clase}>
                {fechaCorta(c.fecha)} · {c.tema}
              </option>
            ))}
          </select>
        </div>
      </div>

      {idClase && (
        <>
          {roster.cargando && <Cargando texto="Cargando alumnos…" />}
          {!roster.cargando && roster.datos.length === 0 && (
            <EstadoVacio
              titulo="No hay alumnos matriculados en este ciclo"
              detalle="Solo aparecen alumnos con matrícula en estado matriculado."
            />
          )}
          {!roster.cargando && roster.datos.length > 0 && (
            <>
              <ul className="gy-lista">
                {roster.datos.map((f) => (
                  <li key={f.id_usuario} className="gy-lista-item">
                    <div className="gy-lista-item-principal">
                      <p className="gy-lista-item-titulo">{f.apellidos}, {f.nombres}</p>
                      <p className="gy-lista-item-detalle">DNI {f.dni}</p>
                    </div>
                    <select
                      className="gy-select gy-select--auto"
                      value={marcas[f.id_usuario] ?? 'presente'}
                      onChange={(e) => setMarcas((m) => ({ ...m, [f.id_usuario]: e.target.value }))}
                      aria-label={`Asistencia de ${f.nombres} ${f.apellidos}`}
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
              {mensaje && (
                <p className={`gy-alerta gy-alerta--${mensaje.tipo}`} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>
                  {mensaje.texto}
                </p>
              )}
              <Boton variante="acento" onClick={alGuardar} disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar lista'}
              </Boton>
            </>
          )}
        </>
      )}
    </Tarjeta>
  )
}
