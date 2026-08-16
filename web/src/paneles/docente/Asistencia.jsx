// Asistencia del docente: pasa lista en sus clases y revisa el historial
// registrado (lectura) de sus propios cursos.

import { useSesion } from '../../auth/SesionContexto.jsx'
import { obtenerAsistencias } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Tabla from '../../componentes/Tabla.jsx'
import Insignia from '../../componentes/Insignia.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import PasarLista from '../../componentes/PasarLista.jsx'
import { fechaCorta } from '../../componentes/formatos.js'

export default function Asistencia() {
  const { sesion } = useSesion()
  const historial = useDatos(() => obtenerAsistencias(sesion), sesion.id_usuario, `doc-asistencia:${sesion.id_usuario}`)

  const columnas = [
    { clave: 'clase_fecha', titulo: 'Fecha', render: (a) => fechaCorta(a.clase_fecha) },
    { clave: 'curso_nombre', titulo: 'Curso' },
    { clave: 'alumno_nombre', titulo: 'Alumno' },
    { clave: 'estado', titulo: 'Estado', render: (a) => <Insignia valor={a.estado} /> },
    { clave: 'observacion', titulo: 'Observación', render: (a) => a.observacion || '—' },
  ]

  return (
    <div>
      <PasarLista />

      <Tarjeta titulo="Historial de asistencia de mis clases">
        {historial.cargando && <Cargando texto="Cargando historial…" />}
        {historial.error && <p className="gy-alerta gy-alerta--error">{historial.error}</p>}
        {!historial.cargando && !historial.error && (
          <Tabla
            columnas={columnas}
            filas={historial.datos}
            llaveFila={(a) => a.id_asistencia}
            vacio={
              <EstadoVacio
                titulo="Todavía no hay asistencia registrada en tus clases"
                detalle="Cuando pases lista, el historial aparecerá aquí."
              />
            }
          />
        )}
      </Tarjeta>
    </div>
  )
}
