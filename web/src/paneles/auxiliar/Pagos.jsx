// Pagos del auxiliar: ve todos, registra pagos reportados y verifica/rechaza.
// NOTA: la matriz dice que el auxiliar verifica "solo si superadmin delega",
// pero el modelo no tiene campo para esa delegacion; por ahora la
// verificacion esta habilitada (ver GUIA_FRONTEND.md seccion 5 y el
// comentario PENDIENTE en api/cliente.js).

import { useState } from 'react'
import { useSesion } from '../../auth/SesionContexto.jsx'
import { obtenerMatriculas, obtenerPagos, registrarPago, verificarPago } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Tabla from '../../componentes/Tabla.jsx'
import Insignia from '../../componentes/Insignia.jsx'
import Boton from '../../componentes/Boton.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import FormularioPago from '../../componentes/FormularioPago.jsx'
import { conceptoPago, fechaCorta, medioPago, soles } from '../../componentes/formatos.js'

export default function Pagos() {
  const { sesion } = useSesion()
  const [mensaje, setMensaje] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const pagos = useDatos(() => obtenerPagos(sesion), sesion.id_usuario)
  const matriculas = useDatos(
    async () => (await obtenerMatriculas(sesion)).filter((m) => m.estado !== 'retirado'),
    sesion.id_usuario,
  )

  const decidir = async (idPago, decision) => {
    setMensaje(null)
    const resultado = await verificarPago(sesion, idPago, decision)
    if (resultado.ok) {
      setMensaje({
        tipo: 'exito',
        texto: decision === 'verificado' ? 'Pago verificado.' : 'Pago rechazado.',
      })
      pagos.recargar()
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

  if (pagos.cargando || matriculas.cargando) return <Cargando texto="Cargando pagos…" />
  if (pagos.error) return <p className="gy-alerta gy-alerta--error">{pagos.error}</p>
  if (matriculas.error) return <p className="gy-alerta gy-alerta--error">{matriculas.error}</p>

  const columnas = [
    { clave: 'alumno_nombre', titulo: 'Alumno' },
    { clave: 'ciclo_nombre', titulo: 'Ciclo' },
    { clave: 'concepto', titulo: 'Concepto', render: (p) => conceptoPago(p.concepto) },
    { clave: 'monto', titulo: 'Monto', render: (p) => soles(p.monto) },
    { clave: 'medio', titulo: 'Medio', render: (p) => medioPago(p.medio) },
    { clave: 'fecha_reporte', titulo: 'Reportado', render: (p) => fechaCorta(p.fecha_reporte) },
    { clave: 'voucher_ref', titulo: 'Referencia', render: (p) => p.voucher_ref || '—' },
    { clave: 'estado', titulo: 'Estado', render: (p) => <Insignia valor={p.estado} /> },
    {
      clave: 'acciones',
      titulo: 'Acciones',
      render: (p) =>
        p.estado === 'pendiente' ? (
          <div className="gy-acciones-fila">
            <Boton chico onClick={() => decidir(p.id_pago, 'verificado')}>Verificar</Boton>
            <Boton chico variante="peligro" onClick={() => decidir(p.id_pago, 'rechazado')}>
              Rechazar
            </Boton>
          </div>
        ) : (
          <span className="gy-ayuda-campo">
            {p.verificador_nombre ? `Por ${p.verificador_nombre}` : '—'}
          </span>
        ),
    },
  ]

  return (
    <div>
      <Tarjeta
        titulo="Todos los pagos"
        acciones={
          <Boton variante="acento" onClick={() => setMostrarFormulario((v) => !v)}>
            {mostrarFormulario ? 'Cerrar formulario' : 'Registrar pago'}
          </Boton>
        }
      >
        {mensaje && (
          <p className={`gy-alerta gy-alerta--${mensaje.tipo}`} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>
            {mensaje.texto}
          </p>
        )}
        <Tabla
          columnas={columnas}
          filas={pagos.datos}
          llaveFila={(p) => p.id_pago}
          vacio={
            <EstadoVacio
              titulo="No hay pagos registrados todavía"
              detalle="Cuando un alumno reporte un pago, aparecerá aquí para su verificación."
            />
          }
        />
      </Tarjeta>

      {mostrarFormulario && (
        <Tarjeta titulo="Registrar pago reportado">
          <p className="gy-ayuda-campo" style={{ marginBottom: '1rem' }}>
            Registra aquí el pago que un alumno reportó por fuera del aula
            (por ejemplo, un efectivo entregado en la academia).
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
      )}
    </div>
  )
}
