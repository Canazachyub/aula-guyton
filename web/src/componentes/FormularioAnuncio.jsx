// Formulario compartido para publicar un anuncio. Lo usan auxiliar (solo por
// ciclo) y superadmin (global o por ciclo). Presentacional: el panel pasa los
// ciclos disponibles y el onGuardar que habla con la capa de datos.

import { useState } from 'react'
import Boton from './Boton.jsx'

export default function FormularioAnuncio({ ciclos, permiteGlobal = false, onGuardar }) {
  const [idCiclo, setIdCiclo] = useState(permiteGlobal ? '' : (ciclos[0]?.id_ciclo ?? ''))
  const [titulo, setTitulo] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [fijado, setFijado] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const alEnviar = async (evento) => {
    evento.preventDefault()
    setMensaje(null)
    setGuardando(true)
    const resultado = await onGuardar({
      id_ciclo: idCiclo,
      titulo,
      cuerpo,
      fijado: fijado ? 'si' : 'no',
    })
    setGuardando(false)
    if (resultado.ok) {
      setMensaje({ tipo: 'exito', texto: 'Anuncio publicado.' })
      setTitulo('')
      setCuerpo('')
      setFijado(false)
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

  return (
    <form onSubmit={alEnviar} noValidate>
      <div className="gy-campo">
        <label className="gy-etiqueta" htmlFor="anu-ciclo">¿A quién va dirigido?</label>
        <select
          id="anu-ciclo"
          className="gy-select"
          value={idCiclo}
          onChange={(e) => setIdCiclo(e.target.value)}
          disabled={guardando}
        >
          {permiteGlobal && <option value="">Todos los ciclos (anuncio global)</option>}
          {ciclos.map((c) => (
            <option key={c.id_ciclo} value={c.id_ciclo}>Ciclo {c.nombre}</option>
          ))}
        </select>
      </div>

      <div className="gy-campo">
        <label className="gy-etiqueta" htmlFor="anu-titulo">Título</label>
        <input
          id="anu-titulo"
          className="gy-input"
          type="text"
          placeholder="Ej. Recordatorio: pago de mensualidad"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          disabled={guardando}
        />
      </div>

      <div className="gy-campo">
        <label className="gy-etiqueta" htmlFor="anu-cuerpo">Contenido</label>
        <textarea
          id="anu-cuerpo"
          className="gy-textarea"
          rows="3"
          placeholder="Escribe el comunicado…"
          value={cuerpo}
          onChange={(e) => setCuerpo(e.target.value)}
          disabled={guardando}
        />
      </div>

      <div className="gy-campo">
        <label className="gy-casilla">
          <input
            type="checkbox"
            checked={fijado}
            onChange={(e) => setFijado(e.target.checked)}
            disabled={guardando}
          />
          Fijar arriba del listado
        </label>
      </div>

      {mensaje && (
        <p className={`gy-alerta gy-alerta--${mensaje.tipo}`} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>
          {mensaje.texto}
        </p>
      )}

      <Boton type="submit" variante="acento" disabled={guardando}>
        {guardando ? 'Publicando…' : 'Publicar anuncio'}
      </Boton>
    </form>
  )
}
