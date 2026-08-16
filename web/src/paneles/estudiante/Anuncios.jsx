// Anuncios del estudiante: los globales y los de su ciclo, fijados primero.

import { useSesion } from '../../auth/SesionContexto.jsx'
import { obtenerAnuncios } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Insignia from '../../componentes/Insignia.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import { fechaCorta } from '../../componentes/formatos.js'

export default function Anuncios() {
  const { sesion } = useSesion()
  const { datos, cargando, error } = useDatos(
    () => obtenerAnuncios(sesion),
    sesion.id_usuario,
    `est-anuncios:${sesion.id_usuario}`,
  )

  if (cargando) return <Cargando texto="Cargando anuncios…" />
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>
  if (datos.length === 0) {
    return <EstadoVacio titulo="No hay anuncios publicados" detalle="Cuando la academia publique un comunicado, aparecerá aquí." />
  }

  return (
    <div>
      {datos.map((a) => (
        <Tarjeta key={a.id_anuncio}>
          <div className="gy-tarjeta-cabecera">
            <h2 className="gy-tarjeta-titulo">{a.titulo}</h2>
            <div className="gy-acciones-fila">
              {a.fijado === 'si' && <Insignia valor="si" texto="Fijado" />}
              <Insignia valor="no" texto={a.id_ciclo === '' ? 'Global' : `Ciclo ${a.ciclo_nombre}`} />
            </div>
          </div>
          <p>{a.cuerpo}</p>
          <p className="gy-lista-item-detalle" style={{ marginTop: '0.5rem' }}>
            {fechaCorta(a.fecha)} · {a.autor_nombre}
          </p>
        </Tarjeta>
      ))}
    </div>
  )
}
