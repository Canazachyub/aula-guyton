// Estado vacio de listas y tablas: nunca una tabla en blanco, siempre un
// mensaje claro ("Todavia no hay materiales publicados", etc.).

export default function EstadoVacio({
  titulo = 'Todavía no hay nada por aquí',
  detalle,
  children,
}) {
  return (
    <div className="gy-estado-vacio">
      <div className="gy-estado-vacio-marca" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="gy-estado-vacio-titulo">{titulo}</p>
      {detalle && <p className="gy-estado-vacio-detalle">{detalle}</p>}
      {children}
    </div>
  )
}
