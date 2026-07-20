// Hook compartido de carga de datos para las vistas: estado { datos, cargando,
// error } + recargar(). Toda la data entra por api/cliente.js; este hook solo
// maneja el ciclo de vida de la peticion.
//
// `cargar` se guarda en un ref (siempre se llama la ultima version) y `clave`
// es la dependencia primitiva que dispara recargas (ej. el id seleccionado).

import { useCallback, useEffect, useRef, useState } from 'react'

export function useDatos(cargar, clave) {
  const ref = useRef(cargar)
  ref.current = cargar

  const [estado, setEstado] = useState({ datos: null, cargando: true, error: '' })
  const [intentos, setIntentos] = useState(0)
  const recargar = useCallback(() => setIntentos((i) => i + 1), [])

  useEffect(() => {
    let activo = true
    setEstado((prev) => ({ ...prev, cargando: true, error: '' }))
    Promise.resolve()
      .then(() => ref.current())
      .then((datos) => {
        if (activo) setEstado({ datos, cargando: false, error: '' })
      })
      .catch(() => {
        if (activo) {
          setEstado({ datos: null, cargando: false, error: 'No se pudo cargar la información. Inténtalo de nuevo.' })
        }
      })
    return () => {
      activo = false
    }
  }, [intentos, clave])

  return { ...estado, recargar }
}
