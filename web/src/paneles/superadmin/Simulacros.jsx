// Simulacros (superadmin): publica el PDF del simulacro vigente y consulta la
// configuración de puntajes (hoja simulacro_config) + el ranking. La tabla de
// puntajes se EDITA a mano en la hoja simulacro_config; aquí solo se muestra.

import { useState } from 'react'
import { useSesion } from '../../auth/SesionContexto.jsx'
import { guardarSimulacroPdf, obtenerSimulacros } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Boton from '../../componentes/Boton.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'

/** Lee un File como base64 (sin el prefijo data:...;base64,). */
function archivoABase64(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => resolve(String(lector.result).split(',')[1] ?? '')
    lector.onerror = reject
    lector.readAsDataURL(archivo)
  })
}

export default function Simulacros() {
  const { sesion } = useSesion()
  const { datos, cargando, error, recargar } = useDatos(
    () => obtenerSimulacros(sesion),
    sesion.id_usuario,
    `sa-simulacros:${sesion.id_usuario}`,
  )

  const [titulo, setTitulo] = useState('')
  const [enlace, setEnlace] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  if (cargando) return <Cargando texto="Cargando simulacros…" />
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>

  const info = datos.info ?? {}
  const areas = datos.areas ?? []
  const config = datos.config ?? {}
  const ranking = datos.ranking ?? []

  const publicar = async (evento) => {
    evento.preventDefault()
    setMensaje(null)
    setGuardando(true)
    const carga = { titulo: titulo.trim() || info.titulo || 'Simulacro' }
    if (archivo) {
      carga.pdf_base64 = await archivoABase64(archivo)
      carga.pdf_mime = archivo.type || 'application/pdf'
    } else if (enlace.trim()) {
      carga.pdf_url = enlace.trim()
    } else {
      setGuardando(false)
      setMensaje({ tipo: 'error', texto: 'Sube un PDF o pega el enlace del PDF.' })
      return
    }
    const r = await guardarSimulacroPdf(sesion, carga)
    setGuardando(false)
    if (r.ok) {
      setMensaje({ tipo: 'exito', texto: 'Simulacro publicado. Los estudiantes ya pueden verlo.' })
      setArchivo(null); setEnlace(''); setTitulo('')
      recargar()
    } else {
      setMensaje({ tipo: 'error', texto: r.error })
    }
  }

  return (
    <div>
      <Tarjeta titulo="Publicar el simulacro vigente" icono="documento" tonoIcono="acento">
        {mensaje && <p className={`gy-alerta gy-alerta--${mensaje.tipo}`} role="alert">{mensaje.texto}</p>}
        {info.pdf_url && (
          <p className="gy-ayuda-campo" style={{ marginBottom: '0.8rem' }}>
            Actual: <strong>{info.titulo || 'Simulacro'}</strong>{info.fecha ? ` · publicado el ${info.fecha}` : ''} ·{' '}
            <a href={info.pdf_url} target="_blank" rel="noopener noreferrer">ver PDF</a>
          </p>
        )}
        <form onSubmit={publicar} noValidate>
          <div className="gy-campo">
            <label className="gy-etiqueta" htmlFor="sim-titulo">Título del simulacro</label>
            <input id="sim-titulo" className="gy-input" type="text" placeholder="Ej. Simulacro 1 · Agosto"
              value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div className="gy-grilla gy-grilla--2">
            <div className="gy-campo">
              <label className="gy-etiqueta" htmlFor="sim-file">Subir PDF</label>
              <input id="sim-file" className="gy-input" type="file" accept="application/pdf"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
            </div>
            <div className="gy-campo">
              <label className="gy-etiqueta" htmlFor="sim-link">…o pegar enlace del PDF (Drive)</label>
              <input id="sim-link" className="gy-input" type="url" placeholder="https://drive.google.com/…"
                value={enlace} onChange={(e) => setEnlace(e.target.value)} disabled={Boolean(archivo)} />
            </div>
          </div>
          <div className="gy-acciones-fila">
            <Boton type="submit" variante="acento" disabled={guardando}>
              {guardando ? 'Publicando…' : 'Publicar simulacro'}
            </Boton>
          </div>
        </form>
      </Tarjeta>

      <Tarjeta titulo="Tabla de puntajes por área (prospecto)" icono="lista">
        <p className="gy-ayuda-campo" style={{ marginBottom: '0.8rem' }}>
          Estos pesos se editan a mano en la hoja <strong>simulacro_config</strong> (columnas: area · curso · preguntas · puntos_pregunta · ponderacion).
        </p>
        {areas.length === 0 ? (
          <EstadoVacio titulo="Aún no hay tabla de puntajes" detalle="Crea la hoja simulacro_config y añade una fila por curso de cada área." />
        ) : (
          areas.map((a) => {
            const cursos = config[a] ?? []
            const max = cursos.reduce((s, c) => s + c.preguntas * c.puntos_pregunta * c.ponderacion, 0)
            return (
              <div key={a} style={{ marginBottom: '1rem' }}>
                <p className="gy-micro gy-seccion-micro">{a} · puntaje máximo {Math.round(max)}</p>
                <div className="gy-tabla-envoltura">
                  <table className="gy-tabla">
                    <thead>
                      <tr><th>Curso</th><th>Preguntas</th><th>Ponderación</th><th>Puntaje máx.</th></tr>
                    </thead>
                    <tbody>
                      {cursos.map((c) => (
                        <tr key={c.curso}>
                          <td data-etiqueta="Curso">{c.curso}</td>
                          <td data-etiqueta="Preguntas">{c.preguntas}</td>
                          <td data-etiqueta="Ponderación">{c.ponderacion}</td>
                          <td data-etiqueta="Puntaje máx.">{Math.round(c.preguntas * c.puntos_pregunta * c.ponderacion * 100) / 100}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })
        )}
      </Tarjeta>

      <Tarjeta className="gy-ranking">
        <div className="gy-ranking-cabecera">
          <h3 className="gy-tarjeta-titulo">🏆 Ranking del simulacro</h3>
          <span className="gy-tarjeta-subtitulo">{datos.total ?? 0} {datos.total === 1 ? 'estudiante' : 'estudiantes'}</span>
        </div>
        {ranking.length === 0 ? (
          <EstadoVacio titulo="Todavía nadie rindió el simulacro" detalle="Cuando los estudiantes califiquen su ficha, aquí verás el ranking." />
        ) : (
          <ol className="gy-ranking-lista">
            {ranking.map((r) => (
              <li key={r.id_usuario || r.dni} className="gy-ranking-item">
                <span className="gy-ranking-puesto">{r.puesto === 1 ? '🥇' : r.puesto === 2 ? '🥈' : r.puesto === 3 ? '🥉' : r.puesto}</span>
                <span className="gy-ranking-nombre">{r.nombre} <span className="gy-ayuda-campo">· {r.area}</span></span>
                <span className="gy-ranking-correctas">{r.puntaje}</span>
                <span className="gy-ranking-porc">{r.porcentaje}%</span>
              </li>
            ))}
          </ol>
        )}
      </Tarjeta>
    </div>
  )
}
