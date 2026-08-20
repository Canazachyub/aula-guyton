// Ciclos (superadmin): tarjetas por ciclo con su estado, fechas y precios.
// Crear un ciclo y cambiar su estado (planificado -> inscripciones_abiertas
// -> en_curso -> finalizado) se hace desde aqui, sin tocar codigo.

import { useState } from 'react'
import { useSesion } from '../../auth/SesionContexto.jsx'
import { guardarCiclo, obtenerCiclosDelUsuario } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
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

  const ciclos = useDatos(() => obtenerCiclosDelUsuario(sesion), sesion.id_usuario, `sa-ciclos-gestion:${sesion.id_usuario}`)

  const cambiarEstado = async (ciclo, estado) => {
    setMensaje(null)
    const resultado = await guardarCiclo(sesion, { id_ciclo: ciclo.id_ciclo, nombre: ciclo.nombre, estado })
    if (resultado.ok) {
      ciclos.recargar()
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

  const editar = (ciclo) => {
    setMensaje(null)
    setFormulario({
      id_ciclo: ciclo.id_ciclo,
      estado: ciclo.estado,
      nombre: ciclo.nombre,
      anio: ciclo.anio ?? '',
      fecha_inicio: ciclo.fecha_inicio ?? '',
      fecha_fin: ciclo.fecha_fin ?? '',
      precio_matricula: ciclo.precio_matricula ?? '',
      precio_mensualidad: ciclo.precio_mensualidad ?? '',
      n_mensualidades: ciclo.n_mensualidades ?? '',
      descripcion: ciclo.descripcion ?? '',
    })
  }

  const alGuardar = async (evento) => {
    evento.preventDefault()
    setMensaje(null)
    setGuardando(true)
    const editando = Boolean(formulario.id_ciclo)
    // En edición se conserva el estado actual (el estado se cambia desde la tarjeta).
    const carga = editando ? formulario : { ...formulario, estado: 'planificado' }
    const resultado = await guardarCiclo(sesion, carga)
    setGuardando(false)
    if (resultado.ok) {
      setFormulario(null)
      setMensaje({
        tipo: 'exito',
        texto: editando
          ? `Ciclo ${resultado.ciclo.nombre} actualizado (precio y cuotas guardados).`
          : `Ciclo ${resultado.ciclo.nombre} creado. Ahora asígnale cursos en la sección Asignaciones.`,
      })
      ciclos.recargar()
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

  if (ciclos.cargando) return <Cargando texto="Cargando ciclos…" />
  if (ciclos.error) return <p className="gy-alerta gy-alerta--error">{ciclos.error}</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
        <p className="gy-texto-suave" style={{ fontSize: '0.88rem' }}>
          {ciclos.datos.length} {ciclos.datos.length === 1 ? 'ciclo' : 'ciclos'} de preparación
        </p>
        <Boton variante="acento" onClick={() => { setFormulario({ ...FORM_VACIO }); setMensaje(null) }}>
          Nuevo ciclo
        </Boton>
      </div>

      {mensaje && (
        <p className={`gy-alerta gy-alerta--${mensaje.tipo}`} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>
          {mensaje.texto}
        </p>
      )}

      {ciclos.datos.length === 0 ? (
        <EstadoVacio titulo="No hay ciclos todavía" detalle="Crea el primero con el botón Nuevo ciclo." />
      ) : (
        <div className="gy-grilla gy-grilla--2">
          {ciclos.datos.map((c) => (
            <Tarjeta
              key={c.id_ciclo}
              titulo={`Ciclo ${c.nombre}`}
              subtitulo={`${fechaCorta(c.fecha_inicio)} — ${fechaCorta(c.fecha_fin)}`}
              icono="ciclos"
              acciones={<Insignia valor={c.estado} />}
            >
              <ul className="gy-lista">
                <li className="gy-lista-item">
                  <span className="gy-lista-item-detalle">Matrícula</span>
                  <span>{soles(c.precio_matricula)}</span>
                </li>
                <li className="gy-lista-item">
                  <span className="gy-lista-item-detalle">Mensualidad</span>
                  <span>{soles(c.precio_mensualidad)} × {c.n_mensualidades}</span>
                </li>
                {c.descripcion && (
                  <li className="gy-lista-item">
                    <span className="gy-lista-item-detalle">{c.descripcion}</span>
                  </li>
                )}
              </ul>
              <div className="gy-material-pie" style={{ alignItems: 'flex-end', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="gy-ayuda-campo" htmlFor={`estado-${c.id_ciclo}`}>Estado del ciclo</label>
                  <select
                    id={`estado-${c.id_ciclo}`}
                    className="gy-select gy-select--auto"
                    value={c.estado}
                    onChange={(e) => cambiarEstado(c, e.target.value)}
                  >
                    {ESTADOS_CICLO.map((e) => (
                      <option key={e} value={e}>{e.replaceAll('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <Boton variante="secundario" chico onClick={() => editar(c)}>
                  Editar precio y cuotas
                </Boton>
              </div>
            </Tarjeta>
          ))}
        </div>
      )}

      {formulario && (
        <Tarjeta titulo={formulario.id_ciclo ? `Editar ciclo ${formulario.nombre}` : 'Nuevo ciclo'} icono="mas" tonoIcono="acento">
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
            {!formulario.id_ciclo && (
              <p className="gy-ayuda-campo" style={{ marginBottom: '1rem' }}>
                El ciclo nuevo nace en estado planificado. Cuando esté listo, cambia su estado a
                inscripciones abiertas desde su tarjeta.
              </p>
            )}
            <div className="gy-acciones-fila">
              <Boton type="submit" variante="acento" disabled={guardando}>
                {guardando ? 'Guardando…' : formulario.id_ciclo ? 'Guardar cambios' : 'Crear ciclo'}
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
