// Mi progreso (estudiante): panel de análisis con visualizadores gráficos
// (gauge de preparación, radar de dominio por curso, bullets vs meta, barras de
// actividad) alimentados con datos REALES del banqueo y los simulacros.

import { useSesion } from '../../auth/SesionContexto.jsx'
import {
  obtenerBanqueoProgreso,
  obtenerBanqueoRanking,
  obtenerSimulacros,
} from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Kpi from '../../componentes/Kpi.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import { Gauge, Radar, Bullet, Barras } from '../../componentes/graficos.jsx'

const META_DOMINIO = 70 // meta de dominio por curso (%)

// Acorta nombres largos de curso para que quepan en los ejes del radar.
function cortar(nombre, n = 12) {
  const s = String(nombre)
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

export default function Progreso() {
  const { sesion } = useSesion()
  const { datos, cargando, error } = useDatos(async () => {
    // El progreso del banqueo ya existe hoy; ranking y simulacros son extras
    // (acciones nuevas del backend): si aún no se redesplegó, degradan a vacío.
    const [progreso, ranking, simulacros] = await Promise.all([
      obtenerBanqueoProgreso(sesion).catch(() => []),
      obtenerBanqueoRanking(sesion).catch(() => ({ yo: null, total: 0 })),
      obtenerSimulacros(sesion).catch(() => ({ mis: [], yo: null, total: 0 })),
    ])
    return { progreso, ranking, simulacros }
  }, sesion.id_usuario, `est-progreso:${sesion.id_usuario}`)

  if (cargando) return <Cargando texto="Analizando tu progreso…" />
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>

  const progreso = (datos.progreso ?? []).filter((p) => p.respondidas > 0)
  const ranking = datos.ranking ?? {}
  const simulacros = datos.simulacros ?? {}
  const misSimulacros = simulacros.mis ?? []

  if (progreso.length === 0 && misSimulacros.length === 0) {
    return (
      <EstadoVacio
        titulo="Aún no hay nada que analizar"
        detalle="Practica en el Banqueo o rinde un Simulacro y aquí verás tu radar de dominio, tu nivel de preparación y cómo vas frente a la competencia."
      />
    )
  }

  const totalResp = progreso.reduce((s, p) => s + p.respondidas, 0)
  const totalCorr = progreso.reduce((s, p) => s + p.correctas, 0)
  const dominioGeneral = totalResp > 0 ? Math.round((totalCorr / totalResp) * 100) : 0

  // Cursos ordenados por práctica (más practicados primero).
  const porPractica = [...progreso].sort((a, b) => b.respondidas - a.respondidas)
  const ejesRadar = porPractica.slice(0, 8).map((p) => ({ label: cortar(p.curso), valor: p.porcentaje }))
  const bullets = porPractica.slice(0, 6).map((p) => ({ label: p.curso, valor: p.porcentaje, meta: META_DOMINIO }))
  const barras = porPractica.slice(0, 8).map((p) => ({ label: cortar(p.curso, 8), valor: p.respondidas }))

  const ultimoSim = misSimulacros[0] // vienen ordenados por fecha desc
  const puestoBanqueo = ranking.yo?.puesto ?? null
  const puestoSim = simulacros.yo?.puesto ?? null

  return (
    <div className="gy-bento">
      {/* KPIs de cabecera */}
      <div className="gy-bs-3">
        <Kpi valor={`${dominioGeneral}%`} rotulo="Dominio general" icono="repasos" tono="acento" />
      </div>
      <div className="gy-bs-3">
        <Kpi valor={totalResp} rotulo="Preguntas practicadas" icono="lista" />
      </div>
      <div className="gy-bs-3">
        <Kpi valor={puestoBanqueo ? `#${puestoBanqueo}` : '—'} rotulo="Puesto banqueo" icono="usuarios" tono="exito" />
      </div>
      <div className="gy-bs-3">
        <Kpi valor={ultimoSim ? `${ultimoSim.porcentaje}%` : '—'} rotulo="Último simulacro" icono="documento" tono="acento" />
      </div>

      {/* Gauge de preparación */}
      <div className="gy-bs-4">
        <Tarjeta titulo="Nivel de preparación" icono="repasos" subtitulo="Según tu dominio en el banqueo">
          <Gauge valor={dominioGeneral} etiqueta={dominioGeneral >= META_DOMINIO ? '¡Vas muy bien!' : 'Sigue practicando para llegar al 70%'} />
        </Tarjeta>
      </div>

      {/* Radar de dominio por curso */}
      <div className="gy-bs-8">
        <Tarjeta titulo="Radar de dominio por curso" icono="ciclos" subtitulo="Tu % de acierto en cada curso practicado">
          {ejesRadar.length >= 3 ? (
            <Radar ejes={ejesRadar} />
          ) : (
            <Barras datos={porPractica.map((p) => ({ label: cortar(p.curso, 8), valor: p.porcentaje }))} sufijo="%" />
          )}
        </Tarjeta>
      </div>

      {/* Bullets: dominio por curso vs meta */}
      <div className="gy-bs-6">
        <Tarjeta titulo={`Dominio por curso vs meta (${META_DOMINIO}%)`} icono="lista">
          <Bullet items={bullets} meta={META_DOMINIO} />
        </Tarjeta>
      </div>

      {/* Barras de actividad */}
      <div className="gy-bs-6">
        <Tarjeta titulo="Actividad: preguntas por curso" icono="calendario">
          <Barras datos={barras} />
        </Tarjeta>
      </div>

      {/* Historial de simulacros */}
      {misSimulacros.length > 0 && (
        <div className="gy-bs-12">
          <Tarjeta titulo="Mis simulacros" icono="documento" subtitulo={puestoSim ? `Vas #${puestoSim} de ${simulacros.total} en el ranking` : undefined}>
            <Barras datos={misSimulacros.slice(0, 10).reverse().map((s, i) => ({ label: s.fecha?.slice(5) || `#${i + 1}`, valor: s.porcentaje }))} sufijo="%" />
          </Tarjeta>
        </div>
      )}
    </div>
  )
}
