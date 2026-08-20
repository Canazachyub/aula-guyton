// Banqueo Guyton UNA Puno: práctica de preguntas de opción múltiple para el
// estudiante. Gamificación SIMPLE (decisión cerrada en docs/BANQUEO.md §6):
// % de dominio por curso y el fénix que acompaña; sin gemas, racha ni mapa.
//
// Tres pasos: (1) la lista de cursos con su avance, (2) la elección del tema a
// practicar (chips con su conteo, más "Todos los temas") y (3) la práctica con
// NAVEGACIÓN libre entre las preguntas de la tanda (ir y volver), feedback
// inmediato, la justificación y la FUENTE de cada pregunta. El progreso vive EN
// MEMORIA (modo DEMO): se reinicia al recargar, y el aviso lo deja claro.

import { useEffect, useState } from 'react'
import { useSesion } from '../../auth/SesionContexto.jsx'
import {
  MODO_DEMO,
  obtenerBanqueoCursos,
  obtenerBanqueoTemas,
  obtenerBanqueoPreguntas,
  obtenerBanqueoProgreso,
  obtenerBanqueoRanking,
  registrarRespuestaBanqueo,
} from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Boton from '../../componentes/Boton.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import Icono from '../../componentes/Icono.jsx'
import { slugCurso } from '../../componentes/formatos.js'

// El asset vive en public/. Se referencia con BASE_URL para que funcione en
// cualquier subruta de hosting (GitHub Pages) sin conocer el nombre del repo.
const MASCOTA_HERO = `${import.meta.env.BASE_URL}mascota/volando.webp`
const MASCOTA_LOGRO = `${import.meta.env.BASE_URL}mascota/heroe.webp`

const TONOS_RELLENO = ['', '--acento', '--exito']

export default function Banqueo() {
  const { sesion } = useSesion()
  const [curso, setCurso] = useState(null)
  // null => "Todos los temas". Solo tiene sentido cuando enPractica es true.
  const [tema, setTema] = useState(null)
  const [enPractica, setEnPractica] = useState(false)
  // Cambia al volver de una práctica para forzar la recarga del avance.
  const [refresco, setRefresco] = useState(0)

  const volverACursos = () => {
    setCurso(null)
    setEnPractica(false)
    setRefresco((n) => n + 1)
  }

  if (!curso) {
    return (
      <BanqueoCursos
        sesion={sesion}
        refresco={refresco}
        onElegir={(c) => {
          setCurso(c)
          setEnPractica(false)
        }}
      />
    )
  }

  if (!enPractica) {
    return (
      <BanqueoTemas
        sesion={sesion}
        curso={curso}
        onEmpezar={(t) => {
          setTema(t)
          setEnPractica(true)
        }}
        onVolver={volverACursos}
      />
    )
  }

  return (
    <BanqueoPractica
      sesion={sesion}
      curso={curso}
      tema={tema}
      onCambiarTema={() => setEnPractica(false)}
      onVolver={volverACursos}
    />
  )
}

// ---------------------------------------------------------------------------
// Paso 1: cursos con su % de dominio y el fénix como acompañante.
// ---------------------------------------------------------------------------

