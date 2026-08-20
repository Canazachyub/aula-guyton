// Panel del estudiante: menu y rutas internas. Todo lo que ve esta limitado a
// los ciclos donde tiene matricula 'matriculado' (la capa de datos filtra).

import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '../../componentes/Layout.jsx'
import Inicio from './Inicio.jsx'
import Horario from './Horario.jsx'
import Cursos from './Cursos.jsx'
import Materiales from './Materiales.jsx'
import Banqueo from './Banqueo.jsx'
import Progreso from './Progreso.jsx'
import Biblioteca from './Biblioteca.jsx'
import Simulacros from './Simulacros.jsx'
import Pagos from './Pagos.jsx'
import Anuncios from './Anuncios.jsx'

const MENU = [
  { ruta: '/panel/estudiante', etiqueta: 'Inicio', icono: 'inicio', exacto: true },
  { ruta: '/panel/estudiante/horario', etiqueta: 'Mi horario', icono: 'calendario' },
  { ruta: '/panel/estudiante/cursos', etiqueta: 'Mis cursos', icono: 'libro' },
  { ruta: '/panel/estudiante/materiales', etiqueta: 'Materiales', icono: 'carpeta' },
  { ruta: '/panel/estudiante/banqueo', etiqueta: 'Banqueo Guyton', icono: 'repasos' },
  { ruta: '/panel/estudiante/progreso', etiqueta: 'Mi progreso', icono: 'ciclos' },
  { ruta: '/panel/estudiante/biblioteca', etiqueta: 'Biblioteca', icono: 'libro' },
  { ruta: '/panel/estudiante/simulacros', etiqueta: 'Simulacros', icono: 'documento' },
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
        <Route path="banqueo" element={<Banqueo />} />
        <Route path="progreso" element={<Progreso />} />
        <Route path="biblioteca" element={<Biblioteca />} />
        <Route path="simulacros" element={<Simulacros />} />
        <Route path="pagos" element={<Pagos />} />
        <Route path="anuncios" element={<Anuncios />} />
        <Route path="*" element={<Navigate to="/panel/estudiante" replace />} />
      </Routes>
    </Layout>
  )
}
