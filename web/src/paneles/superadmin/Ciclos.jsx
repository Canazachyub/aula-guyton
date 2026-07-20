// Ciclos (superadmin): crea ciclos nuevos y cambia su estado (planificado ->
// inscripciones_abiertas -> en_curso -> finalizado) sin tocar codigo.

import { useState } from 'react'
import { useSesion } from '../../auth/SesionContexto.jsx'
import { guardarCiclo, obtenerCiclosDelUsuario } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Tabla from '../../componentes/Tabla.jsx'
import Insignia from '../../componentes/Insignia.jsx'
import Boton from '../../componentes/Boton.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import { fechaCorta, soles } from '../../componentes/formatos.js'

const ESTADOS_CICLO = ['planificado', 'inscripciones_abiertas', 'en_curso', 'finalizado']
const FORM_VACIO = {
  nombre: '', anio: '', fecha_inicio: '', fecha_fin: '',
  precio_matricula: '', precio_mensualidad: '', n_mensualidades: '', descripcion: '',
}

export default function Ciclos() {
  const { sesion } = useSesion()
  const [formulario, setFormulario] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const ciclos = useDatos(() => obtenerCiclosDelUsuario(sesion), sesion.id_usuario)

  const cambiarEstado = async (ciclo, estado) => {
    setMensaje(null)
    const resultado = await guardarCiclo(sesion, { id_ciclo: ciclo.id_ciclo, nombre: ciclo.nombre, estado })
    if (resultado.ok) {
      ciclos.recargar()
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

  const alGuardar = async (evento) => {
    evento.preventDefault()
    setMensaje(null)
    setGuardando(true)
    const resultado = await guardarCiclo(sesion, { ...formulario, estado: 'planificado' })
    setGuardando(false)
    if (resultado.ok) {
      setFormulario(null)
      setMensaje({ tipo: 'exito', texto: `Ciclo ${resultado.ciclo.nombre} creado. Ahora asígnale cursos en la sección Asignaciones.` })
      ciclos.recargar()
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

  const columnas = [
    { clave: 'nombre', titulo: 'Ciclo' },
    { clave: 'fecha_inicio', titulo: 'Inicio', render: (c) => fechaCorta(c.fecha_inicio) },
    { clave: 'fecha_fin', titulo: 'Fin', render: (c) => fechaCorta(c.fecha_fin) },
    { clave: 'precio_matricula', titulo: 'Matrícula', render: (c) => soles(c.precio_matricula) },
    { clave: 'precio_mensualidad', titulo: 'Mensualidad', render: (c) => soles(c.precio_mensualidad) },
    { clave: 'n_mensualidades', titulo: 'N° mens.' },
    { clave: 'estado', titulo: 'Estado', render: (c) => <Insignia valor={c.estado} /> },
    {
      clave: 'acciones',
      titulo: 'Cambiar estado',
      render: (c) => (
        <select
          className="gy-select gy-select--auto"
          value={c.estado}
          onChange={(e) => cambiarEstado(c, e.target.value)}
          aria-label={`Estado del ciclo ${c.nombre}`}
        >
          {ESTADOS_CICLO.map((e) => (
            <option key={e} value={e}>{e.replaceAll('_', ' ')}</option>
          ))}
        </select>
      ),
    },
  ]

  if (ciclos.cargando) return <Cargando texto="Cargando ciclos…" />
  if (ciclos.error) return <p className="gy-alerta gy-alerta--error">{ciclos.error}</p>

  return (
    <div>
      <Tarjeta
        titulo="Ciclos de preparación"
        acciones={
          <Boton variante="acento" onClick={() => { setFormulario({ ...FORM_VACIO }); setMensaje(null) }}>
            Nuevo ciclo
          </Boton>
        }
      >
        {mensaje && (
          <p className={`gy-alerta gy-alerta--${mensaje.tipo}`} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>
            {mensaje.texto}
          </p>
        )}
        <Tabla
          columnas={columnas}
          filas={ciclos.datos}
          llaveFila={(c) => c.id_ciclo}
          vacio={<EstadoVacio titulo="No hay ciclos todavía" detalle="Crea el primero con el botón Nuevo ciclo." />}
        />
      </Tarjeta>

      {formulario && (
        <Tarjeta titulo="Nuevo ciclo">
          <form onSubmit={alGuardar} noValidate>
            <div className="gy-grilla gy-grilla--2">
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="cic-nombre">Nombre del ciclo</label>
                <input
                  id="cic-nombre"
                  className="gy-input"
                  type="text"
                  placeholder="Ej. 2027-I"
                  value={formulario.nombre}
                  onChange={(e) => setFormulario((f) => ({ ...f, nombre: e.target.value }))}
                />
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="cic-anio">Año</label>
                <input
                  id="cic-anio"
                  className="gy-input"
                  type="number"
                  placeholder="Ej. 2027"
                  value={formulario.anio}
                  onChange={(e) => setFormulario((f) => ({ ...f, anio: e.target.value }))}
                />
              </div>
            </div>
            <div className="gy-grilla gy-grilla--2">
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="cic-inicio">Fecha de inicio</label>
                <input
                  id="cic-inicio"
                  className="gy-input"
                  type="date"
                  value={formulario.fecha_inicio}
                  onChange={(e) => setFormulario((f) => ({ ...f, fecha_inicio: e.target.value }))}
                />
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="cic-fin">Fecha de fin</label>
                <input
                  id="cic-fin"
                  className="gy-input"
                  type="date"
                  value={formulario.fecha_fin}
                  onChange={(e) => setFormulario((f) => ({ ...f, fecha_fin: e.target.value }))}
                />
              </div>
            </div>
            <div className="gy-grilla gy-grilla--3">
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="cic-pmat">Precio de matrícula (S/)</label>
                <input
                  id="cic-pmat"
                  className="gy-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formulario.precio_matricula}
                  onChange={(e) => setFormulario((f) => ({ ...f, precio_matricula: e.target.value }))}
                />
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="cic-pmen">Mensualidad (S/)</label>
                <input
                  id="cic-pmen"
                  className="gy-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formulario.precio_mensualidad}
                  onChange={(e) => setFormulario((f) => ({ ...f, precio_mensualidad: e.target.value }))}
                />
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="cic-nmen">N° de mensualidades</label>
                <input
                  id="cic-nmen"
                  className="gy-input"
                  type="number"
                  min="0"
                  value={formulario.n_mensualidades}
                  onChange={(e) => setFormulario((f) => ({ ...f, n_mensualidades: e.target.value }))}
                />
              </div>
            </div>
            <div className="gy-campo">
              <label className="gy-etiqueta" htmlFor="cic-desc">Descripción (opcional)</label>
              <input
                id="cic-desc"
                className="gy-input"
                type="text"
                value={formulario.descripcion}
                onChange={(e) => setFormulario((f) => ({ ...f, descripcion: e.target.value }))}
              />
            </div>
            <p className="gy-ayuda-campo" style={{ marginBottom: '1rem' }}>
              El ciclo nuevo nace en estado planificado. Cuando esté listo, cambia su estado a
              inscripciones abiertas desde la tabla.
            </p>
            <div className="gy-acciones-fila">
              <Boton type="submit" variante="acento" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Crear ciclo'}
              </Boton>
              <Boton variante="secundario" onClick={() => setFormulario(null)} disabled={guardando}>
                Cancelar
              </Boton>
            </div>
          </form>
        </Tarjeta>
      )}
    </div>
  )
}
