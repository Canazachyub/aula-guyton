// Usuarios (superadmin): el padron unico de personas. Permite reasignar rol y
// activar/desactivar cuentas. La capa de datos impide que el superadmin se
// quite el rol o desactive su propia cuenta.

import { useState } from 'react'
import { useSesion } from '../../auth/SesionContexto.jsx'
import { guardarUsuario, obtenerUsuarios } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Insignia from '../../componentes/Insignia.jsx'
import Boton from '../../componentes/Boton.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import { fechaCorta } from '../../componentes/formatos.js'

const ROLES = ['superadmin', 'docente', 'auxiliar', 'estudiante']

function FilaUsuario({ usuario, esPropio, onGuardar }) {
  const [rol, setRol] = useState(usuario.rol)
  const [estado, setEstado] = useState(usuario.estado)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const cambio = rol !== usuario.rol || estado !== usuario.estado

  const guardar = async () => {
    setError('')
    setGuardando(true)
    const resultado = await onGuardar({ id_usuario: usuario.id_usuario, rol, estado })
    setGuardando(false)
    if (!resultado.ok) {
      setError(resultado.error)
      setRol(usuario.rol)
      setEstado(usuario.estado)
    }
  }

  return (
    <tr>
      <td data-etiqueta="Nombre">
        {usuario.nombres} {usuario.apellidos}
        {esPropio && <span className="gy-ayuda-campo"> (tú)</span>}
        {error && <p className="gy-ayuda-campo" style={{ color: 'var(--gy-error)' }}>{error}</p>}
      </td>
      <td data-etiqueta="DNI">{usuario.dni}</td>
      <td data-etiqueta="Contacto">
        <span className="gy-ayuda-campo">{usuario.celular || '—'} · {usuario.email || '—'}</span>
      </td>
      <td data-etiqueta="Rol">
        <select
          className="gy-select gy-select--auto"
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          aria-label={`Rol de ${usuario.nombres} ${usuario.apellidos}`}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </td>
      <td data-etiqueta="Estado">
        <select
          className="gy-select gy-select--auto"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          aria-label={`Estado de ${usuario.nombres} ${usuario.apellidos}`}
        >
          <option value="activo">activo</option>
          <option value="inactivo">inactivo</option>
        </select>
      </td>
      <td data-etiqueta="Registro">{fechaCorta(usuario.fecha_registro)}</td>
      <td data-etiqueta="Cuenta"><Insignia valor={usuario.estado} /></td>
      <td data-etiqueta="Acciones">
        <Boton chico onClick={guardar} disabled={!cambio || guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </Boton>
      </td>
    </tr>
  )
}

export default function Usuarios() {
  const { sesion } = useSesion()
  const usuarios = useDatos(() => obtenerUsuarios(sesion), sesion.id_usuario)

  if (usuarios.cargando) return <Cargando texto="Cargando el padrón…" />
  if (usuarios.error) return <p className="gy-alerta gy-alerta--error">{usuarios.error}</p>

  const columnas = [
    { clave: 'nombre', titulo: 'Nombre' },
    { clave: 'dni', titulo: 'DNI' },
    { clave: 'contacto', titulo: 'Contacto' },
    { clave: 'rol', titulo: 'Rol' },
    { clave: 'estado', titulo: 'Estado' },
    { clave: 'registro', titulo: 'Registro' },
    { clave: 'cuenta', titulo: 'Cuenta' },
    { clave: 'acciones', titulo: 'Acciones' },
  ]

  return (
    <Tarjeta titulo="Padrón de usuarios">
      {usuarios.datos.length === 0 ? (
        <EstadoVacio titulo="No hay usuarios en el padrón" />
      ) : (
        <div className="gy-tabla-envoltura">
          <table className="gy-tabla">
            <thead>
              <tr>
                {columnas.map((c) => (
                  <th key={c.clave}>{c.titulo}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.datos.map((u) => (
                <FilaUsuario
                  key={u.id_usuario}
                  usuario={u}
                  esPropio={u.id_usuario === sesion.id_usuario}
                  onGuardar={async (datos) => {
                    const resultado = await guardarUsuario(sesion, datos)
                    if (resultado.ok) usuarios.recargar()
                    return resultado
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="gy-ayuda-campo" style={{ marginTop: '0.75rem' }}>
        Un usuario tiene un solo rol. Si alguien cumple dos funciones en la práctica,
        se le asigna el de mayor privilegio (regla del modelo de datos).
      </p>
    </Tarjeta>
  )
}
