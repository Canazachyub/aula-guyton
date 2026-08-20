// Simulacros (estudiante): ficha óptica de calificación. El superadmin publica
// un PDF; el alumno lo descarga, lo resuelve, y aquí reporta cuántas acertó por
// curso. Se califica con los pesos del prospecto (por área) y entra al ranking.
// NO es un generador de simulacros: solo califica y compara.

import { useState } from 'react'
import { useSesion } from '../../auth/SesionContexto.jsx'
import { obtenerSimulacros, registrarSimulacro } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Boton from '../../componentes/Boton.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import Icono from '../../componentes/Icono.jsx'
import { urlPdfEmbebido } from '../../componentes/formatos.js'

const LETRAS = ['A', 'B', 'C', 'D', 'E']

function AnilloPuntaje({ porcentaje }) {
  const RADIO = 52
  const CIRC = 2 * Math.PI * RADIO
  const trazo = (Math.max(0, Math.min(100, porcentaje)) / 100) * CIRC
  return (
    <div className="gy-banqueo-anillo">
      <svg viewBox="0 0 120 120" width="140" height="140" aria-hidden="true">
        <circle className="gy-anillo-fondo" cx="60" cy="60" r={RADIO} />
        <circle className="gy-anillo-valor" cx="60" cy="60" r={RADIO} strokeDasharray={`${trazo} ${CIRC}`} />
      </svg>
      <div className="gy-banqueo-anillo-centro">
        <span className="gy-banqueo-anillo-num">{porcentaje}%</span>
        <span className="gy-banqueo-anillo-txt">del máximo</span>
      </div>
    </div>
  )
}

