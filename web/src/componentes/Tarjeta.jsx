// Tarjeta base de paneles: superficie blanca, sombra suave, cabecera opcional
// con titulo y area de acciones.

export default function Tarjeta({ titulo, acciones, children, className = '' }) {
  return (
    <section className={`gy-tarjeta ${className}`.trim()}>
      {(titulo || acciones) && (
        <header className="gy-tarjeta-cabecera">
          <h2 className="gy-tarjeta-titulo">{titulo}</h2>
          {acciones && <div className="gy-tarjeta-acciones">{acciones}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
