// Inicio del superadmin: heroe + KPIs + barras por estado. Una sola familia
// de colores de marca (naranja solo como acento), siguiendo el patron de
// dashboard de la skill data-viz-renderer: stat cards + barras comparativas.

import { useSesion } from '../../auth/SesionContexto.jsx'
import {
  obtenerCiclosDelUsuario,
  obtenerMatriculas,
  obtenerPagos,
  obtenerUsuarios,
} from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Heroe from '../../componentes/Heroe.jsx'
import Kpi from '../../componentes/Kpi.jsx'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import { soles } from '../../componentes/formatos.js'

function Barra({ rotulo, valor, total, claseRelleno = '' }) {
  const porcentaje = total > 0 ? Math.round((valor / total) * 100) : 0
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
        <span>{rotulo}</span>
        <strong>{valor} ({porcentaje}%)</strong>
      </div>
      <div className="gy-progreso">
        <div className={`gy-progreso-relleno ${claseRelleno}`} style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  )
}

export default function Inicio() {
  const { sesion } = useSesion()
  const { datos, cargando, error } = useDatos(async () => {
    const [ciclos, matriculas, pagos, usuarios] = await Promise.all([
      obtenerCiclosDelUsuario(sesion),
      obtenerMatriculas(sesion),
      obtenerPagos(sesion),
      obtenerUsuarios(sesion),
    ])
    return { ciclos, matriculas, pagos, usuarios }
  }, sesion.id_usuario)

  if (cargando) return <Cargando texto="Cargando el panorama…" />
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>

  const { ciclos, matriculas, pagos, usuarios } = datos
  const matriculados = matriculas.filter((m) => m.estado === 'matriculado')
  const conteoPagos = {
    verificado: pagos.filter((p) => p.estado === 'verificado'),
    pendiente: pagos.filter((p) => p.estado === 'pendiente'),
    rechazado: pagos.filter((p) => p.estado === 'rechazado'),
  }
  const montoVerificado = conteoPagos.verificado.reduce((acc, p) => acc + Number(p.monto), 0)
  const montoPendiente = conteoPagos.pendiente.reduce((acc, p) => acc + Number(p.monto), 0)

  return (
    <div className="gy-bento">
      <div className="gy-bs-12">
        <Heroe
          micro="Panel del superadmin"
          titulo={`Hola, ${sesion.nombres}`}
          sub={`${ciclos.length} ${ciclos.length === 1 ? 'ciclo' : 'ciclos'} · ${usuarios.length} usuarios en el padrón · ${matriculados.length} ${matriculados.length === 1 ? 'alumno matriculado' : 'alumnos matriculados'}`}
        />
      </div>

      <div className="gy-bs-3">
        <Kpi valor={ciclos.length} rotulo="Ciclos" icono="ciclos" />
      </div>
      <div className="gy-bs-3">
        <Kpi
          valor={matriculados.length}
          rotulo="Alumnos matriculados"
          icono="usuarios"
          tono="exito"
        />
      </div>
      <div className="gy-bs-3">
        <Kpi
          valor={conteoPagos.pendiente.length}
          rotulo="Pagos por verificar"
          icono="dinero"
          tono="alerta"
          pie={soles(montoPendiente)}
        />
      </div>
      <div className="gy-bs-3">
        <Kpi valor={usuarios.length} rotulo="Usuarios en el padrón" icono="config" tono="acento" />
      </div>

      <div className="gy-bs-6">
        <Tarjeta titulo={`Pagos por estado`} subtitulo={`${pagos.length} en total`} icono="dinero">
          {pagos.length === 0 ? (
            <p className="gy-ayuda-campo">Todavía no hay pagos registrados.</p>
          ) : (
            <>
              <Barra rotulo={`Verificados · ${soles(montoVerificado)}`} valor={conteoPagos.verificado.length} total={pagos.length} claseRelleno="gy-progreso-relleno--exito" />
              <Barra rotulo={`Pendientes · ${soles(montoPendiente)}`} valor={conteoPagos.pendiente.length} total={pagos.length} claseRelleno="gy-progreso-relleno--acento" />
              <Barra rotulo="Rechazados" valor={conteoPagos.rechazado.length} total={pagos.length} claseRelleno="gy-progreso-relleno--error" />
            </>
          )}
        </Tarjeta>
      </div>

      <div className="gy-bs-6">
        <Tarjeta titulo="Alumnos matriculados por ciclo" icono="usuarios" tonoIcono="exito">
          {ciclos.length === 0 ? (
            <p className="gy-ayuda-campo">No hay ciclos todavía.</p>
          ) : (
            ciclos.map((c) => {
              const cantidad = matriculados.filter((m) => m.id_ciclo === c.id_ciclo).length
              return (
                <Barra
                  key={c.id_ciclo}
                  rotulo={`Ciclo ${c.nombre}`}
                  valor={cantidad}
                  total={matriculados.length}
                />
              )
            })
          )}
        </Tarjeta>
      </div>
    </div>
  )
}
