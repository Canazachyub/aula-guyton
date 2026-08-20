// Usuarios (superadmin): el padron unico de personas. Permite reasignar rol y
// activar/desactivar cuentas. La capa de datos impide que el superadmin se
// quite el rol o desactive su propia cuenta.

import { useState } from 'react'
import { useSesion } from '../../auth/SesionContexto.jsx'
import { crearUsuario, guardarUsuario, obtenerUsuarios } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Insignia from '../../componentes/Insignia.jsx'
import Boton from '../../componentes/Boton.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import { fechaCorta } from '../../componentes/formatos.js'

const ROLES = ['superadmin', 'docente', 'auxiliar', 'estudiante']
const FORM_USUARIO_VACIO = { dni: '', nombres: '', apellidos: '', celular: '', email: '', rol: 'docente', clave_acceso: '' }

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
  const usuarios = useDatos(() => obtenerUsuarios(sesion), sesion.id_usuario, `sa-usuarios:${sesion.id_usuario}`)
  const [formulario, setFormulario] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const crear = async (evento) => {
    evento.preventDefault()
    setMensaje(null)
    setGuardando(true)
    const resultado = await crearUsuario(sesion, formulario)
    setGuardando(false)
    if (resultado.ok) {
      const nom = `${resultado.usuario.nombres} ${resultado.usuario.apellidos}`.trim()
      setMensaje({ tipo: 'exito', texto: `Usuario ${nom} (${resultado.usuario.rol}) creado. Entra con DNI ${resultado.usuario.dni} y clave inicial: ${resultado.clave_inicial}` })
      setFormulario(null)
      usuarios.recargar()
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
        <p className="gy-texto-suave" style={{ fontSize: '0.88rem' }}>
          {usuarios.datos.length} {usuarios.datos.length === 1 ? 'persona' : 'personas'} en el padrón
        </p>
        <Boton variante="acento" onClick={() => { setFormulario({ ...FORM_USUARIO_VACIO }); setMensaje(null) }}>
          Nuevo usuario
        </Boton>
      </div>

      {mensaje && (
        <p className={`gy-alerta gy-alerta--${mensaje.tipo}`} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>
          {mensaje.texto}
        </p>
      )}

      {formulario && (
        <Tarjeta titulo="Nuevo usuario (docente, auxiliar o estudiante)" icono="mas" tonoIcono="acento">
          <form onSubmit={crear} noValidate>
            <div className="gy-grilla gy-grilla--2">
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="usr-dni">DNI</label>
                <input id="usr-dni" className="gy-input" type="text" inputMode="numeric" value={formulario.dni}
                  onChange={(e) => setFormulario((f) => ({ ...f, dni: e.target.value }))} />
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="usr-rol">Rol</label>
                <select id="usr-rol" className="gy-select" value={formulario.rol}
                  onChange={(e) => setFormulario((f) => ({ ...f, rol: e.target.value }))}>
                  {ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
                </select>
              </div>
            </div>
            <div className="gy-grilla gy-grilla--2">
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="usr-nom">Nombres</label>
                <input id="usr-nom" className="gy-input" type="text" value={formulario.nombres}
                  onChange={(e) => setFormulario((f) => ({ ...f, nombres: e.target.value }))} />
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="usr-ape">Apellidos</label>
                <input id="usr-ape" className="gy-input" type="text" value={formulario.apellidos}
                  onChange={(e) => setFormulario((f) => ({ ...f, apellidos: e.target.value }))} />
              </div>
            </div>
            <div className="gy-grilla gy-grilla--3">
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="usr-cel">Celular</label>
                <input id="usr-cel" className="gy-input" type="text" inputMode="numeric" value={formulario.celular}
                  onChange={(e) => setFormulario((f) => ({ ...f, celular: e.target.value }))} />
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="usr-mail">Email</label>
                <input id="usr-mail" className="gy-input" type="email" value={formulario.email}
                  onChange={(e) => setFormulario((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="usr-clave">Clave inicial (opcional)</label>
                <input id="usr-clave" className="gy-input" type="text" placeholder="Por defecto: el DNI" value={formulario.clave_acceso}
                  onChange={(e) => setFormulario((f) => ({ ...f, clave_acceso: e.target.value }))} />
              </div>
            </div>
            <p className="gy-ayuda-campo" style={{ marginBottom: '1rem' }}>
              Si dejas la clave vacía, la clave inicial será el propio DNI. El usuario podrá cambiarla luego.
            </p>
            <div className="gy-acciones-fila">
              <Boton type="submit" variante="acento" disabled={guardando || !formulario.dni.trim() || !formulario.nombres.trim()}>
                {guardando ? 'Creando…' : 'Crear usuario'}
              </Boton>
              <Boton variante="secundario" onClick={() => setFormulario(null)} disabled={guardando}>Cancelar</Boton>
            </div>
          </form>
        </Tarjeta>
      )}

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
    </div>
  )
}
