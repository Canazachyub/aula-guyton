// Mis cursos: tarjetas por curso con su docente y accesos directos a
// Materiales y Mi horario.

import { Link } from 'react-router-dom'
import { useSesion } from '../../auth/SesionContexto.jsx'
import { obtenerCursosDelUsuario } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import Icono from '../../componentes/Icono.jsx'

const TONOS = ['azul', 'acento', 'exito', 'alerta']

export default function Cursos() {
  const { sesion } = useSesion()
  const { datos, cargando, error } = useDatos(
    () => obtenerCursosDelUsuario(sesion),
    sesion.id_usuario,
    `est-cursos:${sesion.id_usuario}`,
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
      {datos.map((c, i) => (
        <Tarjeta
          key={c.id_ciclo_curso}
          titulo={c.curso_nombre}
          subtitulo={`Ciclo ${c.ciclo_nombre}`}
          icono="libro"
          tonoIcono={TONOS[i % TONOS.length]}
          className="gy-tarjeta--clicable"
        >
          <ul className="gy-lista">
            <li className="gy-lista-item">
              <span className="gy-lista-item-detalle">Docente</span>
              <span>{c.docente_nombre || 'Por asignar'}</span>
            </li>
          </ul>
          <div className="gy-material-pie">
            <Link className="gy-boton gy-boton--secundario gy-boton--chico" to="/panel/estudiante/materiales" state={{ idCicloCurso: c.id_ciclo_curso }}>
              <Icono nombre="carpeta" tamano={15} /> Materiales
            </Link>
            <Link className="gy-boton gy-boton--secundario gy-boton--chico" to="/panel/estudiante/horario">
              <Icono nombre="calendario" tamano={15} /> Horario
            </Link>
          </div>
        </Tarjeta>
      ))}
    </div>
  )
}
