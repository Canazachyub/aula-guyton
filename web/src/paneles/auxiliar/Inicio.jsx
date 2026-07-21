// Inicio del auxiliar: heroe + bento (pagos que necesitan verificacion y el
// panorama de su trabajo de soporte).

import { Link } from 'react-router-dom'
import { useSesion } from '../../auth/SesionContexto.jsx'
import { obtenerAnuncios, obtenerAsistencias, obtenerPagos } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Heroe from '../../componentes/Heroe.jsx'
import Kpi from '../../componentes/Kpi.jsx'
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
    <div className="gy-bento">
      <div className="gy-bs-8">
        <Heroe
          micro="Panel de soporte"
          titulo={`Hola, ${sesion.nombres}`}
          sub={pendientes.length > 0
            ? `Hay ${pendientes.length} ${pendientes.length === 1 ? 'pago esperando' : 'pagos esperando'} tu verificación`
            : 'Todo verificado: no hay pagos pendientes'}
        />
      </div>

      <div className="gy-bs-4">
        <Kpi
          valor={pendientes.length}
          rotulo="Pagos por verificar"
          icono="dinero"
          tono="alerta"
          pie={soles(montoPendiente)}
        />
      </div>

      <div className="gy-bs-8">
        <Tarjeta
          titulo="Pagos pendientes de verificación"
          icono="dinero"
          tonoIcono="alerta"
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
      </div>

      <div className="gy-bs-4">
        <div className="gy-bento" style={{ gap: '1.1rem' }}>
          <Kpi
            valor={verificados.length}
            rotulo="Pagos verificados"
            icono="lista"
            tono="exito"
          />
          <Kpi
            valor={asistencias.length}
            rotulo="Asistencias registradas"
            icono="usuarios"
          />
        </div>
      </div>

      <div className="gy-bs-12">
        <Tarjeta titulo="Anuncios vigentes" icono="megafono" tonoIcono="acento">
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
    </div>
  )
}
