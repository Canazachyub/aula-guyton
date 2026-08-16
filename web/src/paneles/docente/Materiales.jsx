// Materiales del docente: ve TODOS los de sus cursos (incluidos borradores,
// con su insignia) y puede alternar borrador <-> publicado. Tarjetas por tipo
// con las resoluciones pegadas a su practica. Al crear una resolucion solo se
// ofrecen practicas del MISMO ciclo_curso (regla 5 del modelo).

import { useState } from 'react'
import { useLocation } from 'react-router-dom'
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
import Icono from '../../componentes/Icono.jsx'
import { META_TIPO_MATERIAL, fechaCorta, tipoMaterial } from '../../componentes/formatos.js'

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
  const ubicacion = useLocation()
  // Permite llegar con un curso preseleccionado (desde Mis cursos).
  const [idElegido, setIdElegido] = useState(ubicacion.state?.idCicloCurso ?? '')
  const [formulario, setFormulario] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const cursos = useDatos(() => obtenerCursosDelUsuario(sesion), sesion.id_usuario, `doc-materiales-cursos:${sesion.id_usuario}`)
  const seleccionado = idElegido || cursos.datos?.[0]?.id_ciclo_curso || ''

  const materiales = useDatos(
    () => (seleccionado ? obtenerMateriales(sesion, seleccionado) : Promise.resolve([])),
    seleccionado,
    `doc-materiales:${seleccionado}:${sesion.id_usuario}`,
  )
  const clases = useDatos(
    () => (seleccionado ? obtenerClases(sesion, seleccionado) : Promise.resolve([])),
    seleccionado,
    `doc-materiales-clases:${seleccionado}:${sesion.id_usuario}`,
  )

  // Para el selector de "practica que resuelve" se aplanan las practicas raiz.
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
    const resultado = await guardarMaterial(sesion, { ...formulario, id_ciclo_curso: seleccionado })
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

  const renderAcciones = (m) => (
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
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
        <div className="gy-chips" style={{ marginBottom: 0 }} role="tablist" aria-label="Cursos">
          {cursos.datos.map((c) => (
            <button
              key={c.id_ciclo_curso}
              type="button"
              role="tab"
              aria-selected={seleccionado === c.id_ciclo_curso}
              className={`gy-chip${seleccionado === c.id_ciclo_curso ? ' gy-chip--activo' : ''}`}
              onClick={() => { setIdElegido(c.id_ciclo_curso); setFormulario(null); setMensaje(null) }}
            >
              {c.curso_nombre}
            </button>
          ))}
        </div>
        <Boton variante="acento" onClick={() => { setFormulario({ ...FORM_VACIO }); setMensaje(null) }}>
          Nuevo material
        </Boton>
      </div>

      {mensaje && (
        <p className={`gy-alerta gy-alerta--${mensaje.tipo}`} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>
          {mensaje.texto}
        </p>
      )}

      {materiales.cargando && <Cargando texto="Cargando materiales…" />}
      {!materiales.cargando && materiales.datos.length === 0 && (
        <EstadoVacio
          titulo="Este curso todavía no tiene materiales"
          detalle="Sube la primera práctica, teoría o grabación con el botón Nuevo material."
        />
      )}

      {!materiales.cargando && materiales.datos.length > 0 && (
        <>
          <div className="gy-grilla gy-grilla--2">
            {materiales.datos.map((m) => {
              const meta = META_TIPO_MATERIAL[m.tipo] ?? META_TIPO_MATERIAL.enlace
              return (
                <Tarjeta key={m.id_material}>
                  <div className="gy-tarjeta-cabecera">
                    <span className={`gy-icono gy-icono--${meta.tono}`}>
                      <Icono nombre={meta.icono} tamano={19} />
                    </span>
                    <div className="gy-tarjeta-cabecera-texto">
                      <h3 className="gy-tarjeta-titulo">{m.titulo}</h3>
                      <p className="gy-tarjeta-subtitulo">
                        {tipoMaterial(m.tipo)}
                        {m.semana !== '' && m.semana != null && ` · Semana ${m.semana}`}
                        {` · ${fechaCorta(m.fecha_publicacion)}`}
                      </p>
                    </div>
                  </div>
                  {renderAcciones(m)}
                  {m.resoluciones.map((r) => (
                    <div key={r.id_material} className="gy-resolucion-bloque">
                      <div className="gy-lista-item-principal">
                        <p className="gy-resolucion-bloque-titulo">
                          <span className="gy-texto-suave">Resolución: </span>
                          {r.titulo}
                        </p>
                        <p className="gy-resolucion-bloque-detalle">
                          {fechaCorta(r.fecha_publicacion)}
                        </p>
                      </div>
                      {renderAcciones(r)}
                    </div>
                  ))}
                </Tarjeta>
              )
            })}
          </div>
          <p className="gy-ayuda-campo" style={{ marginTop: '0.75rem' }}>
            Los alumnos solo ven los materiales en estado publicado. Lo que esté en borrador
            todavía no les aparece.
          </p>
        </>
      )}

      {formulario && (
        <Tarjeta titulo="Nuevo material" icono="mas" tonoIcono="acento" className="gy-formulario-flotante">
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
