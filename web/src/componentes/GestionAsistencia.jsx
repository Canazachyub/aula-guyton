// Gestion de asistencia compartida por auxiliar y superadmin (y equivalente a
// la del docente, que ademas solo ve sus clases — el filtrado lo hace la capa
// de datos segun la sesion): pasar lista + historial.

import { useSesion } from '../auth/SesionContexto.jsx'
import { obtenerAsistencias } from '../api/cliente.js'
import { useDatos } from './useDatos.js'
import Tarjeta from './Tarjeta.jsx'
import Tabla from './Tabla.jsx'
import Insignia from './Insignia.jsx'
import Cargando from './Cargando.jsx'
import EstadoVacio from './EstadoVacio.jsx'
import PasarLista from './PasarLista.jsx'
import { fechaCorta } from './formatos.js'

export default function GestionAsistencia() {
  const { sesion } = useSesion()
  const historial = useDatos(() => obtenerAsistencias(sesion), sesion.id_usuario)

  const columnas = [
    { clave: 'clase_fecha', titulo: 'Fecha', render: (a) => fechaCorta(a.clase_fecha) },
    { clave: 'curso_nombre', titulo: 'Curso' },
    { clave: 'clase_tema', titulo: 'Tema' },
    { clave: 'alumno_nombre', titulo: 'Alumno' },
    { clave: 'estado', titulo: 'Estado', render: (a) => <Insignia valor={a.estado} /> },
    { clave: 'observacion', titulo: 'Observación', render: (a) => a.observacion || '—' },
  ]

  return (
    <div>
      <PasarLista />

      <Tarjeta titulo="Historial de asistencia">
        {historial.cargando && <Cargando texto="Cargando historial…" />}
        {historial.error && <p className="gy-alerta gy-alerta--error">{historial.error}</p>}
        {!historial.cargando && !historial.error && (
          <Tabla
            columnas={columnas}
            filas={historial.datos}
            llaveFila={(a) => a.id_asistencia}
            vacio={
              <EstadoVacio
                titulo="Todavía no hay asistencia registrada"
                detalle="Cuando pases lista, el historial aparecerá aquí."
              />
            }
          />
        )}
      </Tarjeta>
    </div>
  )
}
