// Placeholder del isotipo: un bloque con el gradiente de marca y la "G".
// El logo real (ave naranja + "G") no existe como archivo todavia y NO se
// sabe que ave es — no se dibuja un ave inventada (regla de honestidad,
// docs/IDENTIDAD_VISUAL.md). El title lo declara provisional en pantalla.

export default function Isotipo({ tamano = 48 }) {
  return (
    <div
      className="gy-isotipo"
      style={{ width: tamano, height: tamano, fontSize: Math.round(tamano * 0.44) }}
      title="Isotipo provisional - el logo real está pendiente"
      role="img"
      aria-label="Isotipo provisional de la Academia Guyton (el logo real está pendiente)"
    >
      G
    </div>
  )
}