function BanqueoCursos({ sesion, refresco, onElegir }) {
  const { datos, cargando, error } = useDatos(async () => {
    const [cursos, progreso, ranking] = await Promise.all([
      obtenerBanqueoCursos(sesion),
      obtenerBanqueoProgreso(sesion),
      // El ranking es un extra: si el backend aún no tiene la acción (antes de
      // redesplegar), no debe tumbar toda la página — degrada a vacío.
      obtenerBanqueoRanking(sesion).catch(() => ({ ranking: [], yo: null, total: 0 })),
    ])
    return { cursos, progreso, ranking }
  }, `${sesion.id_usuario}-${refresco}`, `est-banqueo-cursos:${sesion.id_usuario}`)

  if (cargando) return <Cargando texto="Cargando el banco de preguntas…" />
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>

  const { cursos, progreso, ranking } = datos
  const progresoPorCurso = new Map(progreso.map((p) => [p.curso, p]))

  return (
    <div>
      <section className="gy-banqueo-hero">
        <img
          className="gy-banqueo-hero-mascota"
          src={MASCOTA_HERO}
          alt="Fénix, la mascota de la Academia Guyton"
          width="120"
          height="120"
        />
        <div>
          <span className="gy-repasos-etiqueta">Banqueo Guyton UNA Puno</span>
          <h2 className="gy-banqueo-hero-titulo">Practica y sube tu dominio</h2>
          <p className="gy-banqueo-hero-texto">
            Elige un curso, escoge el tema que quieras reforzar y responde preguntas de opción
            múltiple. Verás la explicación al instante y de qué examen sale cada pregunta.
          </p>
        </div>
      </section>

      {MODO_DEMO && (
        <p className="gy-banqueo-curso-detalle" style={{ marginBottom: '1rem' }}>
          Tu avance del banqueo es de práctica (modo demostración): se reinicia al recargar la página.
        </p>
      )}

      {cursos.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no hay preguntas en el banco"
          detalle="Cuando la academia cargue el banco de preguntas, aquí verás tus cursos para practicar."
        />
      ) : (
        <div className="gy-grilla gy-grilla--2">
          {cursos.map((c, i) => {
            const avance = progresoPorCurso.get(c.curso)
            const porcentaje = avance?.porcentaje ?? 0
            const respondidas = avance?.respondidas ?? 0
            const tono = TONOS_RELLENO[i % TONOS_RELLENO.length]
            return (
              <Tarjeta key={c.curso} className="gy-banqueo-curso">
                <div className="gy-banqueo-curso-imagen">
                  <img
                    src={`${import.meta.env.BASE_URL}cursos/${slugCurso(c.curso)}.webp`}
                    alt={c.curso}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
                <div className="gy-banqueo-curso-cabecera">
                  <div>
                    <h3 className="gy-tarjeta-titulo">{c.curso}</h3>
                    <p className="gy-tarjeta-subtitulo">
                      {c.total} {c.total === 1 ? 'pregunta' : 'preguntas'} en el banco
                    </p>
                  </div>
                  <span className="gy-banqueo-dominio">{porcentaje}%</span>
                </div>

                <div className="gy-progreso" aria-hidden="true">
                  <div
                    className={`gy-progreso-relleno${tono}`}
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
                <p className="gy-banqueo-curso-detalle">
                  {respondidas === 0
                    ? 'Aún no practicas este curso'
                    : `${avance.correctas} de ${respondidas} correctas · % de dominio`}
                </p>

                <div className="gy-acciones-fila">
                  <Boton variante="acento" onClick={() => onElegir(c.curso)}>
                    {respondidas === 0 ? 'Empezar a practicar' : 'Seguir practicando'}
                  </Boton>
                </div>
              </Tarjeta>
            )
          })}
        </div>
      )}

      <BanqueoRanking ranking={ranking} idUsuario={sesion.id_usuario} />
    </div>
  )
}

