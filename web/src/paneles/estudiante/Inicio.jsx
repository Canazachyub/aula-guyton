// Inicio del estudiante: saludo, su ciclo y matricula, proximas clases y el
// anuncio fijado. Sin matricula activa (caso Maria, retirada) se muestra el
// estado vacio en vez del contenido del ciclo.

import { useSesion } from '../../auth/SesionContexto.jsx'
import {
  obtenerAnuncios,
  obtenerCiclosDelUsuario,
  obtenerClases,
  obtenerCursosDelUsuario,
} from '../../api/cliente.js'
import { useDatos } from '../../componentes/useDatos.js'
import Tarjeta from '../../componentes/Tarjeta.jsx'
import Insignia from '../../componentes/Insignia.jsx'
import Cargando from '../../componentes/Cargando.jsx'
import EstadoVacio from '../../componentes/EstadoVacio.jsx'
import { fechaCorta } from '../../componentes/formatos.js'

export default function Inicio() {
  const { sesion } = useSesion()
  const { datos, cargando, error } = useDatos(async () => {
    const [ciclos, anuncios, cursos] = await Promise.all([
      obtenerCiclosDelUsuario(sesion),
      obtenerAnuncios(sesion),
      obtenerCursosDelUsuario(sesion),
    ])
    const clasesPorCurso = await Promise.all(
      cursos.map((c) => obtenerClases(sesion, c.id_ciclo_curso)),
    )
    const hoy = new Date().toISOString().slice(0, 10)
    const proximas = clasesPorCurso
      .flatMap((clases, i) =>
        clases.map((cl) => ({ ...cl, curso_nombre: cursos[i].curso_nombre })),
      )
      .filter((cl) => cl.estado === 'programada' && cl.fecha >= hoy)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(0, 3)
    return { ciclos, anuncios, proximas }
  }, sesion.id_usuario)

  if (cargando) return <Cargando texto="Cargando tu inicio…" />
  if (error) return <p className="gy-alerta gy-alerta--error">{error}</p>

  const { ciclos, anuncios, proximas } = datos
  const ciclo = ciclos[0]
  const fijado = anuncios.find((a) => a.fijado === 'si')

  return (
    <div>
      <h2 className="gy-saludo">Hola, {sesion.nombres}</h2>

      {!ciclo && (
        <Tarjeta>
          <EstadoVacio
            titulo="No tienes una matrícula activa"
            detalle="Cuando la academia confirme tu matrícula en un ciclo, aquí verás tus cursos, tu horario y tus pagos."
          />
        </Tarjeta>
      )}

      {ciclo && (
        <div className="gy-grilla gy-grilla--2">
          <Tarjeta titulo={`Mi ciclo: ${ciclo.nombre}`}>
            <ul className="gy-lista">
              <li className="gy-lista-item">
                <span className="gy-lista-item-detalle">Estado del ciclo</span>
                <Insignia valor={ciclo.estado} />
              </li>
              <li className="gy-lista-item">
                <span className="gy-lista-item-detalle">Duración</span>
                <span>{fechaCorta(ciclo.fecha_inicio)} — {fechaCorta(ciclo.fecha_fin)}</span>
              </li>
              {ciclo.matricula && (
                <>
                  <li className="gy-lista-item">
                    <span className="gy-lista-item-detalle">Mi matrícula</span>
                    <Insignia valor={ciclo.matricula.estado} />
                  </li>
                  <li className="gy-lista-item">
                    <span className="gy-lista-item-detalle">Turno</span>
                    <span style={{ textTransform: 'capitalize' }}>{ciclo.matricula.turno || '—'}</span>
                  </li>
                </>
              )}
            </ul>
          </Tarjeta>

          <Tarjeta titulo="Mi perfil">
            <ul className="gy-lista">
              <li className="gy-lista-item">
                <span className="gy-lista-item-detalle">DNI</span>
                <span>{sesion.dni}</span>
              </li>
              <li className="gy-lista-item">
                <span className="gy-lista-item-detalle">Celular</span>
                <span>{sesion.celular || '—'}</span>
              </li>
              <li className="gy-lista-item">
                <span className="gy-lista-item-detalle">Correo</span>
                <span>{sesion.email || '—'}</span>
              </li>
            </ul>
            <p className="gy-ayuda-campo">
              Si algún dato está mal, pide la corrección a la academia. El perfil es de solo lectura.
            </p>
          </Tarjeta>
        </div>
      )}

      {ciclo && (
        <Tarjeta titulo="Próximas clases">
          {proximas.length === 0 ? (
            <EstadoVacio titulo="No hay clases programadas por ahora" />
          ) : (
            <ul className="gy-lista">
              {proximas.map((cl) => (
                <li key={cl.id_clase} className="gy-lista-item">
                  <div className="gy-lista-item-principal">
                    <p className="gy-lista-item-titulo">{cl.curso_nombre}: {cl.tema}</p>
                    <p className="gy-lista-item-detalle">
                      {fechaCorta(cl.fecha)} · {cl.hora_inicio}–{cl.hora_fin} · {cl.modalidad}
                    </p>
                  </div>
                  {cl.modalidad === 'virtual' && cl.enlace_en_vivo && (
                    <a href={cl.enlace_en_vivo} target="_blank" rel="noopener noreferrer">
                      Entrar
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      )}

      {fijado && (
        <Tarjeta titulo="Anuncio fijado">
          <p className="gy-lista-item-titulo">{fijado.titulo}</p>
          <p>{fijado.cuerpo}</p>
          <p className="gy-lista-item-detalle">
            {fechaCorta(fijado.fecha)} · {fijado.autor_nombre}
          </p>
        </Tarjeta>
      )}
    </div>
  )
}
