// Mis cursos (docente): los ciclo_cursos que dicta, con su horario semanal.

import { useSesion } from '../../auth/SesionContexto.jsx'
import { obtenerCursosDelUsuario, obtenerHorario } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import { diaSemana } from '../../componentes/formatos.js'

export default function Cursos() {
  const { sesion } = useSesion()
  const { datos, cargando, error } = useDatos(async () => {
    const cursos = await obtenerCursosDelUsuario(sesion)
    return Promise.all(
      cursos.map(async (c) => ({ curso: c, horario: await obtenerHorario(sesion, c.id_ciclo_curso) })),
    )
  }, sesion.id_usuario)

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
      {datos.map(({ curso, horario }) => (
        <Tarjeta key={curso.id_ciclo_curso} titulo={curso.curso_nombre}>
          <p className="gy-lista-item-detalle" style={{ marginBottom: '0.5rem' }}>
            Ciclo {curso.ciclo_nombre}
          </p>
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
        </Tarjeta>
      ))}
    </div>
  )
}
