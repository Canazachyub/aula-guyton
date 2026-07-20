// Materiales del docente: ve TODOS los de sus cursos (incluidos borradores),
// puede alternar borrador <-> publicado y subir nuevos. Al crear una
// resolucion solo se ofrecen practicas del MISMO ciclo_curso (regla 5).

import { useState } from 'react'
import { useSesion } from '../../auth/SesionContexto.jsx'
import {
  guardarMaterial,
  obtenerClases,
  obtenerCursosDelUsuario,
  obtenerMateriales,
} from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Insignia from '../../componentes/Insignia.jsx'
import Boton from '../../componentes/Boton.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import { fechaCorta, tipoMaterial } from '../../componentes/formatos.js'

const FORM_VACIO = {
  tipo: 'pdf_teoria',
  titulo: '',
  semana: '',
  url_drive: '',
  id_clase: '',
  id_material_padre: '',
  estado: 'borrador',
}

export default function Materiales() {
  const { sesion } = useSesion()
  const [idCicloCurso, setIdCicloCurso] = useState('')
  const [formulario, setFormulario] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const cursos = useDatos(() => obtenerCursosDelUsuario(sesion), sesion.id_usuario)
  const materiales = useDatos(
    () => (idCicloCurso ? obtenerMateriales(sesion, idCicloCurso) : Promise.resolve([])),
    idCicloCurso,
  )
  const clases = useDatos(
    () => (idCicloCurso ? obtenerClases(sesion, idCicloCurso) : Promise.resolve([])),
    idCicloCurso,
  )

  // La lista agrupada trae las practicas como raiz y las resoluciones dentro.
  // Para el selector de "practica que resuelve" se aplanan las practicas.
  const practicas = (materiales.datos ?? []).filter((m) => m.tipo === 'pdf_practica')

  const alternarEstado = async (material, nuevoEstado) => {
    setMensaje(null)
    const resultado = await guardarMaterial(sesion, { ...material, estado: nuevoEstado })
    if (resultado.ok) {
      materiales.recargar()
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

  const alGuardar = async (evento) => {
    evento.preventDefault()
    setMensaje(null)
    setGuardando(true)
    const resultado = await guardarMaterial(sesion, { ...formulario, id_ciclo_curso: idCicloCurso })
    setGuardando(false)
    if (resultado.ok) {
      setFormulario(null)
      setMensaje({ tipo: 'exito', texto: 'Material guardado.' })
      materiales.recargar()
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
        detalle="Cuando la academia te asigne un curso, podrás subir materiales aquí."
      />
    )
  }

  const renderMaterial = (m, esResolucion = false) => (
    <div className={esResolucion ? 'gy-material-resolucion' : 'gy-material-fila'}>
      <div className="gy-lista-item-principal">
        <p className="gy-lista-item-titulo">
          {esResolucion && <span className="gy-texto-suave">Resolución: </span>}
          {m.titulo}
        </p>
        <p className="gy-lista-item-detalle">
          {tipoMaterial(m.tipo)}
          {m.semana !== '' && m.semana != null && ` · Semana ${m.semana}`}
          {` · ${fechaCorta(m.fecha_publicacion)}`}
        </p>
      </div>
      <div className="gy-acciones-fila">
        <Insignia valor={m.estado} />
        <a href={m.url_drive} target="_blank" rel="noopener noreferrer">Abrir</a>
        {m.estado === 'borrador' ? (
          <Boton chico onClick={() => alternarEstado(m, 'publicado')}>Publicar</Boton>
        ) : (
          <Boton chico variante="secundario" onClick={() => alternarEstado(m, 'borrador')}>
            Pasar a borrador
          </Boton>
        )}
      </div>
    </div>
  )

  return (
    <div>
      <Tarjeta
        titulo="Materiales por curso"
        acciones={
          <Boton variante="acento" onClick={() => { setFormulario({ ...FORM_VACIO }); setMensaje(null) }} disabled={!idCicloCurso}>
            Nuevo material
          </Boton>
        }
      >
        <div className="gy-campo">
          <label className="gy-etiqueta" htmlFor="mtl-curso">Curso</label>
          <select
            id="mtl-curso"
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

        {!idCicloCurso && <EstadoVacio titulo="Elige un curso para gestionar sus materiales" />}
        {idCicloCurso && materiales.cargando && <Cargando texto="Cargando materiales…" />}
        {idCicloCurso && !materiales.cargando && materiales.datos.length === 0 && (
          <EstadoVacio
            titulo="Este curso todavía no tiene materiales"
            detalle="Sube la primera práctica, teoría o grabación con el botón Nuevo material."
          />
        )}
        {idCicloCurso && !materiales.cargando && materiales.datos.length > 0 && (
          <ul className="gy-lista">
            {materiales.datos.map((m) => (
              <li key={m.id_material} className="gy-lista-item gy-lista-item--columna">
                {renderMaterial(m)}
                {m.resoluciones.length > 0 && (
                  <div className="gy-material-resoluciones">
                    {m.resoluciones.map((r) => (
                      <div key={r.id_material}>{renderMaterial(r, true)}</div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {idCicloCurso && !materiales.cargando && (
          <p className="gy-ayuda-campo" style={{ marginTop: '0.75rem' }}>
            Los alumnos solo ven los materiales en estado publicado. Lo que esté en borrador
            todavía no les aparece.
          </p>
        )}
      </Tarjeta>

      {formulario && (
        <Tarjeta titulo="Nuevo material">
          <form onSubmit={alGuardar} noValidate>
            <div className="gy-grilla gy-grilla--2">
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="mtl-tipo">Tipo</label>
                <select
                  id="mtl-tipo"
                  className="gy-select"
                  value={formulario.tipo}
                  onChange={(e) => setFormulario((f) => ({ ...f, tipo: e.target.value, id_material_padre: '' }))}
                >
                  <option value="pdf_teoria">Teoría PDF</option>
                  <option value="pdf_practica">Práctica PDF</option>
                  <option value="pdf_resolucion">Resolución PDF</option>
                  <option value="video_grabado">Video grabado</option>
                  <option value="enlace">Enlace</option>
                </select>
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="mtl-semana">Semana (opcional)</label>
                <input
                  id="mtl-semana"
                  className="gy-input"
                  type="number"
                  min="1"
                  placeholder="Ej. 1"
                  value={formulario.semana}
                  onChange={(e) => setFormulario((f) => ({ ...f, semana: e.target.value }))}
                />
              </div>
            </div>

            <div className="gy-campo">
              <label className="gy-etiqueta" htmlFor="mtl-titulo">Título</label>
              <input
                id="mtl-titulo"
                className="gy-input"
                type="text"
                placeholder="Ej. Práctica 2: Ecuaciones"
                value={formulario.titulo}
                onChange={(e) => setFormulario((f) => ({ ...f, titulo: e.target.value }))}
              />
            </div>

            <div className="gy-campo">
              <label className="gy-etiqueta" htmlFor="mtl-url">Enlace de Drive (o externo)</label>
              <input
                id="mtl-url"
                className="gy-input"
                type="text"
                placeholder="https://drive.google.com/..."
                value={formulario.url_drive}
                onChange={(e) => setFormulario((f) => ({ ...f, url_drive: e.target.value }))}
              />
              <p className="gy-ayuda-campo">
                Sube el archivo a la carpeta del curso en Drive y pega aquí su enlace.
              </p>
            </div>

            <div className="gy-grilla gy-grilla--2">
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="mtl-clase">Clase asociada (opcional)</label>
                <select
                  id="mtl-clase"
                  className="gy-select"
                  value={formulario.id_clase}
                  onChange={(e) => setFormulario((f) => ({ ...f, id_clase: e.target.value }))}
                >
                  <option value="">Sin clase asociada</option>
                  {(clases.datos ?? []).map((c) => (
                    <option key={c.id_clase} value={c.id_clase}>
                      {fechaCorta(c.fecha)} · {c.tema}
                    </option>
                  ))}
                </select>
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="mtl-estado">Estado</label>
                <select
                  id="mtl-estado"
                  className="gy-select"
                  value={formulario.estado}
                  onChange={(e) => setFormulario((f) => ({ ...f, estado: e.target.value }))}
                >
                  <option value="borrador">Borrador (aún no visible)</option>
                  <option value="publicado">Publicado (visible para alumnos)</option>
                </select>
              </div>
            </div>

            {formulario.tipo === 'pdf_resolucion' && (
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="mtl-padre">¿Qué práctica resuelve?</label>
                <select
                  id="mtl-padre"
                  className="gy-select"
                  value={formulario.id_material_padre}
                  onChange={(e) => setFormulario((f) => ({ ...f, id_material_padre: e.target.value }))}
                >
                  <option value="">Elige la práctica…</option>
                  {practicas.map((p) => (
                    <option key={p.id_material} value={p.id_material}>{p.titulo}</option>
                  ))}
                </select>
                <p className="gy-ayuda-campo">
                  Solo se ofrecen prácticas de este mismo curso; la resolución se mostrará
                  agrupada bajo la práctica elegida.
                </p>
              </div>
            )}

            <div className="gy-acciones-fila">
              <Boton type="submit" variante="acento" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar material'}
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
