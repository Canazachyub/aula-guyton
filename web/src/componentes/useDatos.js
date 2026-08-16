// Hook compartido de carga de datos para las vistas: estado { datos, cargando,
// error } + recargar(). Toda la data entra por api/cliente.js; este hook solo
// maneja el ciclo de vida de la peticion.
//
// `cargar` se guarda en un ref (siempre se llama la ultima version) y `clave`
// es la dependencia primitiva que dispara recargas (ej. el id seleccionado).
//
// `cacheKey` (opcional) activa el patron "stale-while-revalidate": la ultima
// respuesta con exito se guarda en una cache a nivel de modulo. Al volver a una
// vista ya visitada se pinta al instante lo cacheado (sin spinner) y se revalida
// en segundo plano; al resolver se actualizan estado y cache. Sin `cacheKey` el
// hook se comporta como antes (spinner en cada montaje).

import { useCallback, useEffect, useRef, useState } from 'react'

// Cache compartida entre montajes: cacheKey -> ultimos datos cargados con exito.
const cache = new Map()

// Vacia TODA la cache. Se llama al cerrar sesion para que, al entrar otro
// usuario, no queden datos del anterior.
export function invalidarDatosCache() {
  cache.clear()
}

export function useDatos(cargar, clave, cacheKey) {
  const ref = useRef(cargar)
  ref.current = cargar

  // Estado inicial: si hay algo cacheado para este key, se pinta al instante.
  const [estado, setEstado] = useState(() => {
    if (cacheKey != null && cache.has(cacheKey)) {
      return { datos: cache.get(cacheKey), cargando: false, error: '' }
    }
    return { datos: null, cargando: true, error: '' }
  })
  const [intentos, setIntentos] = useState(0)
  const recargar = useCallback(() => setIntentos((i) => i + 1), [])

  useEffect(() => {
    let activo = true
    const hayCache = cacheKey != null && cache.has(cacheKey)
    // Con cache: se conserva lo mostrado (sin spinner) y se revalida en segundo
    // plano. Sin cache: spinner clasico.
    setEstado((prev) =>
      hayCache
        ? { datos: cache.get(cacheKey), cargando: false, error: '' }
        : { ...prev, cargando: true, error: '' },
    )
    Promise.resolve()
      .then(() => ref.current())
      .then((datos) => {
        if (!activo) return
        if (cacheKey != null) cache.set(cacheKey, datos)
        setEstado({ datos, cargando: false, error: '' })
      })
      .catch(() => {
        if (!activo) return
        setEstado((prev) => {
          // Si ya habia datos (cacheados o previos), la revalidacion falla en
          // silencio y se conserva lo mostrado. Sin datos, se muestra el error.
          if (prev.datos != null) return { ...prev, cargando: false }
          return { datos: null, cargando: false, error: 'No se pudo cargar la información. Inténtalo de nuevo.' }
        })
      })
    return () => {
      activo = false
    }
  }, [intentos, clave, cacheKey])

  return { ...estado, recargar }
}
