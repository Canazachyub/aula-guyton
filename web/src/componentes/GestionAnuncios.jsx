// Gestion de anuncios compartida por auxiliar y superadmin. El auxiliar solo
// publica por ciclo (permiteGlobal=false); el superadmin tambien globales.
// La capa de datos refuerza esa restriccion aunque la UI la aplique.

import { useSesion } from '../auth/SesionContexto.jsx'
import { obtenerAnuncios, obtenerCiclosDelUsuario, publicarAnuncio } from '../api/cliente.js'
import { useDatos } from './useDatos.js'
import Tarjeta from './Tarjeta.jsx'
import Insignia from './Insignia.jsx'
import Cargando from './Cargando.jsx'
import EstadoVacio from './EstadoVacio.jsx'
import FormularioAnuncio from './FormularioAnuncio.jsx'
import { fechaCorta } from './formatos.js'

export default function GestionAnuncios({ permiteGlobal = false }) {
  const { sesion } = useSesion()
  const anuncios = useDatos(() => obtenerAnuncios(sesion), sesion.id_usuario, `gestion-anuncios:anuncios:${sesion.id_usuario}`)
  const ciclos = useDatos(() => obtenerCiclosDelUsuario(sesion), sesion.id_usuario, `gestion-anuncios:ciclos:${sesion.id_usuario}`)

  if (anuncios.cargando || ciclos.cargando) return <Cargando texto="Cargando anuncios…" />
  if (anuncios.error) return <p className="gy-alerta gy-alerta--error">{anuncios.error}</p>
  if (ciclos.error) return <p className="gy-alerta gy-alerta--error">{ciclos.error}</p>

  return (
    <div>
      <Tarjeta titulo={permiteGlobal ? 'Publicar anuncio (global o por ciclo)' : 'Publicar anuncio de un ciclo'}>
        <FormularioAnuncio
          ciclos={ciclos.datos}
          permiteGlobal={permiteGlobal}
          onGuardar={async (datos) => {
            const resultado = await publicarAnuncio(sesion, datos)
            if (resultado.ok) anuncios.recargar()
            return resultado
          }}
        />
      </Tarjeta>

      <Tarjeta titulo="Anuncios publicados">
        {anuncios.datos.length === 0 ? (
          <EstadoVacio titulo="No hay anuncios publicados" />
        ) : (
          <ul className="gy-lista">
            {anuncios.datos.map((a) => (
              <li key={a.id_anuncio} className="gy-lista-item">
                <div className="gy-lista-item-principal">
                  <p className="gy-lista-item-titulo">{a.titulo}</p>
                  <p className="gy-lista-item-detalle">{a.cuerpo}</p>
                  <p className="gy-lista-item-detalle">
                    {fechaCorta(a.fecha)} · {a.autor_nombre}
                    {a.estado !== 'publicado' && ` · ${a.estado}`}
                  </p>
                </div>
                <div className="gy-acciones-fila">
                  {a.fijado === 'si' && <Insignia valor="si" texto="Fijado" />}
                  <Insignia valor="no" texto={a.id_ciclo === '' ? 'Global' : `Ciclo ${a.ciclo_nombre}`} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  )
}
