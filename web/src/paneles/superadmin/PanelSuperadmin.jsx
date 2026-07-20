// Panel del superadmin: sin restricciones. Aqui vive el "flujo estrella" del
// modelo: crear un ciclo, asignarle cursos y docente, y abrir inscripciones —
// todo como filas de datos, sin tocar codigo.

import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '../../componentes/Layout.jsx'
import Inicio from './Inicio.jsx'
import Ciclos from './Ciclos.jsx'
import Cursos from './Cursos.jsx'
import Asignaciones from './Asignaciones.jsx'
import Usuarios from './Usuarios.jsx'
import Pagos from './Pagos.jsx'
import Asistencia from './Asistencia.jsx'
import Anuncios from './Anuncios.jsx'
import Config from './Config.jsx'

const MENU = [
  { ruta: '/panel/superadmin', etiqueta: 'Inicio', icono: 'inicio', exacto: true },
  { ruta: '/panel/superadmin/ciclos', etiqueta: 'Ciclos', icono: 'ciclos' },
  { ruta: '/panel/superadmin/cursos', etiqueta: 'Cursos', icono: 'libro' },
  { ruta: '/panel/superadmin/asignaciones', etiqueta: 'Asignaciones', icono: 'enlace' },
  { ruta: '/panel/superadmin/usuarios', etiqueta: 'Usuarios', icono: 'usuarios' },
  { ruta: '/panel/superadmin/pagos', etiqueta: 'Pagos', icono: 'dinero' },
  { ruta: '/panel/superadmin/asistencia', etiqueta: 'Asistencia', icono: 'lista' },
  { ruta: '/panel/superadmin/anuncios', etiqueta: 'Anuncios', icono: 'megafono' },
  { ruta: '/panel/superadmin/config', etiqueta: 'Config', icono: 'config' },
]

export default function PanelSuperadmin() {
  return (
    <Layout menu={MENU}>
      <Routes>
        <Route index element={<Inicio />} />
        <Route path="ciclos" element={<Ciclos />} />
        <Route path="cursos" element={<Cursos />} />
        <Route path="asignaciones" element={<Asignaciones />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="pagos" element={<Pagos />} />
        <Route path="asistencia" element={<Asistencia />} />
        <Route path="anuncios" element={<Anuncios />} />
        <Route path="config" element={<Config />} />
        <Route path="*" element={<Navigate to="/panel/superadmin" replace />} />
      </Routes>
    </Layout>
  )
}
