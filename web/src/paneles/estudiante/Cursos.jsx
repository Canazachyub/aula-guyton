// Mis cursos: los ciclo_cursos del ciclo del estudiante, con su docente.

import { useSesion } from '../../auth/SesionContexto.jsx'
import { obtenerCursosDelUsuario } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'

export default function Cursos() {
  const { sesion } = useSesion()
  const { datos, cargando, error } = useDatos(
    () => obtenerCursosDelUsuario(sesion),
    sesion.id_usuario,
  )

  if (cargando) return <Cargando texto="Cargando tus cursos…" />
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>
  if (datos.length === 0) {
    return (
      <EstadoVacio
        titulo="No tienes cursos este ciclo"
        detalle="Cuando tengas una matrícula activa, aquí verás los cursos de tu ciclo."
      />
    )
  }

  return (
    <div className="gy-grilla gy-grilla--2">
      {datos.map((c) => (
        <Tarjeta key={c.id_ciclo_curso} titulo={c.curso_nombre}>
          <ul className="gy-lista">
            <li className="gy-lista-item">
              <span className="gy-lista-item-detalle">Ciclo</span>
              <span>{c.ciclo_nombre}</span>
            </li>
            <li className="gy-lista-item">
              <span className="gy-lista-item-detalle">Docente</span>
              <span>{c.docente_nombre || 'Por asignar'}</span>
            </li>
          </ul>
        </Tarjeta>
      ))}
    </div>
  )
}
