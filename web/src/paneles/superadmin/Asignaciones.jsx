// Asignaciones (superadmin): la tabla puente ciclo_cursos. Aqui se decide QUE
// curso se dicta en QUE ciclo y QUIEN lo dicta. El "flujo estrella": asignar
// id_docente a un ciclo_curso hace que le aparezca al docente en su panel,
// sin tocar codigo.
//
// Extras: filtros por ciclo/curso, "asignar los 18 cursos del catálogo de una
// sola vez" a un ciclo, y crear cursos personalizados (p. ej. Física I/II/III)
// para casos en que un curso general se dicta en varios niveles.

import { useState } from 'react'
import { useSesion } from '../../auth/SesionContexto.jsx'
import {
  asignarCursosACiclo,
  guardarAsignacion,
  guardarCurso,
  obtenerCiclosDelUsuario,
  obtenerCursosCatalogo,
  obtenerCursosDelUsuario,
  obtenerUsuarios,
} from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Tabla from '../../componentes/Tabla.jsx'
import Insignia from '../../componentes/Insignia.jsx'
import Boton from '../../componentes/Boton.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'

export default function Asignaciones() {
  const { sesion } = useSesion()
  const [formulario, setFormulario] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [filtroCiclo, setFiltroCiclo] = useState('')
  const [filtroCurso, setFiltroCurso] = useState('')
  const [cicloBulk, setCicloBulk] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [cursoNuevo, setCursoNuevo] = useState('')

  const asignaciones = useDatos(() => obtenerCursosDelUsuario(sesion), sesion.id_usuario, `sa-asignaciones:${sesion.id_usuario}`)
  const ciclos = useDatos(() => obtenerCiclosDelUsuario(sesion), sesion.id_usuario, `sa-ciclos:${sesion.id_usuario}`)
  const catalogo = useDatos(() => obtenerCursosCatalogo(sesion), sesion.id_usuario, `sa-catalogo:${sesion.id_usuario}`)
  const docentes = useDatos(
    async () => (await obtenerUsuarios(sesion)).filter((u) => u.rol === 'docente'),
    sesion.id_usuario,
    `sa-docentes:${sesion.id_usuario}`,
  )

  const asignarDocente = async (cc, idDocente) => {
    setMensaje(null)
    const resultado = await guardarAsignacion(sesion, { id_ciclo_curso: cc.id_ciclo_curso, id_docente: idDocente })
    if (resultado.ok) {
      setMensaje({
        tipo: 'exito',
        texto: idDocente
          ? 'Docente asignado. En cuanto el docente entre a su panel, verá este curso.'
          : 'Se quitó la asignación de docente.',
      })
      asignaciones.recargar()
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

  const alGuardar = async (evento) => {
    evento.preventDefault()
    setMensaje(null)
    setGuardando(true)
    const resultado = await guardarAsignacion(sesion, formulario)
    setGuardando(false)
    if (resultado.ok) {
      setFormulario(null)
      setMensaje({ tipo: 'exito', texto: 'Asignación creada.' })
      asignaciones.recargar()
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

  // "Asignar los 18 cursos del catálogo de golpe" al ciclo elegido.
  const asignarTodos = async () => {
    if (!cicloBulk) return
    setMensaje(null)
    setOcupado(true)
    const idCursos = (catalogo.datos ?? []).map((c) => c.id_curso)
    const resultado = await asignarCursosACiclo(sesion, { id_ciclo: cicloBulk, id_cursos: idCursos })
    setOcupado(false)
    if (resultado.ok) {
      const nombre = (ciclos.datos ?? []).find((c) => c.id_ciclo === cicloBulk)?.nombre ?? ''
      setMensaje({
        tipo: 'exito',
        texto: resultado.creados > 0
          ? `Se asignaron ${resultado.creados} curso(s) al ciclo ${nombre}. Ahora asígnales docente en la tabla.`
          : `El ciclo ${nombre} ya tenía todos los cursos del catálogo asignados.`,
      })
      asignaciones.recargar()
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

  // Crear un curso personalizado (Física I, Física II…) que se suma al catálogo.
  const crearCurso = async () => {
    const nombre = cursoNuevo.trim()
    if (!nombre) return
    setMensaje(null)
    setOcupado(true)
    const resultado = await guardarCurso(sesion, { nombre })
    setOcupado(false)
    if (resultado.ok) {
      setCursoNuevo('')
      setMensaje({ tipo: 'exito', texto: `Curso "${nombre}" creado. Ya puedes asignarlo a un ciclo.` })
      catalogo.recargar()
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

  if (asignaciones.cargando || ciclos.cargando || catalogo.cargando || docentes.cargando) {
    return <Cargando texto="Cargando asignaciones…" />
  }
  const error = asignaciones.error || ciclos.error || catalogo.error || docentes.error
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>

  const filas = (asignaciones.datos ?? []).filter((cc) =>
    (!filtroCiclo || cc.id_ciclo === filtroCiclo) && (!filtroCurso || cc.id_curso === filtroCurso),
  )

  const columnas = [
    { clave: 'ciclo_nombre', titulo: 'Ciclo' },
    { clave: 'curso_nombre', titulo: 'Curso' },
    {
      clave: 'docente_nombre',
      titulo: 'Docente',
      render: (cc) => (cc.docente_nombre ? cc.docente_nombre : <Insignia valor="borrador" texto="Sin asignar" />),
    },
    {
      clave: 'acciones',
      titulo: 'Asignar docente',
      render: (cc) => (
        <select
          className="gy-select gy-select--auto"
          value={cc.id_docente}
          onChange={(e) => asignarDocente(cc, e.target.value)}
          aria-label={`Docente de ${cc.curso_nombre} en ${cc.ciclo_nombre}`}
        >
          <option value="">Sin asignar</option>
          {(docentes.datos ?? []).map((d) => (
            <option key={d.id_usuario} value={d.id_usuario}>{d.nombres} {d.apellidos}</option>
          ))}
        </select>
      ),
    },
  ]

  return (
    <div>
      {mensaje && (
        <p className={`gy-alerta gy-alerta--${mensaje.tipo}`} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>
          {mensaje.texto}
        </p>
      )}

      {/* Asignación rápida: los 18 cursos del catálogo + crear cursos por nivel. */}
      <Tarjeta titulo="Asignación rápida por ciclo" icono="enlace" tonoIcono="acento">
        <div className="gy-grilla gy-grilla--2">
          <div className="gy-campo">
            <label className="gy-etiqueta" htmlFor="bulk-ciclo">Asignar todo el catálogo a un ciclo</label>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <select id="bulk-ciclo" className="gy-select" style={{ flex: 1, minWidth: '180px' }} value={cicloBulk}
                onChange={(e) => setCicloBulk(e.target.value)}>
                <option value="">Elige un ciclo…</option>
                {(ciclos.datos ?? []).map((c) => (<option key={c.id_ciclo} value={c.id_ciclo}>{c.nombre}</option>))}
              </select>
              <Boton variante="acento" onClick={asignarTodos} disabled={ocupado || !cicloBulk}>
                {ocupado ? 'Asignando…' : `Asignar ${(catalogo.datos ?? []).length} cursos`}
              </Boton>
            </div>
            <p className="gy-ayuda-campo">Crea de golpe todos los cursos del catálogo en ese ciclo (omite los que ya estén). Luego les pones docente en la tabla.</p>
          </div>
          <div className="gy-campo">
            <label className="gy-etiqueta" htmlFor="curso-nuevo">Crear un curso por nivel (Física I, II, III…)</label>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <input id="curso-nuevo" className="gy-input" style={{ flex: 1, minWidth: '180px' }} type="text"
                placeholder="Ej. Física I" value={cursoNuevo} onChange={(e) => setCursoNuevo(e.target.value)} />
              <Boton variante="secundario" onClick={crearCurso} disabled={ocupado || !cursoNuevo.trim()}>Crear curso</Boton>
            </div>
            <p className="gy-ayuda-campo">Se suma al catálogo. Útil cuando un curso general se dicta en varios niveles.</p>
          </div>
        </div>
      </Tarjeta>

      <Tarjeta
        titulo="Qué curso se dicta en qué ciclo, y quién lo dicta"
        acciones={
          <Boton variante="acento" onClick={() => { setFormulario({ id_ciclo: '', id_curso: '', id_docente: '' }); setMensaje(null) }}>
            Nueva asignación
          </Boton>
        }
      >
        <div className="gy-grilla gy-grilla--2" style={{ marginBottom: '1rem' }}>
          <div className="gy-campo">
            <label className="gy-etiqueta" htmlFor="filtro-ciclo">Filtrar por ciclo</label>
            <select id="filtro-ciclo" className="gy-select" value={filtroCiclo} onChange={(e) => setFiltroCiclo(e.target.value)}>
              <option value="">Todos los ciclos</option>
              {(ciclos.datos ?? []).map((c) => (<option key={c.id_ciclo} value={c.id_ciclo}>{c.nombre}</option>))}
            </select>
          </div>
          <div className="gy-campo">
            <label className="gy-etiqueta" htmlFor="filtro-curso">Filtrar por curso</label>
            <select id="filtro-curso" className="gy-select" value={filtroCurso} onChange={(e) => setFiltroCurso(e.target.value)}>
              <option value="">Todos los cursos</option>
              {(catalogo.datos ?? []).map((c) => (<option key={c.id_curso} value={c.id_curso}>{c.nombre}</option>))}
            </select>
          </div>
        </div>
        <Tabla
          columnas={columnas}
          filas={filas}
          llaveFila={(cc) => cc.id_ciclo_curso}
          vacio={
            <EstadoVacio
              titulo={filtroCiclo || filtroCurso ? 'Sin resultados con ese filtro' : 'No hay asignaciones todavía'}
              detalle={filtroCiclo || filtroCurso ? 'Prueba con otro filtro o usa la asignación rápida.' : 'Crea la primera con Nueva asignación o la asignación rápida.'}
            />
          }
        />
      </Tarjeta>

      {formulario && (
        <Tarjeta titulo="Nueva asignación">
          <form onSubmit={alGuardar} noValidate>
            <div className="gy-grilla gy-grilla--3">
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="asg-ciclo">Ciclo</label>
                <select id="asg-ciclo" className="gy-select" value={formulario.id_ciclo}
                  onChange={(e) => setFormulario((f) => ({ ...f, id_ciclo: e.target.value }))}>
                  <option value="">Elige un ciclo…</option>
                  {(ciclos.datos ?? []).map((c) => (<option key={c.id_ciclo} value={c.id_ciclo}>{c.nombre}</option>))}
                </select>
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="asg-curso">Curso</label>
                <select id="asg-curso" className="gy-select" value={formulario.id_curso}
                  onChange={(e) => setFormulario((f) => ({ ...f, id_curso: e.target.value }))}>
                  <option value="">Elige un curso…</option>
                  {(catalogo.datos ?? []).map((c) => (<option key={c.id_curso} value={c.id_curso}>{c.nombre}</option>))}
                </select>
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="asg-docente">Docente (opcional por ahora)</label>
                <select id="asg-docente" className="gy-select" value={formulario.id_docente}
                  onChange={(e) => setFormulario((f) => ({ ...f, id_docente: e.target.value }))}>
                  <option value="">Sin asignar todavía</option>
                  {(docentes.datos ?? []).map((d) => (<option key={d.id_usuario} value={d.id_usuario}>{d.nombres} {d.apellidos}</option>))}
                </select>
              </div>
            </div>
            <div className="gy-acciones-fila">
              <Boton type="submit" variante="acento" disabled={guardando || !formulario.id_ciclo || !formulario.id_curso}>
                {guardando ? 'Guardando…' : 'Crear asignación'}
              </Boton>
              <Boton variante="secundario" onClick={() => setFormulario(null)} disabled={guardando}>Cancelar</Boton>
            </div>
          </form>
        </Tarjeta>
      )}
    </div>
  )
}
