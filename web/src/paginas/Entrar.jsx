// Pantalla de acceso al aula: DNI + clave de acceso.
// El DNI se maneja SIEMPRE como String (puede empezar con 0); jamas parseInt.
// Diseno split: panel de marca con el gradiente + panel de formulario.

import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useSesion } from '../auth/SesionContexto.jsx'
import { MODO_DEMO } from '../api/cliente.js'
import Isotipo from '../componentes/Isotipo.jsx'

// Credenciales del entorno DEMO, visibles a proposito: toda la app corre con
// datos de ejemplo y la interfaz debe decirlo (regla de honestidad).
const CREDENCIALES_DEMO = [
  { rol: 'Superadmin', nombre: 'Ana', dni: '70000001', clave: '1111' },
  { rol: 'Docente', nombre: 'Carlos', dni: '70000002', clave: '2222' },
  { rol: 'Auxiliar', nombre: 'Rosa', dni: '70000003', clave: '3333' },
  { rol: 'Estudiante', nombre: 'Luis', dni: '70000004', clave: '4444' },
  { rol: 'Estudiante retirada', nombre: 'Maria', dni: '70000005', clave: '5555' },
]

export default function Entrar() {
  const { sesion, cargando, entrar } = useSesion()
  const navegar = useNavigate()
  const ubicacion = useLocation()

  const [dni, setDni] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!cargando && sesion) {
    return <Navigate to="/panel" replace />
  }

  const alEnviar = async (evento) => {
    evento.preventDefault()
    setError('')
    const dniLimpio = dni.trim()
    const claveLimpia = clave.trim()
    if (!dniLimpio || !claveLimpia) {
      setError('Ingresa tu DNI y tu clave de acceso.')
      return
    }
    setEnviando(true)
    const resultado = await entrar(dniLimpio, claveLimpia)
    setEnviando(false)
    if (!resultado.ok) {
      setError(resultado.error)
      return
    }
    navegar(ubicacion.state?.desde || '/panel', { replace: true })
  }

  return (
    <main className="gy-login">
      <div className="gy-login-marco">
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
            <h1 className="gy-login-titulo">Aula Virtual</h1>
            <p className="gy-login-subtitulo">
              Tu horario, tus clases, tus materiales, tu asistencia y tus pagos,
              en un solo lugar.
            </p>
            <div className="gy-login-chips" aria-hidden="true">
              <span className="gy-login-chip">Horario</span>
              <span className="gy-login-chip">Clases en vivo</span>
              <span className="gy-login-chip">Materiales</span>
              <span className="gy-login-chip">Asistencia</span>
              <span className="gy-login-chip">Pagos</span>
            </div>
          </div>

          {MODO_DEMO && (
            <p className="gy-login-marca-pie">
              <span className="gy-login-demo-punto" aria-hidden="true" />
              Entorno de demostración: todos los datos son de ejemplo.
            </p>
          )}
        </aside>

        <section className="gy-login-panel">
          <h2 className="gy-login-panel-titulo">Ingresa a tu aula</h2>
          <p className="gy-login-panel-sub">Usa el DNI y la clave que te dio la academia.</p>

          <form onSubmit={alEnviar} noValidate>
            <div className="gy-campo">
              <label className="gy-etiqueta" htmlFor="dni">DNI</label>
              <input
                id="dni"
                name="dni"
                className="gy-input"
                type="text"
                inputMode="numeric"
                autoComplete="username"
                placeholder="Ingresa tu DNI"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                disabled={enviando}
              />
            </div>
            <div className="gy-campo">
              <label className="gy-etiqueta" htmlFor="clave">Clave de acceso</label>
              <input
                id="clave"
                name="clave"
                className="gy-input"
                type="password"
                autoComplete="current-password"
                placeholder="Ingresa tu clave"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                disabled={enviando}
              />
            </div>

            {error && (
              <p className="gy-alerta gy-alerta--error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="gy-boton gy-boton--primario gy-boton--bloque" disabled={enviando}>
              {enviando ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

          <p className="gy-login-registro">
            ¿No tienes cuenta?{' '}
            <Link className="gy-login-registro-enlace" to="/registro">Regístrate</Link>
          </p>

          <p className="gy-login-ayuda">
            ¿Problemas para entrar? Comunícate con la academia por WhatsApp.
          </p>

          {MODO_DEMO && (
            <div className="gy-demo-caja">
              <p className="gy-demo-titulo">
                Prueba cada rol con un clic (datos de ejemplo):
              </p>
              <div className="gy-demo-grid">
                {CREDENCIALES_DEMO.map((c) => (
                  <button
                    key={c.dni}
                    type="button"
                    className="gy-demo-cuenta"
                    onClick={() => { setDni(c.dni); setClave(c.clave); setError('') }}
                  >
                    <strong>{c.rol}</strong>
                    <span>{c.nombre} · DNI {c.dni} · clave {c.clave}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