// Ranking del banqueo: cómo va el alumno frente a la competencia. Muestra el
// top y resalta la fila propia; si el alumno está fuera del top, lo añade al pie.
function BanqueoRanking({ ranking, idUsuario }) {
  const lista = ranking?.ranking ?? []
  const yo = ranking?.yo ?? null
  const total = ranking?.total ?? 0
  if (lista.length === 0) return null

  const yoEnTop = lista.some((r) => r.id_usuario === idUsuario)
  const medalla = (puesto) => (puesto === 1 ? '🥇' : puesto === 2 ? '🥈' : puesto === 3 ? '🥉' : puesto)

  return (
    <Tarjeta className="gy-ranking">
      <div className="gy-ranking-cabecera">
        <h3 className="gy-tarjeta-titulo">🏆 Ranking del banqueo</h3>
        <span className="gy-tarjeta-subtitulo">{total} {total === 1 ? 'estudiante' : 'estudiantes'} compitiendo</span>
      </div>
      {yo && (
        <p className="gy-ranking-tuposicion">
          Tu posición: <strong>#{yo.puesto}</strong> · {yo.correctas} correctas ({yo.porcentaje}% de acierto)
        </p>
      )}
      <ol className="gy-ranking-lista">
        {lista.map((r) => (
          <li key={r.id_usuario} className={`gy-ranking-item${r.id_usuario === idUsuario ? ' gy-ranking-item--yo' : ''}`}>
            <span className="gy-ranking-puesto">{medalla(r.puesto)}</span>
            <span className="gy-ranking-nombre">{r.nombre}{r.id_usuario === idUsuario ? ' (tú)' : ''}</span>
            <span className="gy-ranking-correctas">{r.correctas}</span>
            <span className="gy-ranking-porc">{r.porcentaje}%</span>
          </li>
        ))}
        {yo && !yoEnTop && (
          <li className="gy-ranking-item gy-ranking-item--yo gy-ranking-item--fuera">
            <span className="gy-ranking-puesto">{yo.puesto}</span>
            <span className="gy-ranking-nombre">{yo.nombre} (tú)</span>
            <span className="gy-ranking-correctas">{yo.correctas}</span>
            <span className="gy-ranking-porc">{yo.porcentaje}%</span>
          </li>
        )}
      </ol>
    </Tarjeta>
  )
}

// ---------------------------------------------------------------------------
// Paso 2: elegir el tema a practicar (chips con conteo + "Todos los temas").
// ---------------------------------------------------------------------------

