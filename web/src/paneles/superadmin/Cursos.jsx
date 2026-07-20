// Cursos (superadmin): el catalogo global, independiente del ciclo. Que un
// curso se dicte o no en un ciclo se decide en Asignaciones, no aqui.

import { useState } from 'react'
import { useSesion } from '../../auth/SesionContexto.jsx'
import { guardarCurso, obtenerCursosCatalogo } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Tabla from '../../componentes/Tabla.jsx'
import Boton from '../../componentes/Boton.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'

export default function Cursos() {
  const { sesion } = useSesion()
  const [formulario, setFormulario] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const cursos = useDatos(() => obtenerCursosCatalogo(sesion), sesion.id_usuario)

  const alGuardar = async (evento) => {
    evento.preventDefault()
    setMensaje(null)
    setGuardando(true)
    const resultado = await guardarCurso(sesion, formulario)
    setGuardando(false)
    if (resultado.ok) {
      setFormulario(null)
      setMensaje({ tipo: 'exito', texto: `Curso ${resultado.curso.nombre} creado. Para que se dicte en un ciclo, asígnalo en la sección Asignaciones.` })
      cursos.recargar()
    } else {
      setMensaje({ tipo: 'error', texto: resultado.error })
    }
  }

  const columnas = [
    { clave: 'orden', titulo: 'Orden' },
    { clave: 'nombre', titulo: 'Curso' },
    { clave: 'descripcion', titulo: 'Descripción', render: (c) => c.descripcion || '—' },
  ]

  if (cursos.cargando) return <Cargando texto="Cargando el catálogo…" />
  if (cursos.error) return <p className="gy-alerta gy-alerta--error">{cursos.error}</p>

  return (
    <div>
      <Tarjeta
        titulo="Catálogo global de cursos"
        acciones={
          <Boton variante="acento" onClick={() => { setFormulario({ nombre: '', descripcion: '' }); setMensaje(null) }}>
            Nuevo curso
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
          filas={cursos.datos}
          llaveFila={(c) => c.id_curso}
          vacio={<EstadoVacio titulo="El catálogo está vacío" detalle="Crea el primer curso con el botón Nuevo curso." />}
        />
        <p className="gy-ayuda-campo" style={{ marginTop: '0.75rem' }}>
          El catálogo es global: el mismo curso (ej. Matemática) se puede dictar en varios
          ciclos con docentes distintos, sin duplicarlo.
        </p>
      </Tarjeta>

      {formulario && (
        <Tarjeta titulo="Nuevo curso">
          <form onSubmit={alGuardar} noValidate>
            <div className="gy-campo">
              <label className="gy-etiqueta" htmlFor="cur-nombre">Nombre del curso</label>
              <input
                id="cur-nombre"
                className="gy-input"
                type="text"
                placeholder="Ej. Física"
                value={formulario.nombre}
                onChange={(e) => setFormulario((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div className="gy-campo">
              <label className="gy-etiqueta" htmlFor="cur-desc">Descripción (opcional)</label>
              <input
                id="cur-desc"
                className="gy-input"
                type="text"
                value={formulario.descripcion}
                onChange={(e) => setFormulario((f) => ({ ...f, descripcion: e.target.value }))}
              />
            </div>
            <div className="gy-acciones-fila">
              <Boton type="submit" variante="acento" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Crear curso'}
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
