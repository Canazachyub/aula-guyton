// Grabaciones (superadmin): pega enlaces de YouTube de las clases grabadas y
// asígnalos a cualquier ciclo/curso, incluidos los ciclos pasados. No duplica
// la lógica de materiales: una grabación es una fila de `materiales` con
// tipo 'video_grabado', estado 'publicado' y url_drive = enlace de YouTube
// (decisión cerrada en docs/BANQUEO.md §4). Reutiliza guardarMaterial e idYouTube.

import { useState } from 'react'
import { useSesion } from '../../auth/SesionContexto.jsx'
import {
  guardarMaterial,
  obtenerCursosDelUsuario,
  obtenerMateriales,
} from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Boton from '../../componentes/Boton.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import { fechaCorta, idYouTube } from '../../componentes/formatos.js'

const FORM_VACIO = { titulo: '', url: '' }

export default function Grabaciones() {
  const { sesion } = useSesion()
  const [idElegido, setIdElegido] = useState('')
  const [formulario, setFormulario] = useState({ ...FORM_VACIO })
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  // Para el superadmin, obtenerCursosDelUsuario trae TODOS los ciclo_cursos
  // (de todos los ciclos, incluidos los finalizados), ya resueltos con nombres.
  const cursos = useDatos(() => obtenerCursosDelUsuario(sesion), sesion.id_usuario)
  const seleccionado = idElegido || cursos.datos?.[0]?.id_ciclo_curso || ''

  const materiales = useDatos(
    () => (seleccionado ? obtenerMateriales(sesion, seleccionado) : Promise.resolve([])),
    seleccionado,
  )

  const grabaciones = (materiales.datos ?? []).filter((m) => m.tipo === 'video_grabado')
  const idVideoForm = idYouTube(formulario.url)

  const alGuardar = async (evento) => {
    evento.preventDefault()
    setMensaje(null)
    if (!seleccionado) {
      setMensaje({ tipo: 'error', texto: 'Elige primero un ciclo y curso.' })
      return
    }
    if (!formulario.titulo.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ponle un título a la grabación.' })
      return
    }
    if (!idVideoForm) {
      setMensaje({ tipo: 'error', texto: 'Pega un enlace válido de YouTube (video o playlist embebible).' })
      return
    }
    setGuardando(true)
    const resultado = await guardarMaterial(sesion, {
      id_ciclo_curso: seleccionado,
      tipo: 'video_grabado',
      titulo: formulario.titulo.trim(),
      url_drive: formulario.url.trim(),
      semana: '',
      estado: 'publicado',
    })
    setGuardando(false)
    if (resultado.ok) {
      setFormulario({ ...FORM_VACIO })
      setMensaje({ tipo: 'exito', texto: 'Grabación asignada. Ya aparece para los alumnos del ciclo.' })
      materiales.recargar()
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

  if (cursos.cargando) return <Cargando texto="Cargando los ciclos y cursos…" />
  if (cursos.error) return <p className="gy-alerta gy-alerta--error">{cursos.error}</p>
  if (cursos.datos.length === 0) {
    return (
      <EstadoVacio
        titulo="No hay ciclos con cursos todavía"
        detalle="Crea un ciclo y asígnale cursos para poder colgar sus clases grabadas."
      />
    )
  }

  return (
    <div>
      <p className="gy-texto-suave" style={{ fontSize: '0.88rem', marginBottom: '1rem' }}>
        Pega el enlace de YouTube de una clase grabada y asígnala a cualquier ciclo o curso,
        incluidos los ciclos pasados. Se guarda como material publicado y el alumno la ve
        embebida en sus Materiales.
      </p>

      {mensaje && (
        <p className={`gy-alerta gy-alerta--${mensaje.tipo}`} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>
          {mensaje.texto}
        </p>
      )}

      <Tarjeta titulo="Nueva grabación" icono="video" tonoIcono="acento">
        <form onSubmit={alGuardar} noValidate>
          <div className="gy-campo">
            <label className="gy-etiqueta" htmlFor="grb-cc">Ciclo y curso</label>
            <select
              id="grb-cc"
              className="gy-select"
              value={seleccionado}
              onChange={(e) => { setIdElegido(e.target.value); setMensaje(null) }}
            >
              {cursos.datos.map((c) => (
                <option key={c.id_ciclo_curso} value={c.id_ciclo_curso}>
                  {c.ciclo_nombre} · {c.curso_nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="gy-campo">
            <label className="gy-etiqueta" htmlFor="grb-titulo">Título de la grabación</label>
            <input
              id="grb-titulo"
              className="gy-input"
              type="text"
              placeholder="Ej. Geografía · Semana 1: El relieve peruano"
              value={formulario.titulo}
              onChange={(e) => setFormulario((f) => ({ ...f, titulo: e.target.value }))}
            />
          </div>

          <div className="gy-campo">
            <label className="gy-etiqueta" htmlFor="grb-url">Enlace de YouTube</label>
            <input
              id="grb-url"
              className="gy-input"
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={formulario.url}
              onChange={(e) => setFormulario((f) => ({ ...f, url: e.target.value }))}
            />
            <p className="gy-ayuda-campo">
              Acepta enlaces de youtube.com/watch, youtu.be, /embed o /shorts. Copia el enlace
              del video (o de la playlist del ciclo) desde el canal de la academia.
            </p>
          </div>

          {formulario.url.trim() && (
            idVideoForm ? (
              <div className="gy-video-embed">
                <iframe
                  src={`https://www.youtube.com/embed/${idVideoForm}`}
                  title="Vista previa de la grabación"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="gy-ayuda-campo" style={{ color: 'var(--gy-error)' }}>
                Ese enlace no parece de YouTube; revísalo antes de guardar.
              </p>
            )
          )}

          <div className="gy-acciones-fila">
            <Boton type="submit" variante="acento" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Asignar grabación'}
            </Boton>
          </div>
        </form>
      </Tarjeta>

      <p className="gy-micro gy-seccion-micro" style={{ marginTop: '1.4rem' }}>
        Grabaciones ya asignadas a este curso
      </p>

      {materiales.cargando && <Cargando texto="Cargando grabaciones…" />}
      {!materiales.cargando && grabaciones.length === 0 && (
        <EstadoVacio
          titulo="Este curso todavía no tiene grabaciones"
          detalle="Pega el enlace de YouTube de la primera clase grabada con el formulario de arriba."
        />
      )}

      {!materiales.cargando && grabaciones.length > 0 && (
        <div className="gy-grilla gy-grilla--2">
          {grabaciones.map((m) => {
            const idVideo = idYouTube(m.url_drive)
            return (
              <Tarjeta key={m.id_material}>
                <h3 className="gy-tarjeta-titulo">{m.titulo}</h3>
                <p className="gy-tarjeta-subtitulo">Publicada el {fechaCorta(m.fecha_publicacion)}</p>
                {idVideo && (
                  <div className="gy-video-embed">
                    <iframe
                      src={`https://www.youtube.com/embed/${idVideo}`}
                      title={m.titulo}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                )}
                <div className="gy-material-pie">
                  <a
                    className="gy-boton gy-boton--secundario gy-boton--chico"
                    href={m.url_drive}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir en YouTube
                  </a>
                </div>
              </Tarjeta>
            )
          })}
        </div>
      )}
    </div>
  )
}
