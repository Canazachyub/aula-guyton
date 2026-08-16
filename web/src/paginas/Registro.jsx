// Autoservicio de registro/matricula desde el login (pagina publica, sin sesion).
// El visitante llena sus datos, elige un ciclo con inscripcion abierta, escoge
// su clave (PIN), su medio de pago y adjunta el voucher. El voucher se lee con
// FileReader como DataURL, se separa el prefijo 'data:...;base64,' y se envia
// SOLO el base64 (mas su mime y nombre), con un tope de 5 MB.
//
// El DNI se maneja SIEMPRE como String (puede empezar con 0); jamas parseInt.

import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useSesion } from '../auth/SesionContexto.jsx'
import { obtenerCiclosAbiertos, registrarse } from '../api/cliente.js'
import { useDatos } from '../componentes/useDatos.js'
import { soles } from '../componentes/formatos.js'
import Isotipo from '../componentes/Isotipo.jsx'

const MAX_VOUCHER_BYTES = 5 * 1024 * 1024 // 5 MB
const MEDIOS = [
  { valor: 'yape', etiqueta: 'Yape' },
  { valor: 'plin', etiqueta: 'Plin' },
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
]

const FORM_INICIAL = {
  nombres: '',
  apellidos: '',
  dni: '',
  celular: '',
  email: '',
  clave: '',
  claveConfirma: '',
  id_ciclo: '',
  medio: '',
  voucher_ref: '',
}

/** Lee un File como DataURL y separa el prefijo 'data:<mime>;base64,' del base64. */
function leerVoucher(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => {
      const resultado = String(lector.result || '')
      const coma = resultado.indexOf(',')
      resolve({
        base64: coma >= 0 ? resultado.slice(coma + 1) : resultado,
        dataUrl: resultado,
      })
    }
    lector.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    lector.readAsDataURL(archivo)
  })
}

