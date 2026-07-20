// Chip de estado con color segun el valor. Cubre los enums del modelo de
// datos; un valor desconocido se muestra en neutro con su texto literal.

const TONOS = {
  // exito
  verificado: 'exito', presente: 'exito', publicado: 'exito', activo: 'exito',
  matriculado: 'exito', dictada: 'exito', en_curso: 'exito', si: 'exito',
  // alerta
  pendiente: 'alerta', borrador: 'alerta', preinscrito: 'alerta',
  programada: 'alerta', planificado: 'alerta', inscripciones_abiertas: 'alerta',
  tardanza: 'alerta',
  // error
  rechazado: 'error', falta: 'error', inactivo: 'error', retirado: 'error',
  cancelada: 'error', oculto: 'error',
  // info / neutro
  justificado: 'info', virtual: 'info', presencial: 'neutro', no: 'neutro',
}

export default function Insignia({ valor, texto }) {
  const tono = TONOS[valor] || 'neutro'
  const etiqueta = texto ?? String(valor ?? '').replaceAll('_', ' ')
  return <span className={`gy-insignia gy-insignia--${tono}`}>{etiqueta}</span>
}
