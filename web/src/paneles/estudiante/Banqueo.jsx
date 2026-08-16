// Banqueo Guyton UNA Puno: práctica de preguntas de opción múltiple para el
// estudiante. Gamificación SIMPLE (decisión cerrada en docs/BANQUEO.md §6):
// % de dominio por curso y el fénix que acompaña; sin gemas, racha ni mapa.
//
// Tres pasos: (1) la lista de cursos con su avance, (2) la elección del tema a
// practicar (chips con su conteo, más "Todos los temas") y (3) la práctica con
// NAVEGACIÓN libre entre las preguntas de la tanda (ir y volver), feedback
// inmediato, la justificación y la FUENTE de cada pregunta. El progreso vive EN
// MEMORIA (modo DEMO): se reinicia al recargar, y el aviso lo deja claro.

import { useState } from 'react'
import { useSesion } from '../../auth/SesionContexto.jsx'
import {
  MODO_DEMO,
  obtenerBanqueoCursos,
  obtenerBanqueoTemas,
  obtenerBanqueoPreguntas,
  obtenerBanqueoProgreso,
  registrarRespuestaBanqueo,
} from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Boton from '../../componentes/Boton.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'

// El asset vive en public/. Se referencia con BASE_URL para que funcione en
// cualquier subruta de hosting (GitHub Pages) sin conocer el nombre del repo.
const MASCOTA = `${import.meta.env.BASE_URL}mascota-fenix-placeholder.svg`

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
    const [cursos, progreso] = await Promise.all([
      obtenerBanqueoCursos(sesion),
      obtenerBanqueoProgreso(sesion),
    ])
    return { cursos, progreso }
  }, `${sesion.id_usuario}-${refresco}`)

  if (cargando) return <Cargando texto="Cargando el banco de preguntas…" />
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>

  const { cursos, progreso } = datos
  const progresoPorCurso = new Map(progreso.map((p) => [p.curso, p]))

  return (
    <div>
      <section className="gy-banqueo-hero">
        <img
          className="gy-banqueo-hero-mascota"
          src={MASCOTA}
          alt="Mascota provisional de la Academia Guyton: un fénix estilizado"
          width="120"
          height="106"
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
    </div>
  )
}

// ---------------------------------------------------------------------------
// Paso 2: elegir el tema a practicar (chips con conteo + "Todos los temas").
// ---------------------------------------------------------------------------

function BanqueoTemas({ sesion, curso, onEmpezar, onVolver }) {
  const { datos, cargando, error } = useDatos(
    () => obtenerBanqueoTemas(sesion, { curso }),
    curso,
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

function BanqueoPractica({ sesion, curso, tema, onCambiarTema, onVolver }) {
  // Contador de tanda: al pedir "Nueva tanda" cambia la clave de carga y trae
  // otra selección barajada del banco.
  const [tanda, setTanda] = useState(0)

  const preguntas = useDatos(
    () => obtenerBanqueoPreguntas(sesion, { curso, tema: tema || undefined, limite: 20 }),
    `${curso}|${tema ?? ''}|${tanda}`,
  )

  const [indice, setIndice] = useState(0)
  // respuestas[i] = número de opción elegido (1..5) para la pregunta i.
  const [respuestas, setRespuestas] = useState({})
  // Índices ya contabilizados en el progreso (evita el doble conteo al navegar).
  const [registrados, setRegistrados] = useState(() => new Set())
  const [registrando, setRegistrando] = useState(false)
  const [finalizado, setFinalizado] = useState(false)

  const reiniciarEstado = () => {
    setIndice(0)
    setRespuestas({})
    setRegistrados(new Set())
    setFinalizado(false)
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
    const porcentaje = respondidas ? Math.round((aciertos / respondidas) * 100) : 0
    return (
      <div>
        {encabezado}
        <Tarjeta className="gy-banqueo-resumen">
          <img
            className="gy-banqueo-resumen-mascota"
            src={MASCOTA}
            alt="Mascota provisional de la Academia Guyton: un fénix estilizado"
            width="110"
            height="97"
          />
          <h3 className="gy-banqueo-hero-titulo">¡Terminaste esta tanda de {curso}!</h3>
          <p className="gy-banqueo-hero-texto">
            Respondiste <strong>{respondidas}</strong> de <strong>{lista.length}</strong> preguntas
            {' '}y acertaste <strong>{aciertos}</strong> ({porcentaje}% de dominio en esta tanda).
          </p>
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
  const respondida = seleccion != null
  const acerto = respondida && seleccion === pregunta.correcta

  const elegir = async (numero) => {
    if (respondida || registrando) return
    setRespuestas((prev) => ({ ...prev, [indice]: numero }))
    // Registro sin duplicar: solo la primera vez que se responde CADA pregunta.
    // Navegar hacia atrás/adelante nunca vuelve a contar (queda respondida).
    if (!registrados.has(indice)) {
      setRegistrados((prev) => new Set(prev).add(indice))
      setRegistrando(true)
      await registrarRespuestaBanqueo(sesion, { curso, correcta_bool: numero === pregunta.correcta })
      setRegistrando(false)
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
        <p className="gy-micro gy-seccion-micro">
          {pregunta.tema}{pregunta.subtema ? ` · ${pregunta.subtema}` : ''}
        </p>
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

        {/* La FUENTE (de qué examen sale la pregunta) siempre visible al pie. */}
        {pregunta.fuente && (
          <p className="gy-banqueo-fuente">
            <span className="gy-banqueo-fuente-etiqueta">Fuente</span>
            {pregunta.fuente}
          </p>
        )}

        {respondida && (
          <div className={`gy-banqueo-feedback gy-banqueo-feedback--${acerto ? 'exito' : 'error'}`}>
            <p className="gy-banqueo-feedback-titulo">
              {acerto ? '¡Correcto!' : 'Incorrecto'}
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
