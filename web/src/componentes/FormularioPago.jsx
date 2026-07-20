// Formulario compartido para reportar un pago. Lo usan el estudiante (solo su
// matricula) y el auxiliar/superadmin (cualquier matricula). Es presentacional:
// recibe las matriculas ya resueltas y un onGuardar que habla con la capa de
// datos; el panel controlla la recarga.

import { useState } from 'react'
import Boton from './Boton.jsx'
import { conceptoPago } from './formatos.js'

export default function FormularioPago({ matriculas, onGuardar }) {
  const [idMatricula, setIdMatricula] = useState(matriculas[0]?.id_matricula ?? '')
  const [concepto, setConcepto] = useState('matricula')
  const [monto, setMonto] = useState('')
  const [medio, setMedio] = useState('yape')
  const [voucher, setVoucher] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const matricula = matriculas.find((m) => m.id_matricula === idMatricula)
  const conceptos = ['matricula']
  for (let i = 1; i <= (matricula?.n_mensualidades ?? 0); i += 1) {
    conceptos.push(`mensualidad_${i}`)
  }

  const alEnviar = async (evento) => {
    evento.preventDefault()
    setMensaje(null)
    setGuardando(true)
    const resultado = await onGuardar({
      id_matricula: idMatricula,
      concepto,
      monto,
      medio,
      voucher_ref: voucher,
    })
    setGuardando(false)
    if (resultado.ok) {
      setMensaje({ tipo: 'exito', texto: 'Pago reportado. Queda pendiente de verificación.' })
      setMonto('')
      setVoucher('')
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

  return (
    <form onSubmit={alEnviar} noValidate>
      <div className="gy-campo">
        <label className="gy-etiqueta" htmlFor="pago-matricula">Matrícula</label>
        <select
          id="pago-matricula"
          className="gy-select"
          value={idMatricula}
          onChange={(e) => setIdMatricula(e.target.value)}
          disabled={guardando || matriculas.length <= 1}
        >
          {matriculas.map((m) => (
            <option key={m.id_matricula} value={m.id_matricula}>
              {m.alumno_nombre ? `${m.alumno_nombre} — ` : ''}Ciclo {m.ciclo_nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="gy-campo">
        <label className="gy-etiqueta" htmlFor="pago-concepto">Concepto</label>
        <select
          id="pago-concepto"
          className="gy-select"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          disabled={guardando}
        >
          {conceptos.map((c) => (
            <option key={c} value={c}>{conceptoPago(c)}</option>
          ))}
        </select>
      </div>

      <div className="gy-campo">
        <label className="gy-etiqueta" htmlFor="pago-monto">Monto (S/)</label>
        <input
          id="pago-monto"
          className="gy-input"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          placeholder="Ej. 250.00"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          disabled={guardando}
        />
      </div>

      <div className="gy-campo">
        <label className="gy-etiqueta" htmlFor="pago-medio">Medio de pago</label>
        <select
          id="pago-medio"
          className="gy-select"
          value={medio}
          onChange={(e) => setMedio(e.target.value)}
          disabled={guardando}
        >
          <option value="yape">Yape</option>
          <option value="plin">Plin</option>
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
        </select>
      </div>

      <div className="gy-campo">
        <label className="gy-etiqueta" htmlFor="pago-voucher">Referencia del comprobante (opcional)</label>
        <input
          id="pago-voucher"
          className="gy-input"
          type="text"
          placeholder="Ej. YAPE-000123"
          value={voucher}
          onChange={(e) => setVoucher(e.target.value)}
          disabled={guardando}
        />
      </div>

      {mensaje && (
        <p className={`gy-alerta gy-alerta--${mensaje.tipo}`} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>
          {mensaje.texto}
        </p>
      )}

      <Boton type="submit" variante="acento" disabled={guardando || !idMatricula}>
        {guardando ? 'Enviando…' : 'Reportar pago'}
      </Boton>
    </form>
  )
}
