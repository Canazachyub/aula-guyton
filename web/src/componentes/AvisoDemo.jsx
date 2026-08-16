// Banner de honestidad del modo demostracion. SOLO se muestra cuando la app
// corre con datos de ejemplo en memoria (sin VITE_API_URL). En produccion, con
// el backend real conectado, devuelve null: no debe verse ningun aviso "DEMO".

import Icono from './Icono.jsx'
import { MODO_DEMO } from '../api/cliente.js'

export default function AvisoDemo() {
  if (!MODO_DEMO) return null

  return (
    <p className="gy-aviso-demo" role="note">
      <span className="gy-aviso-demo-icono">
        <Icono nombre="info" tamano={14} />
      </span>
      <span>
        <strong>Modo demostración:</strong> datos de ejemplo; los cambios no se guardan.
      </span>
    </p>
  )
}
