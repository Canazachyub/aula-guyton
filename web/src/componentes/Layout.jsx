// Estructura comun de los cuatro paneles: barra lateral con navegacion,
// cabecera con el titulo de la seccion actual, banner DEMO y area de contenido.
// En celular la barra lateral se vuelve un cajon que se abre con el boton de
// menu — muchos alumnos entraran desde el telefono, no es opcional.

import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useSesion } from '../auth/SesionContexto.jsx'
import Isotipo from './Isotipo.jsx'
import Icono from './Icono.jsx'
import AvisoDemo from './AvisoDemo.jsx'

const NOMBRE_ROL = {
  estudiante: 'Estudiante',
  docente: 'Docente',
  auxiliar: 'Auxiliar',
  superadmin: 'Superadmin',
}

export default function Layout({ menu, children }) {
  const { sesion, salir } = useSesion()
  const ubicacion = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)

  // Al navegar en celular, el cajon se cierra solo.
  useEffect(() => {
    setMenuAbierto(false)
  }, [ubicacion.pathname])

  // El item actual es el de la ruta mas especifica que coincida.
  const actual = [...menu]
    .sort((a, b) => b.ruta.length - a.ruta.length)
    .find((m) => ubicacion.pathname === m.ruta || ubicacion.pathname.startsWith(`${m.ruta}/`))

  const iniciales = sesion
    ? `${sesion.nombres.charAt(0)}${sesion.apellidos.charAt(0)}`.toUpperCase()
    : ''

  return (
    <div className="gy-layout">
      <aside className={`gy-lateral${menuAbierto ? ' gy-lateral--abierto' : ''}`}>
        <div className="gy-lateral-marca">
          <Isotipo tamano={40} />
          <div className="gy-lateral-marca-texto">
            <strong>Aula Virtual</strong>
            <span>Academia Guyton</span>
          </div>
        </div>

        <nav className="gy-nav" aria-label="Navegación del panel">
          {menu.map((item) => (
            <NavLink
              key={item.ruta}
              to={item.ruta}
              end={item.exacto === true}
              className={({ isActive }) => `gy-nav-item${isActive ? ' gy-nav-item--activo' : ''}`}
            >
              <Icono nombre={item.icono} />
              <span>{item.etiqueta}</span>
            </NavLink>
          ))}
        </nav>

        <div className="gy-lateral-usuario">
          <span className="gy-avatar" aria-hidden="true">{iniciales}</span>
          <div className="gy-lateral-usuario-texto">
            <strong>{sesion ? `${sesion.nombres} ${sesion.apellidos}` : ''}</strong>
            <span>{NOMBRE_ROL[sesion?.rol] ?? sesion?.rol}</span>
          </div>
          <button
            type="button"
            className="gy-lateral-salir"
            onClick={salir}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <Icono nombre="salir" />
          </button>
        </div>
      </aside>

      {menuAbierto && (
        <button
          type="button"
          className="gy-cortina"
          onClick={() => setMenuAbierto(false)}
          aria-label="Cerrar menú"
          tabIndex={-1}
        />
      )}

      <div className="gy-principal">
        <header className="gy-cabecera">
          <button
            type="button"
            className="gy-cabecera-menu"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
          >
            <Icono nombre="menu" />
          </button>
          <h1 className="gy-cabecera-titulo">{actual?.titulo ?? actual?.etiqueta ?? ''}</h1>
        </header>

        <div className="gy-contenido">
          <AvisoDemo />
          {children}
        </div>
      </div>
    </div>
  )
}
