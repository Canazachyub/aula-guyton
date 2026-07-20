// Panel del docente: limitado a los ciclo_cursos donde id_docente es el
// (la capa de datos filtra; cco-demo-3 sin docente asignado no le aparece).
// NO tiene pagos por ninguna ruta: ni en el menu ni en la capa de datos.

import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '../../componentes/Layout.jsx'
import Inicio from './Inicio.jsx'
import Cursos from './Cursos.jsx'
import Clases from './Clases.jsx'
import Materiales from './Materiales.jsx'
import Asistencia from './Asistencia.jsx'

const MENU = [
  { ruta: '/panel/docente', etiqueta: 'Inicio', icono: 'inicio', exacto: true },
  { ruta: '/panel/docente/cursos', etiqueta: 'Mis cursos', icono: 'libro' },
  { ruta: '/panel/docente/clases', etiqueta: 'Clases', icono: 'calendario' },
  { ruta: '/panel/docente/materiales', etiqueta: 'Materiales', icono: 'carpeta' },
  { ruta: '/panel/docente/asistencia', etiqueta: 'Asistencia', icono: 'lista' },
]

export default function PanelDocente() {
  return (
    <Layout menu={MENU}>
      <Routes>
        <Route index element={<Inicio />} />
        <Route path="cursos" element={<Cursos />} />
        <Route path="clases" element={<Clases />} />
        <Route path="materiales" element={<Materiales />} />
        <Route path="asistencia" element={<Asistencia />} />
        <Route path="*" element={<Navigate to="/panel/docente" replace />} />
      </Routes>
    </Layout>
  )
}
