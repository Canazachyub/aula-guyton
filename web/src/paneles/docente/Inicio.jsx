// Inicio del docente: saludo, sus cursos asignados y sus proximas clases.

import { useSesion } from '../../auth/SesionContexto.jsx'
import { obtenerClases, obtenerCursosDelUsuario } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import { fechaCorta } from '../../componentes/formatos.js'

export default function Inicio() {
  const { sesion } = useSesion()
  const { datos, cargando, error } = useDatos(async () => {
    const cursos = await obtenerCursosDelUsuario(sesion)
    const clasesPorCurso = await Promise.all(
      cursos.map((c) => obtenerClases(sesion, c.id_ciclo_curso)),
    )
    const hoy = new Date().toISOString().slice(0, 10)
    const proximas = clasesPorCurso
      .flatMap((clases, i) => clases.map((cl) => ({ ...cl, curso_nombre: cursos[i].curso_nombre })))
      .filter((cl) => cl.estado === 'programada' && cl.fecha >= hoy)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(0, 5)
    return { cursos, proximas }
  }, sesion.id_usuario)

  if (cargando) return <Cargando texto="Cargando tu inicio…" />
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>

  const { cursos, proximas } = datos

  return (
    <div>
      <h2 className="gy-saludo">Hola, {sesion.nombres}</h2>

      <Tarjeta titulo="Mis cursos asignados">
        {cursos.length === 0 ? (
          <EstadoVacio
            titulo="No tienes cursos asignados todavía"
            detalle="Cuando la academia te asigne un curso en un ciclo, aparecerá aquí automáticamente."
          />
        ) : (
          <ul className="gy-lista">
            {cursos.map((c) => (
              <li key={c.id_ciclo_curso} className="gy-lista-item">
                <div className="gy-lista-item-principal">
                  <p className="gy-lista-item-titulo">{c.curso_nombre}</p>
                  <p className="gy-lista-item-detalle">Ciclo {c.ciclo_nombre}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      <Tarjeta titulo="Próximas clases programadas">
        {proximas.length === 0 ? (
          <EstadoVacio titulo="No tienes clases programadas" detalle="Puedes programar una desde la sección Clases." />
        ) : (
          <ul className="gy-lista">
            {proximas.map((cl) => (
              <li key={cl.id_clase} className="gy-lista-item">
                <div className="gy-lista-item-principal">
                  <p className="gy-lista-item-titulo">{cl.curso_nombre}: {cl.tema}</p>
                  <p className="gy-lista-item-detalle">
                    {fechaCorta(cl.fecha)} · {cl.hora_inicio}–{cl.hora_fin} · {cl.modalidad}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  )
}
