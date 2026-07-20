// Formatos de presentacion compartidos. Las fechas del modelo son strings
// 'YYYY-MM-DD' y las horas 'HH:MM'; aqui se formatean sin pasar por Date
// para evitar desfases de zona horaria.

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const DIAS = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
}

/** '2026-07-13' -> '13 jul 2026' */
export function fechaCorta(iso) {
  if (!iso) return '—'
  const [anio, mes, dia] = String(iso).split('-').map(Number)
  if (!anio || !mes || !dia) return String(iso)
  return `${dia} ${MESES[mes - 1]} ${anio}`
}

/** 250 -> 'S/ 250.00' */
export function soles(monto) {
  const numero = Number(monto)
  return `S/ ${Number.isFinite(numero) ? numero.toFixed(2) : '0.00'}`
}

/** 'miercoles' -> 'Miércoles' (el mock no lleva tilde; la UI sí) */
export function diaSemana(dia) {
  return DIAS[dia] ?? dia
}

/** 'mensualidad_1' -> 'Mensualidad 1'; 'matricula' -> 'Matrícula' */
export function conceptoPago(concepto) {
  if (concepto === 'matricula') return 'Matrícula'
  const coincidencia = /^mensualidad_(\d+)$/.exec(concepto ?? '')
  return coincidencia ? `Mensualidad ${coincidencia[1]}` : String(concepto ?? '')
}

/** 'pdf_practica' -> 'Práctica PDF', etc. */
export function tipoMaterial(tipo) {
  const nombres = {
    video_grabado: 'Video grabado',
    pdf_teoria: 'Teoría PDF',
    pdf_practica: 'Práctica PDF',
    pdf_resolucion: 'Resolución PDF',
    enlace: 'Enlace',
  }
  return nombres[tipo] ?? tipo
}

/** 'yape' -> 'Yape', 'transferencia' -> 'Transferencia' */
export function medioPago(medio) {
  const nombres = { yape: 'Yape', plin: 'Plin', efectivo: 'Efectivo', transferencia: 'Transferencia' }
  return nombres[medio] ?? medio
}