function BanqueoTemas({ sesion, curso, onEmpezar, onVolver }) {
  const { datos, cargando, error } = useDatos(
    () => obtenerBanqueoTemas(sesion, { curso }),
    curso,
    `est-banqueo-temas:${curso}:${sesion.id_usuario}`,
  )

  const encabezado = (
    <div className="gy-banqueo-barra">
      <Boton variante="secundario" chico onClick={onVolver}>
        ← Volver a los cursos
      </Boton>
      <span className="gy-banqueo-barra-curso">{curso}</span>
    </div>
  )

  if (cargando) return <Cargando texto={`Cargando los temas de ${curso}…`} />
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>

  const temas = datos ?? []
  const totalCurso = temas.reduce((suma, t) => suma + t.total, 0)

  if (temas.length === 0) {
    return (
      <div>
        {encabezado}
        <EstadoVacio
          titulo="Este curso aún no tiene preguntas"
          detalle="Cuando se carguen preguntas de este curso, podrás practicarlas aquí."
        />
      </div>
    )
  }

  return (
    <div>
      {encabezado}

      <Tarjeta className="gy-banqueo-selector">
        <h3 className="gy-banqueo-hero-titulo">¿Qué tema quieres practicar?</h3>
        <p className="gy-banqueo-hero-texto">
          Elige un tema para enfocar tu práctica o practica con todo el banco del curso.
        </p>

        <div className="gy-banqueo-temas">
          <button
            type="button"
            className="gy-banqueo-chip gy-banqueo-chip--todos"
            onClick={() => onEmpezar(null)}
          >
            <span>Todos los temas</span>
            <span className="gy-banqueo-chip-conteo">{totalCurso}</span>
          </button>

          {temas.map((t) => (
            <button
              key={t.tema}
              type="button"
              className="gy-banqueo-chip"
              onClick={() => onEmpezar(t.tema)}
            >
              <span>{t.tema}</span>
              <span className="gy-banqueo-chip-conteo">{t.total}</span>
            </button>
          ))}
        </div>
      </Tarjeta>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Paso 3: práctica con NAVEGACIÓN libre (ir y volver) y feedback inmediato.
// ---------------------------------------------------------------------------

// Duración del temporizador por pregunta (2:30 = 150 s), estilo ficha óptica.
const DURACION_PREGUNTA = 150

function formatoReloj(segundos) {
  const s = Math.max(0, segundos)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

function BanqueoPractica({ sesion, curso, tema, onCambiarTema, onVolver }) {
  // Contador de tanda: al pedir "Nueva tanda" cambia la clave de carga y trae
  // otra selección barajada del banco.
  const [tanda, setTanda] = useState(0)

  const preguntas = useDatos(
    () => obtenerBanqueoPreguntas(sesion, { curso, tema: tema || undefined, limite: 20 }),
    `${curso}|${tema ?? ''}|${tanda}`,
    `est-banqueo-preguntas:${curso}|${tema ?? ''}|${tanda}:${sesion.id_usuario}`,
  )

  const [indice, setIndice] = useState(0)
  // respuestas[i] = número de opción elegido (1..5) para la pregunta i.
  const [respuestas, setRespuestas] = useState({})
  // Índices ya contabilizados en el progreso (evita el doble conteo al navegar).
  const [registrados, setRegistrados] = useState(() => new Set())
  // Índices donde se agotó el tiempo sin responder (se revelan, no cuentan).
  const [tiempoAgotado, setTiempoAgotado] = useState(() => new Set())
  const [finalizado, setFinalizado] = useState(false)
  const [segundos, setSegundos] = useState(DURACION_PREGUNTA)

  // Al cambiar de pregunta (o de tanda) el reloj se reinicia a 2:30.
  useEffect(() => {
    setSegundos(DURACION_PREGUNTA)
  }, [indice, tanda])

  // Cuenta atrás: solo corre en una pregunta viva (sin responder, sin tiempo
  // agotado, y no en la pantalla de resumen). Al llegar a 0 la marca como
  // "tiempo agotado" (se revela la correcta pero no suma acierto).
  useEffect(() => {
    const listaLocal = preguntas.datos ?? []
    const yaResuelta = respuestas[indice] != null || tiempoAgotado.has(indice)
    if (finalizado || listaLocal.length === 0 || yaResuelta) return
    if (segundos <= 0) {
      setTiempoAgotado((prev) => new Set(prev).add(indice))
      return
    }
    const id = setTimeout(() => setSegundos((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [segundos, respuestas, indice, tiempoAgotado, finalizado, preguntas.datos])

  const reiniciarEstado = () => {
    setIndice(0)
    setRespuestas({})
    setRegistrados(new Set())
    setTiempoAgotado(new Set())
    setFinalizado(false)
    setSegundos(DURACION_PREGUNTA)
  }

  const nuevaTanda = () => {
    reiniciarEstado()
    setTanda((n) => n + 1)
  }

  if (preguntas.cargando) return <Cargando texto={`Cargando preguntas de ${curso}…`} />
  if (preguntas.error) return <p className="gy-alerta gy-alerta--error">{preguntas.error}</p>

  const lista = preguntas.datos ?? []
  const etiquetaTema = tema || 'Todos los temas'

  const encabezado = (
    <div className="gy-banqueo-barra">
      <Boton variante="secundario" chico onClick={onVolver}>
        ← Volver a los cursos
      </Boton>
      <Boton variante="secundario" chico onClick={onCambiarTema}>
        Cambiar tema
      </Boton>
      <span className="gy-banqueo-barra-curso">
        {curso} · {etiquetaTema}
      </span>
    </div>
  )

  if (lista.length === 0) {
    return (
      <div>
        {encabezado}
        <EstadoVacio
          titulo="Este tema aún no tiene preguntas"
          detalle="Cuando se carguen preguntas para este tema, podrás practicarlas aquí."
        />
      </div>
    )
  }

  const respondidas = Object.keys(respuestas).length
  const aciertos = lista.reduce(
    (suma, p, i) => (respuestas[i] === p.correcta ? suma + 1 : suma),
    0,
  )

  // Resumen final (opcional): se llega con el botón "Finalizar y ver resumen".
  if (finalizado) {
    const fallos = respondidas - aciertos
    const sinResponder = lista.length - respondidas
    const porcentaje = respondidas ? Math.round((aciertos / respondidas) * 100) : 0
    // Anillo de puntaje (SVG): circunferencia 2·π·r con r=52.
    const RADIO = 52
    const CIRC = 2 * Math.PI * RADIO
    const trazo = (porcentaje / 100) * CIRC
    return (
      <div>
        {encabezado}
        <Tarjeta className="gy-banqueo-resumen">
          <img
            className="gy-banqueo-resumen-mascota"
            src={MASCOTA_LOGRO}
            alt="Fénix, la mascota de la Academia Guyton"
            width="110"
            height="110"
          />
          <h3 className="gy-banqueo-hero-titulo">¡Terminaste esta tanda de {curso}!</h3>

          <div className="gy-banqueo-anillo">
            <svg viewBox="0 0 120 120" width="140" height="140" aria-hidden="true">
              <circle className="gy-anillo-fondo" cx="60" cy="60" r={RADIO} />
              <circle
                className="gy-anillo-valor"
                cx="60"
                cy="60"
                r={RADIO}
                strokeDasharray={`${trazo} ${CIRC}`}
              />
            </svg>
            <div className="gy-banqueo-anillo-centro">
              <span className="gy-banqueo-anillo-num">{porcentaje}%</span>
              <span className="gy-banqueo-anillo-txt">dominio</span>
            </div>
          </div>

          <div className="gy-banqueo-marcador">
            <div className="gy-banqueo-stat gy-banqueo-stat--exito">
              <span className="gy-banqueo-stat-num">{aciertos}</span>
              <span className="gy-banqueo-stat-txt">Correctas</span>
            </div>
            <div className="gy-banqueo-stat gy-banqueo-stat--error">
              <span className="gy-banqueo-stat-num">{fallos}</span>
              <span className="gy-banqueo-stat-txt">Incorrectas</span>
            </div>
            <div className="gy-banqueo-stat gy-banqueo-stat--neutro">
              <span className="gy-banqueo-stat-num">{sinResponder}</span>
              <span className="gy-banqueo-stat-txt">Sin responder</span>
            </div>
          </div>

          <div className="gy-acciones-fila">
            <Boton variante="acento" onClick={nuevaTanda}>
              Nueva tanda
            </Boton>
            <Boton variante="secundario" onClick={onCambiarTema}>
              Cambiar tema
            </Boton>
            <Boton variante="secundario" onClick={onVolver}>
              Volver a los cursos
            </Boton>
          </div>
        </Tarjeta>
      </div>
    )
  }

  const pregunta = lista[indice]
  const seleccion = respuestas[indice] ?? null
  const seAgotoElTiempo = tiempoAgotado.has(indice) && seleccion == null
  const respondida = seleccion != null || seAgotoElTiempo
  const acerto = seleccion != null && seleccion === pregunta.correcta
  // Alerta visual del reloj: naranja bajo 30 s, rojo bajo 10 s.
  const relojEstado = seAgotoElTiempo || segundos <= 10 ? 'critico' : segundos <= 30 ? 'alerta' : 'ok'

  // Marcar es OPTIMISTA: la UI responde al instante y el registro de progreso
  // se dispara en segundo plano (sin await, sin bloquear el siguiente clic).
  const elegir = (numero) => {
    if (respondida) return
    setRespuestas((prev) => ({ ...prev, [indice]: numero }))
    // Registro sin duplicar: solo la primera vez que se responde CADA pregunta.
    if (!registrados.has(indice)) {
      setRegistrados((prev) => new Set(prev).add(indice))
      registrarRespuestaBanqueo(sesion, { curso, correcta_bool: numero === pregunta.correcta }).catch(() => {})
    }
  }

  const claseOpcion = (numero) => {
    if (!respondida) return 'gy-banqueo-opcion'
    if (numero === pregunta.correcta) return 'gy-banqueo-opcion gy-banqueo-opcion--correcta'
    if (numero === seleccion) return 'gy-banqueo-opcion gy-banqueo-opcion--incorrecta'
    return 'gy-banqueo-opcion gy-banqueo-opcion--apagada'
  }

  const clasePunto = (i) => {
    const clases = ['gy-banqueo-punto']
    if (i === indice) clases.push('gy-banqueo-punto--actual')
    const elegida = respuestas[i]
    if (elegida != null) {
      clases.push(elegida === lista[i].correcta ? 'gy-banqueo-punto--acierto' : 'gy-banqueo-punto--fallo')
    }
    return clases.join(' ')
  }

  return (
    <div>
      {encabezado}

      <div className="gy-banqueo-progreso-info">
        <span>Pregunta {indice + 1} de {lista.length}</span>
        <span
          className={`gy-banqueo-reloj gy-banqueo-reloj--${relojEstado}`}
          role="timer"
          aria-label="Tiempo restante de la pregunta"
        >
          <Icono nombre="reloj" tamano={16} />
          {seAgotoElTiempo ? '¡Tiempo!' : formatoReloj(segundos)}
        </span>
        <span>Aciertos: {aciertos} · Respondidas: {respondidas}</span>
      </div>

      {/* Fila de puntitos para saltar directo a cualquier pregunta de la tanda. */}
      <div className="gy-banqueo-puntos" role="tablist" aria-label="Preguntas de la tanda">
        {lista.map((p, i) => (
          <button
            key={p.id_pregunta}
            type="button"
            className={clasePunto(i)}
            onClick={() => setIndice(i)}
            aria-label={`Ir a la pregunta ${i + 1}`}
            aria-current={i === indice ? 'true' : undefined}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <Tarjeta className="gy-banqueo-pregunta">
        <div className="gy-banqueo-pregunta-cab">
          <p className="gy-micro gy-seccion-micro">
            {pregunta.tema}{pregunta.subtema ? ` · ${pregunta.subtema}` : ''}
          </p>
          {pregunta.fuente && (
            <span className="gy-banqueo-fuente-badge" title={`Fuente: ${pregunta.fuente}`}>
              <Icono nombre="repasos" tamano={14} />
              <span className="gy-banqueo-fuente-badge-txt">{pregunta.fuente}</span>
            </span>
          )}
        </div>
        <h3 className="gy-banqueo-enunciado">{pregunta.enunciado}</h3>

        {pregunta.imagen_url && (
          <img
            className="gy-banqueo-imagen"
            src={pregunta.imagen_url}
            alt={`Figura de la pregunta: ${pregunta.enunciado}`}
          />
        )}

        <div className="gy-banqueo-opciones">
          {pregunta.opciones.map((texto, i) => {
            const numero = i + 1
            return (
              <button
                key={numero}
                type="button"
                className={claseOpcion(numero)}
                onClick={() => elegir(numero)}
                disabled={respondida}
              >
                <span className="gy-banqueo-opcion-letra">{String.fromCharCode(65 + i)}</span>
                <span>{texto}</span>
              </button>
            )
          })}
        </div>

        {respondida && (
          <div className={`gy-banqueo-feedback gy-banqueo-feedback--${acerto ? 'exito' : seAgotoElTiempo ? 'alerta' : 'error'}`}>
            <p className="gy-banqueo-feedback-titulo">
              {acerto ? '¡Correcto!' : seAgotoElTiempo ? '⏱ Tiempo agotado' : 'Incorrecto'}
            </p>
            <p className="gy-banqueo-feedback-texto">{pregunta.justificacion}</p>
          </div>
        )}
      </Tarjeta>

      {/* Navegación libre: ir y volver entre las preguntas de la tanda. */}
      <div className="gy-banqueo-nav">
        <Boton variante="secundario" onClick={() => setIndice((i) => i - 1)} disabled={indice === 0}>
          ← Anterior
        </Boton>
        {indice + 1 < lista.length ? (
          <Boton variante="acento" onClick={() => setIndice((i) => i + 1)}>
            Siguiente →
          </Boton>
        ) : (
          <Boton variante="acento" onClick={() => setFinalizado(true)}>
            Finalizar y ver resumen
          </Boton>
        )}
      </div>

      <div className="gy-banqueo-nav-secundaria">
        <Boton variante="secundario" chico onClick={nuevaTanda}>
          Nueva tanda
        </Boton>
        <Boton variante="secundario" chico onClick={() => setFinalizado(true)}>
          Finalizar y ver resumen
        </Boton>
      </div>
    </div>
  )
}