export default function Simulacros() {
  const { sesion } = useSesion()
  const { datos, cargando, error, recargar } = useDatos(
    () => obtenerSimulacros(sesion),
    sesion.id_usuario,
    `est-simulacros:${sesion.id_usuario}`,
  )

  const [area, setArea] = useState('')
  // marcas[curso] = array de letras marcadas por pregunta (índice = nº pregunta).
  const [marcas, setMarcas] = useState({})
  const [dni, setDni] = useState(sesion.dni ?? '')
  const [nombre, setNombre] = useState(`${sesion.nombres ?? ''} ${sesion.apellidos ?? ''}`.trim())
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [resultado, setResultado] = useState(null)

  if (cargando) return <Cargando texto="Cargando el simulacro…" />
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>

  const info = datos.info ?? {}
  const areas = datos.areas ?? []
  const cursosArea = area ? (datos.config?.[area] ?? []) : []
  const ranking = datos.ranking ?? []
  const yo = datos.yo ?? null

  const cambiarArea = (nuevaArea) => {
    setArea(nuevaArea)
    setMarcas({})
    setResultado(null)
    setMensaje(null)
  }

  const marcar = (curso, indice, letra) => {
    setMarcas((prev) => {
      const arr = [...(prev[curso] ?? [])]
      arr[indice] = arr[indice] === letra ? '' : letra // volver a tocar la misma la desmarca
      return { ...prev, [curso]: arr }
    })
  }

  // Cuántas preguntas marcó / total, para la barra de avance.
  const totalPreguntas = cursosArea.reduce((s, c) => s + c.preguntas, 0)
  const marcadasCount = cursosArea.reduce(
    (s, c) => s + (marcas[c.curso] ?? []).filter((x) => x).length, 0,
  )

  const enviar = async (evento) => {
    evento.preventDefault()
    setMensaje(null)
    setEnviando(true)
    const respuestas = cursosArea.map((c) => ({
      curso: c.curso,
      marcadas: Array.from({ length: c.preguntas }, (_, i) => (marcas[c.curso]?.[i]) || ''),
    }))
    const r = await registrarSimulacro(sesion, { area, dni: dni.trim(), nombre: nombre.trim(), respuestas })
    setEnviando(false)
    if (r.ok) {
      setResultado(r.resultado)
      if (r.aviso) setMensaje({ tipo: 'info', texto: r.aviso })
      recargar()
    } else {
      setMensaje({ tipo: 'error', texto: r.error })
    }
  }

  if (!info.pdf_url && areas.length === 0) {
    return (
      <EstadoVacio
        titulo="Todavía no hay un simulacro publicado"
        detalle="Cuando la academia publique el PDF del simulacro y su tabla de puntajes, aquí podrás rendir y calificarte."
      />
    )
  }

  return (
    <div>
      {/* PDF vigente: descargar y previsualizar dentro de la web. */}
      {info.pdf_url && (
        <Tarjeta titulo={info.titulo || 'Simulacro'} icono="documento" tonoIcono="acento">
          <p className="gy-ayuda-campo" style={{ marginBottom: '0.8rem' }}>
            {info.fecha ? `Publicado el ${info.fecha}. ` : ''}Descarga el PDF, resuélvelo en tu ficha y luego reporta abajo cuántas acertaste por curso.
          </p>
          <div className="gy-material-recursos" style={{ marginBottom: '0.8rem' }}>
            <a className="gy-recurso-boton" href={info.pdf_url} target="_blank" rel="noopener noreferrer">
              <Icono nombre="carpeta" tamano={16} /> Descargar / abrir PDF
            </a>
          </div>
          <div className="gy-pdf-visor">
            <iframe src={urlPdfEmbebido(info.pdf_url)} title="PDF del simulacro" loading="lazy" />
          </div>
        </Tarjeta>
      )}

      {/* Ficha óptica: elegir área y reportar aciertos por curso. */}
      {areas.length === 0 ? (
        <EstadoVacio titulo="Falta configurar los puntajes" detalle="La academia aún no cargó la tabla de puntajes (áreas y cursos)." />
      ) : (
        <Tarjeta titulo="Tu ficha de respuestas" icono="lista">
          {mensaje && <p className={`gy-alerta gy-alerta--${mensaje.tipo}`} role="alert">{mensaje.texto}</p>}
          <form onSubmit={enviar} noValidate>
            <div className="gy-grilla gy-grilla--3">
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="sim-area">Área a la que postulas</label>
                <select id="sim-area" className="gy-select" value={area} onChange={(e) => cambiarArea(e.target.value)}>
                  <option value="">Elige tu área…</option>
                  {areas.map((a) => (<option key={a} value={a}>{a}</option>))}
                </select>
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="sim-dni">DNI</label>
                <input id="sim-dni" className="gy-input" type="text" inputMode="numeric" value={dni} onChange={(e) => setDni(e.target.value)} />
              </div>
              <div className="gy-campo">
                <label className="gy-etiqueta" htmlFor="sim-nom">Nombre completo</label>
                <input id="sim-nom" className="gy-input" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
            </div>

            {area && cursosArea.length > 0 && (
              <>
                <div className="gy-ficha-avance">
                  <p className="gy-micro gy-seccion-micro" style={{ margin: 0 }}>Marca una opción por pregunta</p>
                  <span className="gy-ficha-avance-num">{marcadasCount} / {totalPreguntas} marcadas</span>
                </div>

                {(() => {
                  let numero = 0 // numeración continua a lo largo de toda la ficha
                  return cursosArea.map((c) => {
                    const base = numero
                    numero += c.preguntas
                    return (
                      <div key={c.curso} className="gy-ficha-curso">
                        <p className="gy-ficha-curso-nombre">
                          {c.curso} <span className="gy-ayuda-campo">· {c.preguntas} preg.</span>
                        </p>
                        <div className="gy-ficha-preguntas">
                          {Array.from({ length: c.preguntas }).map((_, qi) => (
                            <div key={qi} className="gy-ficha-fila">
                              <span className="gy-ficha-num">{base + qi + 1}</span>
                              <div className="gy-ficha-burbujas">
                                {LETRAS.map((L) => {
                                  const sel = marcas[c.curso]?.[qi] === L
                                  return (
                                    <button
                                      key={L}
                                      type="button"
                                      className={`gy-ficha-burbuja${sel ? ' gy-ficha-burbuja--sel' : ''}`}
                                      onClick={() => marcar(c.curso, qi, L)}
                                      aria-label={`Pregunta ${base + qi + 1}, opción ${L}`}
                                      aria-pressed={sel}
                                    >
                                      {L}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                })()}

                <div className="gy-acciones-fila" style={{ marginTop: '1rem' }}>
                  <Boton type="submit" variante="acento" disabled={enviando || !dni.trim() || !nombre.trim()}>
                    {enviando ? 'Calificando…' : 'Calificar mi ficha'}
                  </Boton>
                </div>
              </>
            )}
          </form>
        </Tarjeta>
      )}

      {/* Resultado de la última ficha calificada. */}
      {resultado && (
        <Tarjeta className="gy-banqueo-resumen" titulo={null}>
          <h3 className="gy-banqueo-hero-titulo">Resultado · {resultado.area}</h3>
          <AnilloPuntaje porcentaje={resultado.porcentaje} />
          <div className="gy-banqueo-marcador">
            <div className="gy-banqueo-stat gy-banqueo-stat--exito">
              <span className="gy-banqueo-stat-num">{resultado.puntaje}</span>
              <span className="gy-banqueo-stat-txt">Puntaje</span>
            </div>
            <div className="gy-banqueo-stat gy-banqueo-stat--neutro">
              <span className="gy-banqueo-stat-num">{resultado.puntaje_max}</span>
              <span className="gy-banqueo-stat-txt">Máximo</span>
            </div>
            <div className="gy-banqueo-stat gy-banqueo-stat--exito">
              <span className="gy-banqueo-stat-num">{resultado.correctas}/{resultado.total}</span>
              <span className="gy-banqueo-stat-txt">Correctas</span>
            </div>
          </div>
          <div className="gy-tabla-envoltura" style={{ width: '100%', marginTop: '0.8rem' }}>
            <table className="gy-tabla">
              <thead>
                <tr><th>Curso</th><th>Aciertos</th><th>Puntaje</th></tr>
              </thead>
              <tbody>
                {resultado.detalle.map((d) => (
                  <tr key={d.curso}>
                    <td data-etiqueta="Curso">{d.curso}</td>
                    <td data-etiqueta="Aciertos">{d.aciertos} / {d.preguntas}</td>
                    <td data-etiqueta="Puntaje">{d.puntaje} <span className="gy-ayuda-campo">/ {d.puntaje_max}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>
      )}

      {/* Ranking del simulacro (mejor puntaje por estudiante). */}
      {ranking.length > 0 && (
        <Tarjeta className="gy-ranking">
          <div className="gy-ranking-cabecera">
            <h3 className="gy-tarjeta-titulo">🏆 Ranking del simulacro</h3>
            <span className="gy-tarjeta-subtitulo">{datos.total} {datos.total === 1 ? 'estudiante' : 'estudiantes'}</span>
          </div>
          {yo && (
            <p className="gy-ranking-tuposicion">
              Tu posición: <strong>#{yo.puesto}</strong> · {yo.puntaje} pts ({yo.porcentaje}%)
            </p>
          )}
          <ol className="gy-ranking-lista">
            {ranking.map((r) => (
              <li key={r.id_usuario || r.dni} className={`gy-ranking-item${r.id_usuario === sesion.id_usuario ? ' gy-ranking-item--yo' : ''}`}>
                <span className="gy-ranking-puesto">{r.puesto === 1 ? '🥇' : r.puesto === 2 ? '🥈' : r.puesto === 3 ? '🥉' : r.puesto}</span>
                <span className="gy-ranking-nombre">{r.nombre}{r.id_usuario === sesion.id_usuario ? ' (tú)' : ''}</span>
                <span className="gy-ranking-correctas">{r.puntaje}</span>
                <span className="gy-ranking-porc">{r.porcentaje}%</span>
              </li>
            ))}
          </ol>
        </Tarjeta>
      )}
    </div>
  )
}
