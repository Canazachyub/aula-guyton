// Banner permanente de honestidad: la app corre con datos de ejemplo y sin
// backend; las escrituras se pierden al recargar (contrato seccion 4 de la
// guia: documentar esto EN LA UI). No se puede ocultar a proposito.

export default function AvisoDemo() {
  return (
    <p className="gy-aviso-demo" role="note">
      <strong>Entorno DEMO:</strong> todos los datos son de ejemplo y todavía no hay backend.
      Los cambios que hagas se pierden al recargar la página.
    </p>
  )
}
