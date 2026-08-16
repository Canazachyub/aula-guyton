// Pagos del estudiante: resumen (KPIs), detalle y reporte de pago nuevo.
// Solo ve los de sus matriculas y no puede verificar — solo reportar.

import { useSesion } from '../../auth/SesionContexto.jsx'
import { obtenerMatriculas, obtenerPagos, registrarPago } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Kpi from '../../componentes/Kpi.jsx'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Tabla from '../../componentes/Tabla.jsx'
import Insignia from '../../componentes/Insignia.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import FormularioPago from '../../componentes/FormularioPago.jsx'
import { conceptoPago, fechaCorta, medioPago, soles } from '../../componentes/formatos.js'

export default function Pagos() {
  const { sesion } = useSesion()

  const pagos = useDatos(() => obtenerPagos(sesion), sesion.id_usuario, `est-pagos:${sesion.id_usuario}`)
  const matriculas = useDatos(async () => {
    const filas = await obtenerMatriculas(sesion)
    // Solo desde una matricula no retirada se puede reportar.
    return filas.filter((m) => m.estado !== 'retirado')
  }, sesion.id_usuario, `est-matriculas:${sesion.id_usuario}`)

  if (pagos.cargando || matriculas.cargando) return <Cargando texto="Cargando tus pagos…" />
  if (pagos.error) return <p className="gy-alerta gy-alerta--error">{pagos.error}</p>
  if (matriculas.error) return <p className="gy-alerta gy-alerta--error">{matriculas.error}</p>

  const verificados = pagos.datos.filter((p) => p.estado === 'verificado')
  const pendientes = pagos.datos.filter((p) => p.estado === 'pendiente')
  const suma = (filas) => filas.reduce((acc, p) => acc + Number(p.monto), 0)

  const columnas = [
    { clave: 'concepto', titulo: 'Concepto', render: (p) => conceptoPago(p.concepto) },
    { clave: 'monto', titulo: 'Monto', render: (p) => soles(p.monto) },
    { clave: 'medio', titulo: 'Medio', render: (p) => medioPago(p.medio) },
    { clave: 'fecha_reporte', titulo: 'Reportado', render: (p) => fechaCorta(p.fecha_reporte) },
    { clave: 'estado', titulo: 'Estado', render: (p) => <Insignia valor={p.estado} /> },
    {
      clave: 'fecha_verificacion',
      titulo: 'Verificado',
      render: (p) => (p.fecha_verificacion ? fechaCorta(p.fecha_verificacion) : '—'),
    },
    { clave: 'voucher_ref', titulo: 'Referencia', render: (p) => p.voucher_ref || '—' },
  ]

  return (
    <div>
      {pagos.datos.length > 0 && (
        <div className="gy-bento" style={{ marginBottom: '1.1rem' }}>
          <div className="gy-bs-4">
            <Kpi
              valor={soles(suma(verificados))}
              rotulo="Verificado"
              icono="lista"
              tono="exito"
              pie={`${verificados.length} ${verificados.length === 1 ? 'pago' : 'pagos'}`}
            />
          </div>
          <div className="gy-bs-4">
            <Kpi
              valor={soles(suma(pendientes))}
              rotulo="Pendiente de verificación"
              icono="reloj"
              tono="alerta"
              pie={`${pendientes.length} ${pendientes.length === 1 ? 'pago' : 'pagos'}`}
            />
          </div>
          <div className="gy-bs-4">
            <Kpi
              valor={pagos.datos.length}
              rotulo="Pagos reportados en total"
              icono="dinero"
            />
          </div>
        </div>
      )}

      <Tarjeta titulo="Mis pagos" icono="dinero">
        <Tabla
          columnas={columnas}
          filas={pagos.datos}
          llaveFila={(p) => p.id_pago}
          vacio={
            <EstadoVacio
              titulo="Todavía no tienes pagos registrados"
              detalle="Cuando reportes tu matrícula o una mensualidad, aparecerá aquí con su estado."
            />
          }
        />
      </Tarjeta>

      {matriculas.datos.length > 0 ? (
        <Tarjeta titulo="Reportar un pago" icono="mas" tonoIcono="acento">
          <p className="gy-ayuda-campo" style={{ marginBottom: '1rem' }}>
            Haz el pago por Yape, Plin, efectivo o transferencia y repórtalo aquí.
            La academia lo verificará contra su comprobante.
          </p>
          <FormularioPago
            matriculas={matriculas.datos}
            onGuardar={async (datos) => {
              const resultado = await registrarPago(sesion, datos)
              if (resultado.ok) pagos.recargar()
              return resultado
            }}
          />
        </Tarjeta>
      ) : (
        <Tarjeta>
          <EstadoVacio
            titulo="No tienes una matrícula activa para reportar pagos"
            detalle="Si crees que es un error, comunícate con la academia."
          />
        </Tarjeta>
      )}
    </div>
  )
}
