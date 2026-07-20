// Inicio del auxiliar: lo que necesita atencion (pagos pendientes de
// verificacion) y el panorama de su trabajo de soporte.

import { Link } from 'react-router-dom'
import { useSesion } from '../../auth/SesionContexto.jsx'
import { obtenerAnuncios, obtenerAsistencias, obtenerPagos } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Insignia from '../../componentes/Insignia.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import { conceptoPago, fechaCorta, soles } from '../../componentes/formatos.js'

export default function Inicio() {
  const { sesion } = useSesion()
  const { datos, cargando, error } = useDatos(async () => {
    const [pagos, asistencias, anuncios] = await Promise.all([
      obtenerPagos(sesion),
      obtenerAsistencias(sesion),
      obtenerAnuncios(sesion),
    ])
    return { pagos, asistencias, anuncios }
  }, sesion.id_usuario)

  if (cargando) return <Cargando texto="Cargando tu inicio…" />
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>

  const { pagos, asistencias, anuncios } = datos
  const pendientes = pagos.filter((p) => p.estado === 'pendiente')
  const verificados = pagos.filter((p) => p.estado === 'verificado')
  const montoPendiente = pendientes.reduce((acc, p) => acc + Number(p.monto), 0)

  return (
    <div>
      <h2 className="gy-saludo">Hola, {sesion.nombres}</h2>

      <div className="gy-grilla gy-grilla--3">
        <div className="gy-kpi gy-kpi--alerta">
          <p className="gy-kpi-valor">{pendientes.length}</p>
          <p className="gy-kpi-rotulo">Pagos por verificar ({soles(montoPendiente)})</p>
        </div>
        <div className="gy-kpi gy-kpi--exito">
          <p className="gy-kpi-valor">{verificados.length}</p>
          <p className="gy-kpi-rotulo">Pagos verificados</p>
        </div>
        <div className="gy-kpi">
          <p className="gy-kpi-valor">{asistencias.length}</p>
          <p className="gy-kpi-rotulo">Asistencias registradas</p>
        </div>
      </div>

      <Tarjeta
        titulo="Pagos pendientes de verificación"
        acciones={<Link to="/panel/auxiliar/pagos">Ir a Pagos</Link>}
      >
        {pendientes.length === 0 ? (
          <p className="gy-ayuda-campo">No hay pagos pendientes. Todo verificado.</p>
        ) : (
          <ul className="gy-lista">
            {pendientes.map((p) => (
              <li key={p.id_pago} className="gy-lista-item">
                <div className="gy-lista-item-principal">
                  <p className="gy-lista-item-titulo">
                    {p.alumno_nombre} — {conceptoPago(p.concepto)} ({soles(p.monto)})
                  </p>
                  <p className="gy-lista-item-detalle">
                    Ciclo {p.ciclo_nombre} · reportado el {fechaCorta(p.fecha_reporte)}
                    {p.voucher_ref && ` · ${p.voucher_ref}`}
                  </p>
                </div>
                <Insignia valor={p.estado} />
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      <Tarjeta titulo="Anuncios vigentes">
        {anuncios.length === 0 ? (
          <p className="gy-ayuda-campo">No hay anuncios publicados.</p>
        ) : (
          <ul className="gy-lista">
            {anuncios.slice(0, 3).map((a) => (
              <li key={a.id_anuncio} className="gy-lista-item">
                <div className="gy-lista-item-principal">
                  <p className="gy-lista-item-titulo">{a.titulo}</p>
                  <p className="gy-lista-item-detalle">
                    {a.id_ciclo === '' ? 'Global' : `Ciclo ${a.ciclo_nombre}`} · {fechaCorta(a.fecha)}
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
