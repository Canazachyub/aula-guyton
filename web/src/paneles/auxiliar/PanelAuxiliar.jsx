// Panel del auxiliar: soporte transversal (asistencia, pagos, anuncios por
// ciclo) sin poder estructural: no crea ciclos, cursos ni usuarios.

import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '../../componentes/Layout.jsx'
import Inicio from './Inicio.jsx'
import Asistencia from './Asistencia.jsx'
import Pagos from './Pagos.jsx'
import Anuncios from './Anuncios.jsx'

const MENU = [
  { ruta: '/panel/auxiliar', etiqueta: 'Inicio', icono: 'inicio', exacto: true },
  { ruta: '/panel/auxiliar/asistencia', etiqueta: 'Asistencia', icono: 'lista' },
  { ruta: '/panel/auxiliar/pagos', etiqueta: 'Pagos', icono: 'dinero' },
  { ruta: '/panel/auxiliar/anuncios', etiqueta: 'Anuncios', icono: 'megafono' },
]

export default function PanelAuxiliar() {
  return (
    <Layout menu={MENU}>
      <Routes>
        <Route index element={<Inicio />} />
        <Route path="asistencia" element={<Asistencia />} />
        <Route path="pagos" element={<Pagos />} />
        <Route path="anuncios" element={<Anuncios />} />
        <Route path="*" element={<Navigate to="/panel/auxiliar" replace />} />
      </Routes>
    </Layout>
  )
}
