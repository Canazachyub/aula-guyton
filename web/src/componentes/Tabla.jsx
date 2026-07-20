// Tabla generica con scroll horizontal en pantallas chicas (obligatorio:
// muchos alumnos entran desde el celular) y estado vacio integrado.
//
// columnas: [{ clave, titulo, render?(fila) }]
// filas: array de objetos. `llaveFila` define la key de React (por defecto, indice).

import EstadoVacio from './EstadoVacio.jsx'

export default function Tabla({ columnas, filas, llaveFila, vacio }) {
  if (!filas || filas.length === 0) {
    return vacio ?? <EstadoVacio />
  }
  const keyDe = (fila, indice) => (llaveFila ? llaveFila(fila) : indice)
  return (
    <div className="gy-tabla-envoltura">
      <table className="gy-tabla">
        <thead>
          <tr>
            {columnas.map((c) => (
              <th key={c.clave}>{c.titulo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, indice) => (
            <tr key={keyDe(fila, indice)}>
              {columnas.map((c) => (
                <td key={c.clave} data-etiqueta={c.titulo}>
                  {c.render ? c.render(fila) : fila[c.clave]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
