// Banqueo Guyton UNA Puno: práctica de preguntas de opción múltiple para el
// estudiante. Gamificación SIMPLE (decisión cerrada en docs/BANQUEO.md §6):
// % de dominio por curso y el fénix que acompaña; sin gemas, racha ni mapa.
//
// Dos pantallas: (1) la lista de cursos con su avance y (2) la práctica curso
// a curso con feedback inmediato y la justificación de cada pregunta. El
// progreso vive EN MEMORIA (modo DEMO): se reinicia al recargar, y el
// AvisoDemo lo deja claro en pantalla.

import { useState } from 'react'
import { useSesion } from '../../auth/SesionContexto.jsx'
import {
  obtenerBanqueoCursos,
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
  const [cursoElegido, setCursoElegido] = useState(null)
  // Cambia al volver de una práctica para forzar la recarga del avance.
  const [refresco, setRefresco] = useState(0)

  if (cursoElegido) {
    return (
      <BanqueoPractica
        sesion={sesion}
        curso={cursoElegido}
        onVolver={() => {
          setCursoElegido(null)
          setRefresco((n) => n + 1)
        }}
      />
    )
  }

  return <BanqueoCursos sesion={sesion} refresco={refresco} onElegir={setCursoElegido} />
}

// ---------------------------------------------------------------------------
// Pantalla 1: cursos con su % de dominio y el fénix como acompañante.
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
            Elige un curso, responde preguntas de opción múltiple y recibe la explicación
            al instante. El fénix te acompaña mientras mejoras tu porcentaje de dominio.
          </p>
        </div>
      </section>

      <p className="gy-banqueo-curso-detalle" style={{ marginBottom: '1rem' }}>
        Tu avance del banqueo es de práctica (modo DEMO): se reinicia al recargar la página.
      </p>

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
// Pantalla 2: práctica curso a curso con feedback inmediato.
// ---------------------------------------------------------------------------

function BanqueoPractica({ sesion, curso, onVolver }) {
  const preguntas = useDatos(() => obtenerBanqueoPreguntas(sesion, { curso }), curso)

  const [indice, setIndice] = useState(0)
  const [seleccion, setSeleccion] = useState(null) // número de opción elegido (1..5)
  const [aciertos, setAciertos] = useState(0)
  const [respondidas, setRespondidas] = useState(0)
  const [registrando, setRegistrando] = useState(false)

  if (preguntas.cargando) return <Cargando texto={`Cargando preguntas de ${curso}…`} />
  if (preguntas.error) return <p className="gy-alerta gy-alerta--error">{preguntas.error}</p>

  const lista = preguntas.datos ?? []

  const encabezado = (
    <div className="gy-banqueo-barra">
      <Boton variante="secundario" chico onClick={onVolver}>
        ← Volver a los cursos
      </Boton>
      <span className="gy-banqueo-barra-curso">{curso}</span>
    </div>
  )

  if (lista.length === 0) {
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

  // Resumen final: cuando ya se recorrieron todas las preguntas.
  if (indice >= lista.length) {
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
          <h3 className="gy-banqueo-hero-titulo">¡Terminaste la práctica de {curso}!</h3>
          <p className="gy-banqueo-hero-texto">
            Acertaste <strong>{aciertos}</strong> de <strong>{respondidas}</strong> preguntas
            {' '}({porcentaje}% de dominio en esta sesión).
          </p>
          <div className="gy-acciones-fila">
            <Boton
              variante="acento"
              onClick={() => {
                setIndice(0)
                setSeleccion(null)
                setAciertos(0)
                setRespondidas(0)
              }}
            >
              Practicar de nuevo
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
  const respondida = seleccion != null
  const acerto = respondida && seleccion === pregunta.correcta

  const elegir = async (numero) => {
    if (respondida || registrando) return
    setSeleccion(numero)
    const esCorrecta = numero === pregunta.correcta
    setRespondidas((n) => n + 1)
    if (esCorrecta) setAciertos((n) => n + 1)
    setRegistrando(true)
    await registrarRespuestaBanqueo(sesion, { curso, correcta_bool: esCorrecta })
    setRegistrando(false)
  }

  const siguiente = () => {
    setSeleccion(null)
    setIndice((i) => i + 1)
  }

  const claseOpcion = (numero) => {
    if (!respondida) return 'gy-banqueo-opcion'
    if (numero === pregunta.correcta) return 'gy-banqueo-opcion gy-banqueo-opcion--correcta'
    if (numero === seleccion) return 'gy-banqueo-opcion gy-banqueo-opcion--incorrecta'
    return 'gy-banqueo-opcion gy-banqueo-opcion--apagada'
  }

  return (
    <div>
      {encabezado}

      <div className="gy-banqueo-progreso-info">
        <span>Pregunta {indice + 1} de {lista.length}</span>
        <span>Aciertos: {aciertos}</span>
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

        {respondida && (
          <div className={`gy-banqueo-feedback gy-banqueo-feedback--${acerto ? 'exito' : 'error'}`}>
            <p className="gy-banqueo-feedback-titulo">
              {acerto ? '¡Correcto!' : 'Incorrecto'}
            </p>
            <p className="gy-banqueo-feedback-texto">{pregunta.justificacion}</p>
          </div>
        )}

        {respondida && (
          <div className="gy-acciones-fila">
            <Boton variante="acento" onClick={siguiente}>
              {indice + 1 < lista.length ? 'Siguiente pregunta' : 'Ver resultado'}
            </Boton>
          </div>
        )}
      </Tarjeta>
    </div>
  )
}
