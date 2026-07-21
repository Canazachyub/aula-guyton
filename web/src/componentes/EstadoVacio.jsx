// Estado vacio de listas y tablas: nunca una tabla en blanco, siempre un
// mensaje claro. El arte es geometrico de marca (circulo naranja, cuadrados
// azules): el ave del isotipo no se inventa hasta que el usuario la confirme.

export default function EstadoVacio({
  titulo = 'Todavía no hay nada por aquí',
  detalle,
  children,
}) {
  return (
    <div className="gy-estado-vacio">
      <svg
        className="gy-estado-vacio-arte"
        viewBox="0 0 76 56"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="4" y="16" width="26" height="26" rx="8" fill="#E3ECFF" />
        <rect x="14" y="6" width="26" height="26" rx="8" fill="#BFDBFE" opacity="0.6" />
        <circle cx="56" cy="20" r="11" stroke="#FF4A18" strokeWidth="4" />
        <path d="M42 44h26" stroke="#0829B8" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
        <path d="M8 48h20" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <p className="gy-estado-vacio-titulo">{titulo}</p>
      {detalle && <p className="gy-estado-vacio-detalle">{detalle}</p>}
      {children}
    </div>
  )
}
