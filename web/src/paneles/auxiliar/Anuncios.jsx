// Anuncios del auxiliar: publica anuncios POR CICLO (los globales son solo
// del superadmin; la capa de datos lo rechaza si lo intenta) y ve el listado.

import { useSesion } from '../../auth/SesionContexto.jsx'
import { obtenerAnuncios, obtenerCiclosDelUsuario, publicarAnuncio } from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Insignia from '../../componentes/Insignia.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import FormularioAnuncio from '../../componentes/FormularioAnuncio.jsx'
import { fechaCorta } from '../../componentes/formatos.js'

export default function Anuncios() {
  const { sesion } = useSesion()
  const anuncios = useDatos(() => obtenerAnuncios(sesion), sesion.id_usuario)
  const ciclos = useDatos(() => obtenerCiclosDelUsuario(sesion), sesion.id_usuario)

  if (anuncios.cargando || ciclos.cargando) return <Cargando texto="Cargando anuncios…" />
  if (anuncios.error) return <p className="gy-alerta gy-alerta--error">{anuncios.error}</p>
  if (ciclos.error) return <p className="gy-alerta gy-alerta--error">{ciclos.error}</p>

  return (
    <div>
      <Tarjeta titulo="Publicar anuncio de un ciclo">
        <FormularioAnuncio
          ciclos={ciclos.datos}
          permiteGlobal={false}
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
                  <p className="gy-lista-item-detalle">
                    {a.cuerpo}
                  </p>
                  <p className="gy-lista-item-detalle">
                    {fechaCorta(a.fecha)} · {a.autor_nombre}
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
