// Visualizadores gráficos (estilo "micro charts") en la paleta Guyton, hechos
// con SVG/CSS puro — sin librerías externas (la CSP del hosting bloquea CDNs).
// Se alimentan de datos REALES del alumno (banqueo, simulacros).

const clamp = (n) => Math.max(0, Math.min(100, Number(n) || 0))

// --- Gauge (arco tipo velocímetro, semicírculo) -----------------------------
export function Gauge({ valor = 0, etiqueta = '', sufijo = '%' }) {
  const v = clamp(valor)
  const R = 80, CX = 100, CY = 100
  const largo = Math.PI * R
  const dash = (v / 100) * largo
  const d = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`
  return (
    <div className="gy-grafico">
      <svg viewBox="0 0 200 116" className="gy-grafico-svg" role="img" aria-label={`${etiqueta}: ${Math.round(v)}${sufijo}`}>
        <path d={d} className="gy-gauge-fondo" />
        <path d={d} className="gy-gauge-valor" style={{ strokeDasharray: `${dash} ${largo}` }} />
        <text x={CX} y={CY - 6} textAnchor="middle" className="gy-gauge-num">{Math.round(v)}{sufijo}</text>
      </svg>
      {etiqueta && <p className="gy-grafico-pie">{etiqueta}</p>}
    </div>
  )
}

// --- Radar / red poligonal (dominio multi-eje) ------------------------------
export function Radar({ ejes = [], niveles = 4 }) {
  const N = ejes.length
  if (N < 3) return null
  const CX = 130, CY = 125, R = 92
  const punto = (ang, r) => {
    const a = (ang * Math.PI) / 180
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)]
  }
  const angDe = (i) => -90 + (i * 360) / N

  const grid = []
  for (let k = 1; k <= niveles; k++) {
    const rr = (R * k) / niveles
    grid.push(
      <polygon key={k} className="gy-radar-grid" points={ejes.map((_, i) => punto(angDe(i), rr).join(',')).join(' ')} />,
    )
  }
  const radios = ejes.map((_, i) => {
    const [x, y] = punto(angDe(i), R)
    return <line key={i} className="gy-radar-radio" x1={CX} y1={CY} x2={x} y2={y} />
  })
  const dataPts = ejes.map((e, i) => punto(angDe(i), (R * clamp(e.valor)) / 100).join(',')).join(' ')
  const vertices = ejes.map((e, i) => {
    const [x, y] = punto(angDe(i), (R * clamp(e.valor)) / 100)
    return <circle key={i} className="gy-radar-vertice" cx={x} cy={y} r={3} />
  })
  const etiquetas = ejes.map((e, i) => {
    const ang = angDe(i)
    const [x, y] = punto(ang, R + 15)
    const cos = Math.cos((ang * Math.PI) / 180)
    const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle'
    return (
      <text key={i} className="gy-radar-label" x={x} y={y + 3} textAnchor={anchor}>
        {e.label}
      </text>
    )
  })

  return (
    <div className="gy-grafico">
      <svg viewBox="0 0 260 250" className="gy-grafico-svg" role="img" aria-label="Radar de dominio por curso">
        {grid}
        {radios}
        <polygon className="gy-radar-area" points={dataPts} />
        {vertices}
        {etiquetas}
      </svg>
    </div>
  )
}

// --- Bullet (barra con marcador de meta) ------------------------------------
export function Bullet({ items = [], meta = 70 }) {
  return (
    <div className="gy-bullet-lista">
      {items.map((it) => (
        <div key={it.label} className="gy-bullet-fila">
          <div className="gy-bullet-cab">
            <span className="gy-bullet-label">{it.label}</span>
            <span className="gy-bullet-valor">{Math.round(clamp(it.valor))}%</span>
          </div>
          <div className="gy-bullet-track" title={`Meta ${it.meta ?? meta}%`}>
            <div className="gy-bullet-relleno" style={{ width: `${clamp(it.valor)}%` }} />
            <div className="gy-bullet-meta" style={{ left: `${clamp(it.meta ?? meta)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Barras verticales (actividad por curso) --------------------------------
export function Barras({ datos = [], sufijo = '' }) {
  const max = Math.max(1, ...datos.map((d) => Number(d.valor) || 0))
  return (
    <div className="gy-barras">
      {datos.map((d) => (
        <div key={d.label} className="gy-barra-col" title={`${d.label}: ${d.valor}${sufijo}`}>
          <div className="gy-barra-riel">
            <div className="gy-barra-relleno" style={{ height: `${((Number(d.valor) || 0) / max) * 100}%` }} />
          </div>
          <span className="gy-barra-valor">{d.valor}{sufijo}</span>
          <span className="gy-barra-label">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