export default function Registro() {
  const { sesion, cargando: cargandoSesion } = useSesion()
  const navegar = useNavigate()

  const { datos: ciclos, cargando: cargandoCiclos, error: errorCiclos } = useDatos(
    () => obtenerCiclosAbiertos(),
    'ciclos-abiertos',
    'registro:ciclos-abiertos',
  )

  const [form, setForm] = useState(FORM_INICIAL)
  const [voucher, setVoucher] = useState(null) // { base64, tipo, nombre, preview }
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(null) // { nombres, ciclo_nombre }

  // Si ya hay sesion, el registro no aplica: al panel.
  if (!cargandoSesion && sesion) {
    return <Navigate to="/panel" replace />
  }

  const cambiar = (campo) => (evento) => {
    setForm((prev) => ({ ...prev, [campo]: evento.target.value }))
  }

  const cicloElegido = (ciclos ?? []).find((c) => c.id_ciclo === form.id_ciclo) || null

  const alElegirVoucher = async (evento) => {
    setError('')
    const archivo = evento.target.files?.[0]
    if (!archivo) {
      setVoucher(null)
      return
    }
    if (archivo.size > MAX_VOUCHER_BYTES) {
      evento.target.value = ''
      setVoucher(null)
      setError('El comprobante no debe pesar más de 5 MB. Usa una foto más liviana o un PDF comprimido.')
      return
    }
    try {
      const { base64, dataUrl } = await leerVoucher(archivo)
      setVoucher({
        base64,
        tipo: archivo.type || '',
        nombre: archivo.name || 'comprobante',
        preview: archivo.type.startsWith('image/') ? dataUrl : '',
      })
    } catch {
      setError('No se pudo leer el comprobante. Intenta con otro archivo.')
    }
  }

  const validar = () => {
    const nombres = form.nombres.trim()
    const apellidos = form.apellidos.trim()
    const dni = form.dni.trim()
    const clave = form.clave.trim()
    const claveConfirma = form.claveConfirma.trim()

    if (!nombres || !apellidos || !dni) {
      return 'Completa tus nombres, apellidos y DNI.'
    }
    if (clave.length < 4) {
      return 'Tu clave debe tener al menos 4 caracteres.'
    }
    if (clave !== claveConfirma) {
      return 'Las claves no coinciden. Vuelve a escribirlas.'
    }
    if (!form.id_ciclo) {
      return 'Elige el ciclo al que quieres matricularte.'
    }
    if (!form.medio) {
      return 'Elige tu medio de pago.'
    }
    return ''
  }

  const alEnviar = async (evento) => {
    evento.preventDefault()
    setError('')
    const problema = validar()
    if (problema) {
      setError(problema)
      return
    }

    setEnviando(true)
    const datos = {
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      dni: form.dni.trim(),
      celular: form.celular.trim(),
      email: form.email.trim(),
      clave: form.clave.trim(),
      id_ciclo: form.id_ciclo,
      medio: form.medio,
      voucher_base64: voucher?.base64 || '',
      voucher_tipo: voucher?.tipo || '',
      voucher_nombre: voucher?.nombre || '',
      voucher_ref: form.voucher_ref.trim(),
    }
    const resultado = await registrarse(datos)
    setEnviando(false)

    if (!resultado || !resultado.ok) {
      setError(resultado?.error || 'No se pudo completar tu registro. Inténtalo de nuevo.')
      return
    }
    setExito({ nombres: datos.nombres, ciclo_nombre: resultado.ciclo_nombre })
  }

  // Pantalla de confirmacion tras el exito.
  if (exito) {
    return (
      <main className="gy-login">
        <div className="gy-registro-exito">
          <span className="gy-registro-exito-marca">
            <Isotipo tamano={44} />
          </span>
          <span className="gy-registro-exito-check" aria-hidden="true">✓</span>
          <h1 className="gy-registro-exito-titulo">¡Listo, {exito.nombres}!</h1>
          <p className="gy-registro-exito-texto">
            Te preinscribiste al ciclo <strong>{exito.ciclo_nombre}</strong>. Tu pago está en
            revisión; cuando un asesor lo verifique, tendrás acceso completo. Inicia sesión con tu
            DNI y tu clave.
          </p>
          <button
            type="button"
            className="gy-boton gy-boton--primario gy-boton--bloque"
            onClick={() => navegar('/entrar')}
          >
            Ir a iniciar sesión
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="gy-login">
      <div className="gy-login-marco gy-registro-marco">
        <aside className="gy-login-marca-panel">
          <svg
            className="gy-login-marca-arte"
            viewBox="0 0 240 240"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="170" cy="70" r="52" stroke="rgba(255,255,255,0.25)" strokeWidth="11" />
            <circle cx="170" cy="70" r="24" fill="rgba(255,255,255,0.14)" />
            <rect x="30" y="140" width="66" height="66" rx="17" fill="rgba(255,255,255,0.14)" />
            <rect x="130" y="150" width="56" height="56" rx="15" fill="#FF4A18" opacity="0.9" />
          </svg>

          <div className="gy-login-marca-cabecera">
            <Isotipo tamano={46} />
            <strong>Academia Preuniversitaria Guyton</strong>
          </div>

          <div className="gy-login-marca-texto">
            <h1 className="gy-login-titulo">Matricúlate</h1>
            <p className="gy-login-subtitulo">
              Regístrate, elige tu ciclo y reporta tu pago de matrícula. Un asesor lo verificará y
              tendrás acceso a tus clases, materiales y horario.
            </p>
            <div className="gy-login-chips" aria-hidden="true">
              <span className="gy-login-chip">Clases en vivo</span>
              <span className="gy-login-chip">Materiales</span>
              <span className="gy-login-chip">Banqueo</span>
            </div>
          </div>

          <p className="gy-login-marca-pie">
            ¿Ya tienes cuenta?{' '}
            <Link className="gy-registro-enlace-claro" to="/entrar">Inicia sesión</Link>
          </p>
        </aside>

        <section className="gy-login-panel gy-registro-panel">
          <h2 className="gy-login-panel-titulo">Crea tu cuenta</h2>
          <p className="gy-login-panel-sub">Es rápido. Todos los campos con * son obligatorios.</p>

          {errorCiclos && (
            <p className="gy-alerta gy-alerta--error" role="alert">
              No se pudieron cargar los ciclos disponibles. Recarga la página e inténtalo de nuevo.
            </p>
          )}

          <form onSubmit={alEnviar} noValidate>
            <div className="gy-registro-fila">
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="nombres">Nombres *</label>
                <input
                  id="nombres"
                  className="gy-input"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Tus nombres"
                  value={form.nombres}
                  onChange={cambiar('nombres')}
                  disabled={enviando}
                />
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="apellidos">Apellidos *</label>
                <input
                  id="apellidos"
                  className="gy-input"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Tus apellidos"
                  value={form.apellidos}
                  onChange={cambiar('apellidos')}
                  disabled={enviando}
                />
              </div>
            </div>

            <div className="gy-registro-fila">
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="dni">DNI *</label>
                <input
                  id="dni"
                  className="gy-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="username"
                  placeholder="Tu DNI"
                  value={form.dni}
                  onChange={cambiar('dni')}
                  disabled={enviando}
                />
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="celular">Celular</label>
                <input
                  id="celular"
                  className="gy-input"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="Opcional"
                  value={form.celular}
                  onChange={cambiar('celular')}
                  disabled={enviando}
                />
              </div>
            </div>

            <div className="gy-campo">
              <label className="gy-etiqueta" htmlFor="email">Correo</label>
              <input
                id="email"
                className="gy-input"
                type="email"
                autoComplete="email"
                placeholder="Opcional"
                value={form.email}
                onChange={cambiar('email')}
                disabled={enviando}
              />
            </div>

            <div className="gy-registro-fila">
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="clave">Clave (tu PIN) *</label>
                <input
                  id="clave"
                  className="gy-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 4 caracteres"
                  value={form.clave}
                  onChange={cambiar('clave')}
                  disabled={enviando}
                />
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="claveConfirma">Repite tu clave *</label>
                <input
                  id="claveConfirma"
                  className="gy-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Escríbela de nuevo"
                  value={form.claveConfirma}
                  onChange={cambiar('claveConfirma')}
                  disabled={enviando}
                />
              </div>
            </div>

            <div className="gy-campo">
              <label className="gy-etiqueta" htmlFor="id_ciclo">Ciclo a matricularte *</label>
              <select
                id="id_ciclo"
                className="gy-select"
                value={form.id_ciclo}
                onChange={cambiar('id_ciclo')}
                disabled={enviando || cargandoCiclos}
              >
                <option value="">
                  {cargandoCiclos ? 'Cargando ciclos…' : 'Elige un ciclo'}
                </option>
                {(ciclos ?? []).map((c) => (
                  <option key={c.id_ciclo} value={c.id_ciclo}>
                    {c.nombre} — Matrícula {soles(c.precio_matricula)}
                  </option>
                ))}
              </select>
            </div>

            {cicloElegido && (
              <p className="gy-registro-monto" role="status">
                Monto a pagar por matrícula:{' '}
                <strong>{soles(cicloElegido.precio_matricula)}</strong>
              </p>
            )}

            <div className="gy-registro-fila">
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="medio">Medio de pago *</label>
                <select
                  id="medio"
                  className="gy-select"
                  value={form.medio}
                  onChange={cambiar('medio')}
                  disabled={enviando}
                >
                  <option value="">Elige un medio</option>
                  {MEDIOS.map((m) => (
                    <option key={m.valor} value={m.valor}>{m.etiqueta}</option>
                  ))}
                </select>
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="voucher_ref">N° de operación</label>
                <input
                  id="voucher_ref"
                  className="gy-input"
                  type="text"
                  placeholder="Opcional"
                  value={form.voucher_ref}
                  onChange={cambiar('voucher_ref')}
                  disabled={enviando}
                />
              </div>
            </div>

            <div className="gy-campo">
              <label className="gy-etiqueta" htmlFor="voucher">Comprobante de pago (voucher)</label>
              <input
                id="voucher"
                className="gy-input gy-registro-archivo"
                type="file"
                accept="image/*,application/pdf"
                onChange={alElegirVoucher}
                disabled={enviando}
              />
              <p className="gy-ayuda-campo">
                Imagen o PDF, hasta 5 MB. Puedes tomarle una foto a tu voucher de Yape/Plin.
              </p>
              {voucher && (
                <div className="gy-registro-voucher">
                  {voucher.preview ? (
                    <img
                      className="gy-registro-voucher-previa"
                      src={voucher.preview}
                      alt={`Vista previa del comprobante: ${voucher.nombre}`}
                    />
                  ) : (
                    <span className="gy-registro-voucher-archivo">📄</span>
                  )}
                  <span className="gy-registro-voucher-nombre">{voucher.nombre}</span>
                </div>
              )}
            </div>

            {error && (
              <p className="gy-alerta gy-alerta--error" role="alert">{error}</p>
            )}

            <button
              type="submit"
              className="gy-boton gy-boton--primario gy-boton--bloque"
              disabled={enviando}
            >
              {enviando ? 'Enviando…' : 'Enviar preinscripción'}
            </button>
          </form>

          <p className="gy-login-ayuda">
            ¿Ya tienes cuenta? <Link to="/entrar">Inicia sesión</Link>
          </p>
        </section>
      </div>
    </main>
  )
}
