// Mi horario: el patron semanal del estudiante como HORARIO VISUAL (grilla
// dia x hora) en escritorio y como lista por dia en celular. Cada curso tiene
// un color de la familia de marca y el dia de hoy queda resaltado.

import { useSesion } from '../../auth/SesionContexto.jsx'
import { obtenerCursosDelUsuario, obtenerHorario } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import { diaSemana } from '../../componentes/formatos.js'

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
const DIA_HOY = [null, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][new Date().getDay()]
const PX_POR_HORA = 56

// Colores por curso (familia de marca; el naranja solo como uno mas del set)
const COLORES = [
  { fondo: 'var(--gy-tinte-azul)', barra: 'var(--gy-azul-electrico)', texto: 'var(--gy-azul-real)' },
  { fondo: 'var(--gy-tinte-naranja)', barra: 'var(--gy-naranja)', texto: 'var(--gy-naranja-oscuro)' },
  { fondo: 'var(--gy-tinte-exito)', barra: '#16A34A', texto: 'var(--gy-exito)' },
  { fondo: 'var(--gy-tinte-alerta)', barra: '#D97706', texto: 'var(--gy-alerta)' },
]

const aMinutos = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + (m || 0)
}

export default function Horario() {
  const { sesion } = useSesion()
  const { datos, cargando, error } = useDatos(async () => {
    const cursos = await obtenerCursosDelUsuario(sesion)
    return Promise.all(
      cursos.map(async (c, i) => ({
        curso: c,
        color: COLORES[i % COLORES.length],
        bloques: await obtenerHorario(sesion, c.id_ciclo_curso),
      })),
    )
  }, sesion.id_usuario)

  if (cargando) return <Cargando texto="Cargando tu horario…" />
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>

  const bloques = datos.flatMap(({ curso, color, bloques: hs }) =>
    hs.map((h) => ({ ...h, curso_nombre: curso.curso_nombre, color })),
  )

  if (bloques.length === 0) {
    return (
      <EstadoVacio
        titulo="No tienes bloques de horario este ciclo"
        detalle="Cuando la academia arme el horario de tus cursos, lo verás aquí."
      />
    )
  }

  const inicio = Math.min(...bloques.map((b) => aMinutos(b.hora_inicio)))
  const fin = Math.max(...bloques.map((b) => aMinutos(b.hora_fin)))
  const horaMin = Math.max(0, Math.floor(inicio / 60) - 1)
  const horaMax = Math.min(24, Math.ceil(fin / 60) + 1)
  const horas = []
  for (let h = horaMin; h <= horaMax; h += 1) horas.push(h)
  const altura = (horaMax - horaMin) * PX_POR_HORA

  const bloquesDe = (dia) => bloques.filter((b) => b.dia_semana === dia)

  return (
    <div>
      <Tarjeta titulo="Mi semana" subtitulo="El patrón de clases que se repite cada semana" icono="calendario">
        <div className="gy-leyenda">
          {datos.map(({ curso, color }) => (
            <span key={curso.id_ciclo_curso} className="gy-leyenda-item">
              <span className="gy-leyenda-punto" style={{ background: color.barra }} />
              {curso.curso_nombre}
              {curso.docente_nombre && <span className="gy-texto-suave"> · {curso.docente_nombre}</span>}
            </span>
          ))}
        </div>

        {/* Escritorio: grilla dia x hora */}
        <div className="gy-semana" role="table" aria-label="Horario semanal">
          <div className="gy-semana-cabecera" role="row">
            <span className="gy-semana-eje" />
            {DIAS.map((d) => (
              <div key={d} className={`gy-semana-dia${d === DIA_HOY ? ' gy-semana-dia--hoy' : ''}`} role="columnheader">
                {diaSemana(d)}
                {d === DIA_HOY && <span className="gy-hoy">Hoy</span>}
              </div>
            ))}
          </div>
          <div className="gy-semana-cuerpo" style={{ height: `${altura}px` }}>
            <div className="gy-semana-horas" aria-hidden="true">
              {horas.filter((h) => h < horaMax).map((h) => (
                <span key={h} style={{ top: `${(h - horaMin) * PX_POR_HORA}px` }}>
                  {String(h).padStart(2, '0')}:00
                </span>
              ))}
            </div>
            {DIAS.map((d) => (
              <div key={d} className={`gy-semana-columna${d === DIA_HOY ? ' gy-semana-columna--hoy' : ''}`}>
                {bloquesDe(d).map((b) => {
                  const top = ((aMinutos(b.hora_inicio) - horaMin * 60) / 60) * PX_POR_HORA
                  const alto = ((aMinutos(b.hora_fin) - aMinutos(b.hora_inicio)) / 60) * PX_POR_HORA - 4
                  return (
                    <div
                      key={b.id_horario}
                      className="gy-bloque"
                      style={{
                        top: `${top}px`,
                        height: `${alto}px`,
                        background: b.color.fondo,
                        borderLeftColor: b.color.barra,
                      }}
                    >
                      <p className="gy-bloque-curso" style={{ color: b.color.texto }}>{b.curso_nombre}</p>
                      <p className="gy-bloque-hora">{b.hora_inicio}–{b.hora_fin}</p>
                      {b.aula_o_enlace && <p className="gy-bloque-detalle" title={b.aula_o_enlace}>{b.aula_o_enlace}</p>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Celular: lista por dia */}
        <div className="gy-semana-movil">
          {DIAS.filter((d) => bloquesDe(d).length > 0).map((d) => (
            <section key={d} className="gy-dia-movil">
              <p className="gy-micro" style={{ marginBottom: '0.5rem' }}>
                {diaSemana(d)}
                {d === DIA_HOY && <span className="gy-hoy" style={{ marginLeft: '0.4rem' }}>Hoy</span>}
              </p>
              {bloquesDe(d).map((b) => (
                <div
                  key={b.id_horario}
                  className="gy-bloque-movil"
                  style={{ background: b.color.fondo, borderLeftColor: b.color.barra }}
                >
                  <div className="gy-lista-item-principal">
                    <p className="gy-bloque-curso" style={{ color: b.color.texto }}>{b.curso_nombre}</p>
                    <p className="gy-bloque-hora">{b.hora_inicio}–{b.hora_fin}</p>
                    {b.aula_o_enlace && <p className="gy-bloque-detalle">{b.aula_o_enlace}</p>}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      </Tarjeta>
    </div>
  )
}
