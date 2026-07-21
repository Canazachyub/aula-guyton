// Banner permanente de honestidad: la app corre con datos de ejemplo y sin
// backend; las escrituras se pierden al recargar (contrato seccion 4 de la
// guia: documentar esto EN LA UI). No se puede ocultar a proposito.

import Icono from './Icono.jsx'

export default function AvisoDemo() {
  return (
    <p className="gy-aviso-demo" role="note">
      <span className="gy-aviso-demo-icono">
        <Icono nombre="info" tamano={14} />
      </span>
      <span>
        <strong>Entorno DEMO:</strong> todos los datos son de ejemplo y todavía no hay backend.
        Los cambios que hagas se pierden al recargar la página.
      </span>
    </p>
  )
}
