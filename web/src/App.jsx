import { Navigate, Route, Routes } from 'react-router-dom'
import { ProveedorSesion, useSesion } from './auth/SesionContexto.jsx'
import RutaProtegida from './auth/RutaProtegida.jsx'

// --- Placeholders temporales del Paso 4 -------------------------------------
// El login real llega en el Paso 5 (paginas/Entrar.jsx) y los paneles reales
// en el Paso 7 (paneles/). Estos solo permiten verificar las guardas.

function EntrarPlaceholder() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--gy-gradiente)', color: 'var(--gy-blanco)' }}>
      <p>Pantalla de acceso — se construye en el Paso 5.</p>
    </main>
  )
}

function PanelPlaceholder({ titulo }) {
  const { sesion, salir } = useSesion()
  return (
    <main style={{ padding: '2rem' }}>
      <h1>{titulo}</h1>
      <p>
        Sesión de {sesion?.nombres} {sesion?.apellidos} (rol: {sesion?.rol}).
        Panel en construcción — llega en el Paso 7.
      </p>
      <button type="button" onClick={salir} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--gy-naranja)', color: 'var(--gy-blanco)', borderRadius: 'var(--gy-radio-m)' }}>
        Cerrar sesión
      </button>
    </main>
  )
}

// ---------------------------------------------------------------------------

const RUTA_POR_ROL = {
  estudiante: '/panel/estudiante',
  docente: '/panel/docente',
  auxiliar: '/panel/auxiliar',
  superadmin: '/panel/superadmin',
}

function RedireccionPanel() {
  const { sesion, cargando } = useSesion()
  if (cargando) return null
  if (!sesion) return <Navigate to="/entrar" replace />
  return <Navigate to={RUTA_POR_ROL[sesion.rol] ?? '/entrar'} replace />
}

function App() {
  return (
    <ProveedorSesion>
      <Routes>
        <Route path="/" element={<Navigate to="/panel" replace />} />
        <Route path="/entrar" element={<EntrarPlaceholder />} />
        <Route path="/panel" element={<RedireccionPanel />} />
        <Route
          path="/panel/estudiante/*"
          element={
            <RutaProtegida roles={['estudiante']}>
              <PanelPlaceholder titulo="Panel del estudiante" />
            </RutaProtegida>
          }
        />
        <Route
          path="/panel/docente/*"
          element={
            <RutaProtegida roles={['docente']}>
              <PanelPlaceholder titulo="Panel del docente" />
            </RutaProtegida>
          }
        />
        <Route
          path="/panel/auxiliar/*"
          element={
            <RutaProtegida roles={['auxiliar']}>
              <PanelPlaceholder titulo="Panel del auxiliar" />
            </RutaProtegida>
          }
        />
        <Route
          path="/panel/superadmin/*"
          element={
            <RutaProtegida roles={['superadmin']}>
              <PanelPlaceholder titulo="Panel del superadmin" />
            </RutaProtegida>
          }
        />
        <Route path="*" element={<Navigate to="/panel" replace />} />
      </Routes>
    </ProveedorSesion>
  )
}

export default App
