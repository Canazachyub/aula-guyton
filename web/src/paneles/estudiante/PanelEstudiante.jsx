// Panel del estudiante: menu y rutas internas. Todo lo que ve esta limitado a
// los ciclos donde tiene matricula 'matriculado' (la capa de datos filtra).

import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '../../componentes/Layout.jsx'
import Inicio from './Inicio.jsx'
import Horario from './Horario.jsx'
import Cursos from './Cursos.jsx'
import Materiales from './Materiales.jsx'
import Asistencia from './Asistencia.jsx'
import Pagos from './Pagos.jsx'
import Anuncios from './Anuncios.jsx'

const MENU = [
  { ruta: '/panel/estudiante', etiqueta: 'Inicio', icono: 'inicio', exacto: true },
  { ruta: '/panel/estudiante/horario', etiqueta: 'Mi horario', icono: 'calendario' },
  { ruta: '/panel/estudiante/cursos', etiqueta: 'Mis cursos', icono: 'libro' },
  { ruta: '/panel/estudiante/materiales', etiqueta: 'Materiales', icono: 'carpeta' },
  { ruta: '/panel/estudiante/asistencia', etiqueta: 'Asistencia', icono: 'lista' },
  { ruta: '/panel/estudiante/pagos', etiqueta: 'Pagos', icono: 'dinero' },
  { ruta: '/panel/estudiante/anuncios', etiqueta: 'Anuncios', icono: 'megafono' },
]

export default function PanelEstudiante() {
  return (
    <Layout menu={MENU}>
      <Routes>
        <Route index element={<Inicio />} />
        <Route path="horario" element={<Horario />} />
        <Route path="cursos" element={<Cursos />} />
        <Route path="materiales" element={<Materiales />} />
        <Route path="asistencia" element={<Asistencia />} />
        <Route path="pagos" element={<Pagos />} />
        <Route path="anuncios" element={<Anuncios />} />
        <Route path="*" element={<Navigate to="/panel/estudiante" replace />} />
      </Routes>
    </Layout>
  )
}
