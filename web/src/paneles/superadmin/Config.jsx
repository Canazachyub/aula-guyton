// Config (superadmin): las variables globales del sistema, en solo lectura
// por ahora. La edicion se habilitara con el backend real — la capa de datos
// actual no tiene escritura de config (decision documentada en la bitacora).

import { useSesion } from '../../auth/SesionContexto.jsx'
import { obtenerConfig } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Tabla from '../../componentes/Tabla.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'

export default function Config() {
  const { sesion } = useSesion()
  const { datos, cargando, error } = useDatos(() => obtenerConfig(sesion), sesion.id_usuario, `sa-config:${sesion.id_usuario}`)

  if (cargando) return <Cargando texto="Cargando la configuración…" />
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>

  const columnas = [
    { clave: 'clave', titulo: 'Variable' },
    { clave: 'valor', titulo: 'Valor', render: (c) => c.valor || '— (vacío)' },
    { clave: 'descripcion', titulo: 'Para qué se usa' },
  ]

  return (
    <Tarjeta titulo="Configuración global">
      <Tabla
        columnas={columnas}
        filas={datos}
        llaveFila={(c) => c.clave}
        vacio={<EstadoVacio titulo="No hay variables de configuración" />}
      />
      <p className="gy-ayuda-campo" style={{ marginTop: '0.75rem' }}>
        Vista de solo lectura. drive_root_id seguirá vacío hasta que la academia comparta
        su carpeta de Drive (Fase 1 del plan maestro).
      </p>
    </Tarjeta>
  )
}
