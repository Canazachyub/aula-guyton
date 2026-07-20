// Inicio del superadmin: panorama del sistema con tarjetas KPI y barras por
// estado. Una sola familia de colores de marca para que todo se lea como un
// solo sistema (naranja solo como acento).

import { useSesion } from '../../auth/SesionContexto.jsx'
import {
  obtenerAnuncios,
  obtenerCiclosDelUsuario,
  obtenerMatriculas,
  obtenerPagos,
  obtenerUsuarios,
} from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
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
    const [ciclos, matriculas, pagos, usuarios, anuncios] = await Promise.all([
      obtenerCiclosDelUsuario(sesion),
      obtenerMatriculas(sesion),
      obtenerPagos(sesion),
      obtenerUsuarios(sesion),
      obtenerAnuncios(sesion),
    ])
    return { ciclos, matriculas, pagos, usuarios, anuncios }
  }, sesion.id_usuario)

  if (cargando) return <Cargando texto="Cargando el panorama…" />
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>

  const { ciclos, matriculas, pagos, usuarios, anuncios } = datos
  const matriculados = matriculas.filter((m) => m.estado === 'matriculado')
  const conteoPagos = {
    verificado: pagos.filter((p) => p.estado === 'verificado'),
    pendiente: pagos.filter((p) => p.estado === 'pendiente'),
    rechazado: pagos.filter((p) => p.estado === 'rechazado'),
  }
  const montoVerificado = conteoPagos.verificado.reduce((acc, p) => acc + Number(p.monto), 0)
  const montoPendiente = conteoPagos.pendiente.reduce((acc, p) => acc + Number(p.monto), 0)

  return (
    <div>
      <h2 className="gy-saludo">Panorama general</h2>

      <div className="gy-grilla gy-grilla--4">
        <div className="gy-kpi">
          <p className="gy-kpi-valor">{ciclos.length}</p>
          <p className="gy-kpi-rotulo">Ciclos</p>
        </div>
        <div className="gy-kpi gy-kpi--exito">
          <p className="gy-kpi-valor">{matriculados.length}</p>
          <p className="gy-kpi-rotulo">Alumnos matriculados</p>
        </div>
        <div className="gy-kpi gy-kpi--alerta">
          <p className="gy-kpi-valor">{conteoPagos.pendiente.length}</p>
          <p className="gy-kpi-rotulo">Pagos por verificar ({soles(montoPendiente)})</p>
        </div>
        <div className="gy-kpi gy-kpi--acento">
          <p className="gy-kpi-valor">{usuarios.length}</p>
          <p className="gy-kpi-rotulo">Usuarios en el padrón</p>
        </div>
      </div>

      <div className="gy-grilla gy-grilla--2">
        <Tarjeta titulo={`Pagos por estado (${pagos.length} en total)`}>
          {pagos.length === 0 ? (
            <p className="gy-ayuda-campo">Todavía no hay pagos registrados.</p>
          ) : (
            <>
              <Barra rotulo={`Verificados · ${soles(montoVerificado)}`} valor={conteoPagos.verificado.length} total={pagos.length} claseRelleno="gy-progreso-relleno--exito" />
              <Barra rotulo={`Pendientes · ${soles(montoPendiente)}`} valor={conteoPagos.pendiente.length} total={pagos.length} claseRelleno="gy-progreso-relleno--acento" />
              <Barra rotulo="Rechazados" valor={conteoPagos.rechazado.length} total={pagos.length} />
            </>
          )}
        </Tarjeta>

        <Tarjeta titulo="Alumnos matriculados por ciclo">
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

      <Tarjeta titulo="Resumen">
        <ul className="gy-lista">
          <li className="gy-lista-item">
            <span className="gy-lista-item-detalle">Anuncios publicados</span>
            <span>{anuncios.length}</span>
          </li>
          <li className="gy-lista-item">
            <span className="gy-lista-item-detalle">Pagos verificados</span>
            <span>{conteoPagos.verificado.length} ({soles(montoVerificado)})</span>
          </li>
          <li className="gy-lista-item">
            <span className="gy-lista-item-detalle">Docentes en el padrón</span>
            <span>{usuarios.filter((u) => u.rol === 'docente').length}</span>
          </li>
        </ul>
      </Tarjeta>
    </div>
  )
}
