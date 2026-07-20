// Clases del docente: programa nuevas clases, las edita y las marca
// dictada/cancelada. Solo sobre sus propios ciclo_cursos (la capa de datos
// rechaza cualquier otro).

import { useState } from 'react'
import { useSesion } from '../../auth/SesionContexto.jsx'
import { guardarClase, obtenerClases, obtenerCursosDelUsuario } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Tabla from '../../componentes/Tabla.jsx'
import Insignia from '../../componentes/Insignia.jsx'
import Boton from '../../componentes/Boton.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import { fechaCorta } from '../../componentes/formatos.js'

const FORM_VACIO = {
  id_clase: '',
  fecha: '',
  hora_inicio: '',
  hora_fin: '',
  tema: '',
  modalidad: 'virtual',
  enlace_en_vivo: '',
  estado: 'programada',
}

export default function Clases() {
  const { sesion } = useSesion()
  const [idCicloCurso, setIdCicloCurso] = useState('')
  const [formulario, setFormulario] = useState(null) // null = formulario cerrado
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const cursos = useDatos(() => obtenerCursosDelUsuario(sesion), sesion.id_usuario)
  const clases = useDatos(
    () => (idCicloCurso ? obtenerClases(sesion, idCicloCurso) : Promise.resolve([])),
    idCicloCurso,
  )

  const abrirNuevo = () => {
    setFormulario({ ...FORM_VACIO })
    setMensaje(null)
  }

  const abrirEdicion = (clase) => {
    setFormulario({ ...clase })
    setMensaje(null)
  }

  const cambiarEstado = async (clase, estado) => {
    setMensaje(null)
    const resultado = await guardarClase(sesion, { ...clase, estado })
    if (resultado.ok) {
      clases.recargar()
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

  const alGuardar = async (evento) => {
    evento.preventDefault()
    setMensaje(null)
    setGuardando(true)
    const resultado = await guardarClase(sesion, { ...formulario, id_ciclo_curso: idCicloCurso })
    setGuardando(false)
    if (resultado.ok) {
      setFormulario(null)
      setMensaje({ tipo: 'exito', texto: 'Clase guardada.' })
      clases.recargar()
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

  if (cursos.cargando) return <Cargando texto="Cargando tus cursos…" />
  if (cursos.error) return <p className="gy-alerta gy-alerta--error">{cursos.error}</p>
  if (cursos.datos.length === 0) {
    return (
      <EstadoVacio
        titulo="No tienes cursos asignados todavía"
        detalle="Cuando la academia te asigne un curso, podrás programar clases aquí."
      />
    )
  }

  const columnas = [
    { clave: 'fecha', titulo: 'Fecha', render: (c) => fechaCorta(c.fecha) },
    { clave: 'hora', titulo: 'Hora', render: (c) => `${c.hora_inicio}–${c.hora_fin}` },
    { clave: 'tema', titulo: 'Tema' },
    { clave: 'modalidad', titulo: 'Modalidad', render: (c) => <Insignia valor={c.modalidad} /> },
    { clave: 'estado', titulo: 'Estado', render: (c) => <Insignia valor={c.estado} /> },
    {
      clave: 'acciones',
      titulo: 'Acciones',
      render: (c) => (
        <div className="gy-acciones-fila">
          <Boton chico variante="secundario" onClick={() => abrirEdicion(c)}>Editar</Boton>
          {c.estado === 'programada' && (
            <>
              <Boton chico onClick={() => cambiarEstado(c, 'dictada')}>Marcar dictada</Boton>
              <Boton chico variante="peligro" onClick={() => cambiarEstado(c, 'cancelada')}>Cancelar</Boton>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <Tarjeta
        titulo="Clases por curso"
        acciones={
          <Boton variante="acento" onClick={abrirNuevo} disabled={!idCicloCurso}>
            Nueva clase
          </Boton>
        }
      >
        <div className="gy-campo">
          <label className="gy-etiqueta" htmlFor="cls-curso">Curso</label>
          <select
            id="cls-curso"
            className="gy-select"
            value={idCicloCurso}
            onChange={(e) => { setIdCicloCurso(e.target.value); setFormulario(null); setMensaje(null) }}
          >
            <option value="">Elige un curso…</option>
            {cursos.datos.map((c) => (
              <option key={c.id_ciclo_curso} value={c.id_ciclo_curso}>
                {c.curso_nombre} — {c.ciclo_nombre}
              </option>
            ))}
          </select>
        </div>

        {mensaje && (
          <p className={`gy-alerta gy-alerta--${mensaje.tipo}`} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>
            {mensaje.texto}
          </p>
        )}

        {!idCicloCurso && <EstadoVacio titulo="Elige un curso para ver y programar sus clases" />}
        {idCicloCurso && clases.cargando && <Cargando texto="Cargando clases…" />}
        {idCicloCurso && !clases.cargando && (
          <Tabla
            columnas={columnas}
            filas={clases.datos}
            llaveFila={(c) => c.id_clase}
            vacio={<EstadoVacio titulo="Este curso todavía no tiene clases" detalle="Programa la primera con el botón Nueva clase." />}
          />
        )}
      </Tarjeta>

      {formulario && (
        <Tarjeta titulo={formulario.id_clase ? 'Editar clase' : 'Nueva clase'}>
          <form onSubmit={alGuardar} noValidate>
            <div className="gy-grilla gy-grilla--3">
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="cls-fecha">Fecha</label>
                <input
                  id="cls-fecha"
                  className="gy-input"
                  type="date"
                  value={formulario.fecha}
                  onChange={(e) => setFormulario((f) => ({ ...f, fecha: e.target.value }))}
                />
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="cls-inicio">Hora de inicio</label>
                <input
                  id="cls-inicio"
                  className="gy-input"
                  type="time"
                  value={formulario.hora_inicio}
                  onChange={(e) => setFormulario((f) => ({ ...f, hora_inicio: e.target.value }))}
                />
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="cls-fin">Hora de fin</label>
                <input
                  id="cls-fin"
                  className="gy-input"
                  type="time"
                  value={formulario.hora_fin}
                  onChange={(e) => setFormulario((f) => ({ ...f, hora_fin: e.target.value }))}
                />
              </div>
            </div>

            <div className="gy-campo">
              <label className="gy-etiqueta" htmlFor="cls-tema">Tema de la sesión</label>
              <input
                id="cls-tema"
                className="gy-input"
                type="text"
                placeholder="Ej. Ecuaciones lineales"
                value={formulario.tema}
                onChange={(e) => setFormulario((f) => ({ ...f, tema: e.target.value }))}
              />
            </div>

            <div className="gy-grilla gy-grilla--2">
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="cls-modalidad">Modalidad</label>
                <select
                  id="cls-modalidad"
                  className="gy-select"
                  value={formulario.modalidad}
                  onChange={(e) => setFormulario((f) => ({ ...f, modalidad: e.target.value }))}
                >
                  <option value="virtual">Virtual</option>
                  <option value="presencial">Presencial</option>
                </select>
              </div>
              {formulario.id_clase && (
                <div className="gy-campo">
                  <label className="gy-etiqueta" htmlFor="cls-estado">Estado</label>
                  <select
                    id="cls-estado"
                    className="gy-select"
                    value={formulario.estado}
                    onChange={(e) => setFormulario((f) => ({ ...f, estado: e.target.value }))}
                  >
                    <option value="programada">Programada</option>
                    <option value="dictada">Dictada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              )}
            </div>

            {formulario.modalidad === 'virtual' && (
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="cls-enlace">Enlace de la clase en vivo</label>
                <input
                  id="cls-enlace"
                  className="gy-input"
                  type="text"
                  placeholder="Ej. https://meet.google.com/..."
                  value={formulario.enlace_en_vivo}
                  onChange={(e) => setFormulario((f) => ({ ...f, enlace_en_vivo: e.target.value }))}
                />
              </div>
            )}

            <div className="gy-acciones-fila">
              <Boton type="submit" variante="acento" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar clase'}
              </Boton>
              <Boton variante="secundario" onClick={() => setFormulario(null)} disabled={guardando}>
                Cancelar
              </Boton>
            </div>
          </form>
        </Tarjeta>
      )}
    </div>
  )
}
