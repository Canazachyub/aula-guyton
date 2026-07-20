// Indicador de carga de las vistas (el retardo de 300 ms de la capa de datos
// hace que este estado sea real, no decorativo).

export default function Cargando({ texto = 'Cargando…' }) {
  return (
    <p className="gy-cargando" role="status">
      <span className="gy-cargando-punto" aria-hidden="true" />
      {texto}
    </p>
  )
}
