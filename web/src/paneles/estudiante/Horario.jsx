// Mi horario: el patron semanal de cada curso del ciclo del estudiante.

import { useSesion } from '../../auth/SesionContexto.jsx'
import { obtenerCursosDelUsuario, obtenerHorario } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import { diaSemana } from '../../componentes/formatos.js'

export default function Horario() {
  const { sesion } = useSesion()
  const { datos, cargando, error } = useDatos(async () => {
    const cursos = await obtenerCursosDelUsuario(sesion)
    const bloques = await Promise.all(
      cursos.map(async (c) => ({ curso: c, horario: await obtenerHorario(sesion, c.id_ciclo_curso) })),
    )
    return bloques
  }, sesion.id_usuario)

  if (cargando) return <Cargando texto="Cargando tu horario…" />
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>
  if (datos.length === 0) {
    return (
      <EstadoVacio
        titulo="No tienes cursos este ciclo"
        detalle="Cuando tengas una matrícula activa, aquí verás tu horario semanal."
      />
    )
  }

  return (
    <div className="gy-grilla gy-grilla--2">
      {datos.map(({ curso, horario }) => (
        <Tarjeta key={curso.id_ciclo_curso} titulo={curso.curso_nombre}>
          <p className="gy-lista-item-detalle" style={{ marginBottom: '0.5rem' }}>
            {curso.docente_nombre ? `Docente: ${curso.docente_nombre}` : 'Docente por asignar'}
          </p>
          {horario.length === 0 ? (
            <EstadoVacio titulo="Sin bloques de horario definidos" />
          ) : (
            <ul className="gy-lista">
              {horario.map((h) => (
                <li key={h.id_horario} className="gy-lista-item">
                  <div className="gy-lista-item-principal">
                    <p className="gy-lista-item-titulo">
                      {diaSemana(h.dia_semana)} · {h.hora_inicio}–{h.hora_fin}
                    </p>
                    {h.aula_o_enlace && <p className="gy-lista-item-detalle">{h.aula_o_enlace}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      ))}
    </div>
  )
}
