// Tarjeta base del sistema bento: superficie blanca con borde fino y sombra
// en capas, cabecera opcional con cuadro de icono, titulo, subtitulo y area
// de acciones.

import Icono from './Icono.jsx'

export default function Tarjeta({
  titulo,
  subtitulo,
  icono,
  tonoIcono = 'azul',
  acciones,
  children,
  className = '',
}) {
  return (
    <section className={`gy-tarjeta ${className}`.trim()}>
      {(titulo || acciones) && (
        <header className="gy-tarjeta-cabecera">
          {icono && (
            <span className={`gy-icono gy-icono--${tonoIcono}`}>
              <Icono nombre={icono} tamano={19} />
            </span>
          )}
          <div className="gy-tarjeta-cabecera-texto">
            <h2 className="gy-tarjeta-titulo">{titulo}</h2>
            {subtitulo && <p className="gy-tarjeta-subtitulo">{subtitulo}</p>}
          </div>
          {acciones && <div className="gy-tarjeta-acciones">{acciones}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
