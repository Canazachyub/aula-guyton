// Estructura comun de los cuatro paneles: barra lateral con navegacion tipo
// pill, cabecera pegajosa con desenfoque, banner DEMO y area de contenido.
// En celular la barra lateral es un cajon que se abre con el boton de menu —
// muchos alumnos entraran desde el telefono, no es opcional.

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

const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function fechaDeHoy() {
  const hoy = new Date()
  return `${DIAS_CORTOS[hoy.getDay()]} ${hoy.getDate()} ${MESES_CORTOS[hoy.getMonth()]} ${hoy.getFullYear()}`
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
              <span className="gy-nav-icono">
                <Icono nombre={item.icono} tamano={17} />
              </span>
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
          <div className="gy-cabecera-bloque">
            <span className="gy-micro">Aula Virtual</span>
            <h1 className="gy-cabecera-titulo">{actual?.titulo ?? actual?.etiqueta ?? ''}</h1>
          </div>
          <div className="gy-cabecera-derecha">
            <span className="gy-fecha-chip">
              <Icono nombre="calendario" tamano={14} />
              {fechaDeHoy()}
            </span>
            <span className="gy-avatar" aria-hidden="true">{iniciales}</span>
          </div>
        </header>

        <div className="gy-contenido">
          <AvisoDemo />
          {children}
        </div>
      </div>
    </div>
  )
}
