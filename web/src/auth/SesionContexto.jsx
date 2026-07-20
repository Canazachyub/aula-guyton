// Contexto de sesion del aula. La persistencia vive en sessionStorage con la
// clave namespaced 'gy_sesion', escrita y leida SOLO por api/cliente.js (asi
// la Fase 2 puede cambiar el mecanismo sin tocar componentes).

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { cerrarSesion, iniciarSesion, obtenerSesion } from '../api/cliente.js'

const SesionContexto = createContext(null)

export function ProveedorSesion({ children }) {
  const [sesion, setSesion] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true
    obtenerSesion().then((guardada) => {
      if (!activo) return
      setSesion(guardada)
      setCargando(false)
    })
    return () => { activo = false }
  }, [])

  const entrar = async (dni, clave) => {
    const resultado = await iniciarSesion(dni, clave)
    if (resultado.ok) setSesion(resultado.usuario)
    return resultado
  }

  const salir = async () => {
    await cerrarSesion()
    setSesion(null)
  }

  const valor = useMemo(
    () => ({ sesion, cargando, entrar, salir }),
    [sesion, cargando],
  )

  return <SesionContexto.Provider value={valor}>{children}</SesionContexto.Provider>
}

export function useSesion() {
  return useContext(SesionContexto)
}
