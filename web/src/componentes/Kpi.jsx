// Tarjeta de metrica (KPI) del sistema bento: cuadro de icono + numero grande
// + rotulo (+ pie opcional). Una sola familia de colores de marca; el naranja
// solo como acento.

import Icono from './Icono.jsx'

export default function Kpi({ valor, rotulo, icono, tono = 'azul', pie }) {
  return (
    <div className="gy-kpi">
      <span className={`gy-icono gy-icono--${tono}`}>
        <Icono nombre={icono} tamano={19} />
      </span>
      <p className="gy-kpi-valor">{valor}</p>
      <p className="gy-kpi-rotulo">{rotulo}</p>
      {pie && <p className="gy-kpi-pie">{pie}</p>}
    </div>
  )
}
