// Pantalla de acceso al aula: DNI + clave de acceso.
// El DNI se maneja SIEMPRE como String (puede empezar con 0); jamas parseInt.

import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useSesion } from '../auth/SesionContexto.jsx'

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
      <section className="gy-login-tarjeta">
        <div className="gy-login-marca">
          {/* Placeholder del isotipo: el componente reutilizable llega en el Paso 6 */}
          <div className="gy-isotipo" title="Isotipo provisional - el logo real está pendiente" aria-hidden="true">
            G
          </div>
          <div>
            <h1 className="gy-login-titulo">Aula Virtual</h1>
            <p className="gy-login-subtitulo">Academia Preuniversitaria Guyton</p>
          </div>
        </div>

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

        <p className="gy-login-ayuda">
          ¿Problemas para entrar? Comunícate con la academia por WhatsApp.
        </p>

        <div className="gy-demo-caja">
          <p className="gy-demo-titulo">
            Entorno de demostración: datos de ejemplo, sin backend. Cambia de cuenta para probar cada rol:
          </p>
          <ul className="gy-demo-lista">
            {CREDENCIALES_DEMO.map((c) => (
              <li key={c.dni}>
                <button
                  type="button"
                  className="gy-demo-cuenta"
                  onClick={() => { setDni(c.dni); setClave(c.clave); setError('') }}
                >
                  <strong>{c.rol}</strong> ({c.nombre}) — DNI {c.dni} · clave {c.clave}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}
