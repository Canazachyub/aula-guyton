// Guarda de rutas privadas. Sin sesion redirige a /entrar (recordando a donde
// queria ir); con sesion de un rol que no aplica, lo devuelve a su propio panel.

import { Navigate, useLocation } from 'react-router-dom'
import { useSesion } from './SesionContexto.jsx'

function SplashCarga() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--gy-gradiente)',
        color: 'var(--gy-blanco)',
        fontFamily: 'var(--gy-fuente-titulos)',
      }}
    >
      <p>Cargando tu sesión…</p>
    </main>
  )
}

export default function RutaProtegida({ roles, children }) {
  const { sesion, cargando } = useSesion()
  const ubicacion = useLocation()

  if (cargando) return <SplashCarga />
  if (!sesion) {
    return <Navigate to="/entrar" replace state={{ desde: ubicacion.pathname }} />
  }
  if (roles && !roles.includes(sesion.rol)) {
    return <Navigate to="/panel" replace />
  }
  return children
}
