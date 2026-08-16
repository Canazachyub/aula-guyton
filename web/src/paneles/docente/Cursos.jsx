// Mis cursos (docente): tarjetas por ciclo_curso con horario semanal y
// accesos directos a Clases y Materiales del curso.

import { Link } from 'react-router-dom'
import { useSesion } from '../../auth/SesionContexto.jsx'
import { obtenerCursosDelUsuario, obtenerHorario } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import Icono from '../../componentes/Icono.jsx'
import { diaSemana } from '../../componentes/formatos.js'

const TONOS = ['azul', 'acento', 'exito', 'alerta']

export default function Cursos() {
  const { sesion } = useSesion()
  const { datos, cargando, error } = useDatos(async () => {
    const cursos = await obtenerCursosDelUsuario(sesion)
    return Promise.all(
      cursos.map(async (c) => ({ curso: c, horario: await obtenerHorario(sesion, c.id_ciclo_curso) })),
    )
  }, sesion.id_usuario, `doc-cursos:${sesion.id_usuario}`)

  if (cargando) return <Cargando texto="Cargando tus cursos…" />
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>
  if (datos.length === 0) {
    return (
      <EstadoVacio
        titulo="No tienes cursos asignados todavía"
        detalle="Cuando la academia te asigne un curso en un ciclo, aparecerá aquí."
      />
    )
  }

  return (
    <div className="gy-grilla gy-grilla--2">
      {datos.map(({ curso, horario }, i) => (
        <Tarjeta
          key={curso.id_ciclo_curso}
          titulo={curso.curso_nombre}
          subtitulo={`Ciclo ${curso.ciclo_nombre}`}
          icono="libro"
          tonoIcono={TONOS[i % TONOS.length]}
          className="gy-tarjeta--clicable"
        >
          {horario.length === 0 ? (
            <p className="gy-ayuda-campo">Sin bloques de horario definidos.</p>
          ) : (
            <ul className="gy-lista">
              {horario.map((h) => (
                <li key={h.id_horario} className="gy-lista-item">
                  <p className="gy-lista-item-titulo">
                    {diaSemana(h.dia_semana)} · {h.hora_inicio}–{h.hora_fin}
                  </p>
                  {h.aula_o_enlace && <span className="gy-lista-item-detalle">{h.aula_o_enlace}</span>}
                </li>
              ))}
            </ul>
          )}
          <div className="gy-material-pie">
            <Link className="gy-boton gy-boton--secundario gy-boton--chico" to="/panel/docente/clases" state={{ idCicloCurso: curso.id_ciclo_curso }}>
              <Icono nombre="calendario" tamano={15} /> Clases
            </Link>
            <Link className="gy-boton gy-boton--secundario gy-boton--chico" to="/panel/docente/materiales" state={{ idCicloCurso: curso.id_ciclo_curso }}>
              <Icono nombre="carpeta" tamano={15} /> Materiales
            </Link>
          </div>
        </Tarjeta>
      ))}
    </div>
  )
}
