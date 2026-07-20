// Materiales del estudiante: SOLO publicados (el patron "fila publica" lo
// aplica la capa de datos: un borrador jamas llega hasta aqui). Las
// resoluciones se muestran agrupadas bajo su practica, no sueltas.

import { useState } from 'react'
import { useSesion } from '../../auth/SesionContexto.jsx'
import { obtenerCursosDelUsuario, obtenerMateriales } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import { fechaCorta, tipoMaterial } from '../../componentes/formatos.js'

function EnlaceMaterial({ material, esResolucion = false }) {
  return (
    <div className={esResolucion ? 'gy-material-resolucion' : undefined}>
      <div className="gy-lista-item-principal">
        <p className="gy-lista-item-titulo">
          {esResolucion && <span className="gy-texto-suave">Resolución: </span>}
          {material.titulo}
        </p>
        <p className="gy-lista-item-detalle">
          {tipoMaterial(material.tipo)}
          {material.semana !== '' && material.semana != null && ` · Semana ${material.semana}`}
          {` · Publicado el ${fechaCorta(material.fecha_publicacion)}`}
        </p>
      </div>
      <a href={material.url_drive} target="_blank" rel="noopener noreferrer">
        Abrir
      </a>
    </div>
  )
}

export default function Materiales() {
  const { sesion } = useSesion()
  const [idCicloCurso, setIdCicloCurso] = useState('')

  const cursos = useDatos(() => obtenerCursosDelUsuario(sesion), sesion.id_usuario)
  const materiales = useDatos(
    () => (idCicloCurso ? obtenerMateriales(sesion, idCicloCurso) : Promise.resolve([])),
    idCicloCurso,
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

  return (
    <Tarjeta titulo="Materiales de estudio">
      <div className="gy-campo">
        <label className="gy-etiqueta" htmlFor="mat-curso">Curso</label>
        <select
          id="mat-curso"
          className="gy-select"
          value={idCicloCurso}
          onChange={(e) => setIdCicloCurso(e.target.value)}
        >
          <option value="">Elige un curso…</option>
          {cursos.datos.map((c) => (
            <option key={c.id_ciclo_curso} value={c.id_ciclo_curso}>{c.curso_nombre}</option>
          ))}
        </select>
      </div>

      {!idCicloCurso && (
        <EstadoVacio titulo="Elige un curso para ver sus materiales" />
      )}
      {idCicloCurso && materiales.cargando && <Cargando texto="Cargando materiales…" />}
      {idCicloCurso && !materiales.cargando && materiales.datos.length === 0 && (
        <EstadoVacio
          titulo="Todavía no hay materiales publicados en este curso"
          detalle="Cuando tu docente publique la práctica, la teoría o las grabaciones, aparecerán aquí."
        />
      )}
      {idCicloCurso && !materiales.cargando && materiales.datos.length > 0 && (
        <ul className="gy-lista">
          {materiales.datos.map((m) => (
            <li key={m.id_material} className="gy-lista-item gy-lista-item--columna">
              <EnlaceMaterial material={m} />
              {m.resoluciones.length > 0 && (
                <div className="gy-material-resoluciones">
                  {m.resoluciones.map((r) => (
                    <EnlaceMaterial key={r.id_material} material={r} esResolucion />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  )
}
