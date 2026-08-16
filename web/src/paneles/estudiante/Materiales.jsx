// Materiales del estudiante: SOLO publicados (el patron "fila publica" lo
// aplica la capa de datos: un borrador jamas llega hasta aqui). Tarjetas por
// tipo de material, agrupadas por semana, con las resoluciones pegadas a su
// practica (no sueltas).

import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useSesion } from '../../auth/SesionContexto.jsx'
import { obtenerCursosDelUsuario, obtenerMateriales } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import Icono from '../../componentes/Icono.jsx'
import { META_TIPO_MATERIAL, fechaCorta, idYouTube, tipoMaterial } from '../../componentes/formatos.js'

function TarjetaMaterial({ material }) {
  const meta = META_TIPO_MATERIAL[material.tipo] ?? META_TIPO_MATERIAL.enlace
  // Solo las grabaciones cuyo enlace es de YouTube se embeben como reproductor;
  // cualquier otro enlace (Drive, etc.) mantiene el comportamiento normal.
  const idVideo = material.tipo === 'video_grabado' ? idYouTube(material.url_drive) : ''
  return (
    <Tarjeta className="gy-tarjeta--clicable">
      <div className="gy-tarjeta-cabecera">
        <span className={`gy-icono gy-icono--${meta.tono}`}>
          <Icono nombre={meta.icono} tamano={19} />
        </span>
        <div className="gy-tarjeta-cabecera-texto">
          <h3 className="gy-tarjeta-titulo">{material.titulo}</h3>
          <p className="gy-tarjeta-subtitulo">
            {tipoMaterial(material.tipo)} · Publicado el {fechaCorta(material.fecha_publicacion)}
          </p>
        </div>
      </div>

      {idVideo && (
        <div className="gy-video-embed">
          <iframe
            src={`https://www.youtube.com/embed/${idVideo}`}
            title={material.titulo}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}

      <div className="gy-material-pie">
        <a
          className="gy-boton gy-boton--secundario gy-boton--chico"
          href={material.url_drive}
          target="_blank"
          rel="noopener noreferrer"
        >
          {idVideo ? 'Ver grabación en YouTube' : 'Abrir material'}
        </a>
      </div>

      {material.resoluciones.map((r) => (
        <div key={r.id_material} className="gy-resolucion-bloque">
          <div className="gy-lista-item-principal">
            <p className="gy-resolucion-bloque-titulo">
              <span className="gy-texto-suave">Resolución: </span>
              {r.titulo}
            </p>
            <p className="gy-resolucion-bloque-detalle">
              Publicada el {fechaCorta(r.fecha_publicacion)}
            </p>
          </div>
          <a href={r.url_drive} target="_blank" rel="noopener noreferrer">Abrir</a>
        </div>
      ))}
    </Tarjeta>
  )
}

export default function Materiales() {
  const { sesion } = useSesion()
  const ubicacion = useLocation()
  // Permite llegar con un curso preseleccionado (desde Mis cursos).
  const [idElegido, setIdElegido] = useState(ubicacion.state?.idCicloCurso ?? '')

  const cursos = useDatos(() => obtenerCursosDelUsuario(sesion), sesion.id_usuario, `est-materiales-cursos:${sesion.id_usuario}`)
  // Por defecto se abre el primer curso: la vista nunca arranca vacia si hay cursos.
  const seleccionado = idElegido || cursos.datos?.[0]?.id_ciclo_curso || ''

  const materiales = useDatos(
    () => (seleccionado ? obtenerMateriales(sesion, seleccionado) : Promise.resolve([])),
    seleccionado,
    `est-materiales:${seleccionado}:${sesion.id_usuario}`,
  )

  if (cursos.cargando) return <Cargando texto="Cargando tus cursos…" />
  if (cursos.error) return <p className="gy-alerta gy-alerta--error">{cursos.error}</p>
  if (cursos.datos.length === 0) {
    return (
      <EstadoVacio
        titulo="No tienes cursos este ciclo"
        detalle="Cuando tengas una matrícula activa, aquí verás los materiales de tus cursos."
      />
    )
  }

  // Agrupar por semana (los sin semana van al final como "Generales")
  const grupos = new Map()
  for (const m of materiales.datos ?? []) {
    const clave = m.semana === '' || m.semana == null ? 'generales' : Number(m.semana)
    if (!grupos.has(clave)) grupos.set(clave, [])
    grupos.get(clave).push(m)
  }
  const clavesOrdenadas = [...grupos.keys()].sort((a, b) => {
    if (a === 'generales') return 1
    if (b === 'generales') return -1
    return a - b
  })

  return (
    <div>
      <div className="gy-chips" role="tablist" aria-label="Cursos">
        {cursos.datos.map((c) => (
          <button
            key={c.id_ciclo_curso}
            type="button"
            role="tab"
            aria-selected={seleccionado === c.id_ciclo_curso}
            className={`gy-chip${seleccionado === c.id_ciclo_curso ? ' gy-chip--activo' : ''}`}
            onClick={() => setIdElegido(c.id_ciclo_curso)}
          >
            {c.curso_nombre}
          </button>
        ))}
      </div>

      {materiales.cargando && <Cargando texto="Cargando materiales…" />}
      {!materiales.cargando && materiales.datos.length === 0 && (
        <EstadoVacio
          titulo="Todavía no hay materiales publicados en este curso"
          detalle="Cuando tu docente publique la práctica, la teoría o las grabaciones, aparecerán aquí."
        />
      )}

      {!materiales.cargando && clavesOrdenadas.map((clave) => (
        <section key={String(clave)}>
          <p className="gy-micro gy-seccion-micro">
            {clave === 'generales' ? 'Generales' : `Semana ${clave}`}
          </p>
          <div className="gy-grilla gy-grilla--2">
            {grupos.get(clave).map((m) => (
              <TarjetaMaterial key={m.id_material} material={m} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
