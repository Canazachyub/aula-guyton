// Asignaciones (superadmin): la tabla puente ciclo_cursos. Aqui se decide QUE
// curso se dicta en QUE ciclo y QUIEN lo dicta. El "flujo estrella": asignar
// id_docente a un ciclo_curso hace que le aparezca al docente en su panel,
// sin tocar codigo.

import { useState } from 'react'
import { useSesion } from '../../auth/SesionContexto.jsx'
import {
  guardarAsignacion,
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

  const asignaciones = useDatos(() => obtenerCursosDelUsuario(sesion), sesion.id_usuario)
  const ciclos = useDatos(() => obtenerCiclosDelUsuario(sesion), sesion.id_usuario)
  const catalogo = useDatos(() => obtenerCursosCatalogo(sesion), sesion.id_usuario)
  const docentes = useDatos(
    async () => (await obtenerUsuarios(sesion)).filter((u) => u.rol === 'docente'),
    sesion.id_usuario,
  )

  const asignarDocente = async (cc, idDocente) => {
    setMensaje(null)
    const resultado = await guardarAsignacion(sesion, {
      id_ciclo_curso: cc.id_ciclo_curso,
      id_docente: idDocente,
    })
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

  if (asignaciones.cargando || ciclos.cargando || catalogo.cargando || docentes.cargando) {
    return <Cargando texto="Cargando asignaciones…" />
  }
  const error = asignaciones.error || ciclos.error || catalogo.error || docentes.error
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>

  const columnas = [
    { clave: 'ciclo_nombre', titulo: 'Ciclo' },
    { clave: 'curso_nombre', titulo: 'Curso' },
    {
      clave: 'docente_nombre',
      titulo: 'Docente',
      render: (cc) =>
        cc.docente_nombre
          ? cc.docente_nombre
          : <Insignia valor="borrador" texto="Sin asignar" />,
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
            <option key={d.id_usuario} value={d.id_usuario}>
              {d.nombres} {d.apellidos}
            </option>
          ))}
        </select>
      ),
    },
  ]

  return (
    <div>
      <Tarjeta
        titulo="Qué curso se dicta en qué ciclo, y quién lo dicta"
        acciones={
          <Boton variante="acento" onClick={() => { setFormulario({ id_ciclo: '', id_curso: '', id_docente: '' }); setMensaje(null) }}>
            Nueva asignación
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
          filas={asignaciones.datos}
          llaveFila={(cc) => cc.id_ciclo_curso}
          vacio={
            <EstadoVacio
              titulo="No hay asignaciones todavía"
              detalle="Crea la primera con el botón Nueva asignación."
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
                <select
                  id="asg-ciclo"
                  className="gy-select"
                  value={formulario.id_ciclo}
                  onChange={(e) => setFormulario((f) => ({ ...f, id_ciclo: e.target.value }))}
                >
                  <option value="">Elige un ciclo…</option>
                  {(ciclos.datos ?? []).map((c) => (
                    <option key={c.id_ciclo} value={c.id_ciclo}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="asg-curso">Curso</label>
                <select
                  id="asg-curso"
                  className="gy-select"
                  value={formulario.id_curso}
                  onChange={(e) => setFormulario((f) => ({ ...f, id_curso: e.target.value }))}
                >
                  <option value="">Elige un curso…</option>
                  {(catalogo.datos ?? []).map((c) => (
                    <option key={c.id_curso} value={c.id_curso}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="asg-docente">Docente (opcional por ahora)</label>
                <select
                  id="asg-docente"
                  className="gy-select"
                  value={formulario.id_docente}
                  onChange={(e) => setFormulario((f) => ({ ...f, id_docente: e.target.value }))}
                >
                  <option value="">Sin asignar todavía</option>
                  {(docentes.datos ?? []).map((d) => (
                    <option key={d.id_usuario} value={d.id_usuario}>
                      {d.nombres} {d.apellidos}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="gy-acciones-fila">
              <Boton type="submit" variante="acento" disabled={guardando || !formulario.id_ciclo || !formulario.id_curso}>
                {guardando ? 'Guardando…' : 'Crear asignación'}
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
