import { Navigate, Route, Routes } from 'react-router-dom'
import { ProveedorSesion, useSesion } from './auth/SesionContexto.jsx'
import RutaProtegida from './auth/RutaProtegida.jsx'
import Entrar from './paginas/Entrar.jsx'
import PanelEstudiante from './paneles/estudiante/PanelEstudiante.jsx'
import PanelDocente from './paneles/docente/PanelDocente.jsx'
import PanelAuxiliar from './paneles/auxiliar/PanelAuxiliar.jsx'
import PanelSuperadmin from './paneles/superadmin/PanelSuperadmin.jsx'

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
        <Route path="/entrar" element={<Entrar />} />
        <Route path="/panel" element={<RedireccionPanel />} />
        <Route
          path="/panel/estudiante/*"
          element={
            <RutaProtegida roles={['estudiante']}>
              <PanelEstudiante />
            </RutaProtegida>
          }
        />
        <Route
          path="/panel/docente/*"
          element={
            <RutaProtegida roles={['docente']}>
              <PanelDocente />
            </RutaProtegida>
          }
        />
        <Route
          path="/panel/auxiliar/*"
          element={
            <RutaProtegida roles={['auxiliar']}>
              <PanelAuxiliar />
            </RutaProtegida>
          }
        />
        <Route
          path="/panel/superadmin/*"
          element={
            <RutaProtegida roles={['superadmin']}>
              <PanelSuperadmin />
            </RutaProtegida>
          }
        />
        <Route path="*" element={<Navigate to="/panel" replace />} />
      </Routes>
    </ProveedorSesion>
  )
}

export default App
