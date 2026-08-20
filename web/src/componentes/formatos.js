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

/** Metadatos de presentacion por tipo de material: icono y tono del tile. */
export const META_TIPO_MATERIAL = {
  video_grabado: { icono: 'video', tono: 'acento' },
  pdf_teoria: { icono: 'documento', tono: 'azul' },
  pdf_practica: { icono: 'documento', tono: 'alerta' },
  pdf_resolucion: { icono: 'lista', tono: 'exito' },
  enlace: { icono: 'enlace', tono: 'azul' },
}

/** 'yape' -> 'Yape', 'transferencia' -> 'Transferencia' */
export function medioPago(medio) {
  const nombres = { yape: 'Yape', plin: 'Plin', efectivo: 'Efectivo', transferencia: 'Transferencia' }
  return nombres[medio] ?? medio
}

/** Extrae el id (11 caracteres) de un enlace de YouTube: youtube.com/watch?v=…,
 *  youtu.be/…, /embed/… o /shorts/…. Devuelve '' si el enlace no es de YouTube;
 *  así la vista de materiales puede decidir entre reproductor embebido y enlace
 *  normal sin cambiar ningún dato del mock. */
export function idYouTube(url) {
  const texto = String(url ?? '').trim()
  if (!texto) return ''
  const patrones = [
    /[?&]v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/(?:embed|shorts)\/([\w-]{11})/,
  ]
  for (const patron of patrones) {
    const coincidencia = patron.exec(texto)
    if (coincidencia) return coincidencia[1]
  }
  return ''
}

// Slug estable de un nombre de curso -> nombre de archivo de su imagen de
// portada en public/cursos/<slug>.png (sin tildes, minúsculas, con guiones).
// Ej.: "Biología y Anatomía" -> "biologia-y-anatomia".
export function slugCurso(nombre) {
  return String(nombre ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Convierte un enlace de PDF a una URL embebible dentro de un <iframe>. Para
// Google Drive usa /preview (se ve el PDF sin descargar ni salir de la web);
// para otros enlaces asume PDF directo y lo devuelve tal cual. '' si no hay url.
export function urlPdfEmbebido(url) {
  const u = String(url ?? '').trim()
  if (!u) return ''
  const m = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/) || u.match(/[?&]id=([\w-]+)/)
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`
  return u
}
