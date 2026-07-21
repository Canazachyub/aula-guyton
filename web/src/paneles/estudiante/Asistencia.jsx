// Asistencia del estudiante: resumen (tarjetas KPI + barra) y detalle.
// Solo ve sus propios registros — la capa de datos filtra por su id_usuario.

import { useSesion } from '../../auth/SesionContexto.jsx'
import { obtenerAsistencias } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Tabla from '../../componentes/Tabla.jsx'
import Kpi from '../../componentes/Kpi.jsx'
import Insignia from '../../componentes/Insignia.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import { fechaCorta } from '../../componentes/formatos.js'

export default function Asistencia() {
  const { sesion } = useSesion()
  const { datos, cargando, error } = useDatos(
    () => obtenerAsistencias(sesion),
    sesion.id_usuario,
  )

  if (cargando) return <Cargando texto="Cargando tu asistencia…" />
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>

  if (datos.length === 0) {
    return (
      <EstadoVacio
        titulo="Todavía no tienes registros de asistencia"
        detalle="Cuando pasen lista en tus clases, tu historial aparecerá aquí."
      />
    )
  }

  const conteos = { presente: 0, tardanza: 0, falta: 0, justificado: 0 }
  for (const a of datos) {
    if (a.estado in conteos) conteos[a.estado] += 1
  }
  const total = datos.length
  const porcentaje = Math.round(((conteos.presente + conteos.tardanza) / total) * 100)

  const columnas = [
    { clave: 'clase_fecha', titulo: 'Fecha', render: (a) => fechaCorta(a.clase_fecha) },
    { clave: 'curso_nombre', titulo: 'Curso' },
    { clave: 'clase_tema', titulo: 'Tema' },
    { clave: 'estado', titulo: 'Estado', render: (a) => <Insignia valor={a.estado} /> },
    { clave: 'observacion', titulo: 'Observación', render: (a) => a.observacion || '—' },
  ]

  return (
    <div>
      <div className="gy-bento" style={{ marginBottom: '1.1rem' }}>
        <div className="gy-bs-3">
          <Kpi valor={conteos.presente} rotulo="Presente" icono="lista" tono="exito" />
        </div>
        <div className="gy-bs-3">
          <Kpi valor={conteos.tardanza} rotulo="Tardanzas" icono="reloj" tono="alerta" />
        </div>
        <div className="gy-bs-3">
          <Kpi valor={conteos.falta} rotulo="Faltas" icono="cerrar" />
        </div>
        <div className="gy-bs-3">
          <Kpi valor={conteos.justificado} rotulo="Justificadas" icono="info" tono="acento" />
        </div>
      </div>

      <Tarjeta titulo={`Asistencia: ${porcentaje}%`} icono="lista" tonoIcono="exito">
        <div className="gy-progreso" role="progressbar" aria-valuenow={porcentaje} aria-valuemin="0" aria-valuemax="100">
          <div className="gy-progreso-relleno gy-progreso-relleno--exito" style={{ width: `${porcentaje}%` }} />
        </div>
        <p className="gy-ayuda-campo" style={{ marginTop: '0.5rem' }}>
          Cuenta presentes y tardanzas sobre {total} {total === 1 ? 'clase registrada' : 'clases registradas'}.
        </p>
      </Tarjeta>

      <Tarjeta titulo="Detalle por clase" icono="calendario">
        <Tabla columnas={columnas} filas={datos} llaveFila={(a) => a.id_asistencia} />
      </Tarjeta>
    </div>
  )
}
