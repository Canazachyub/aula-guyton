// ==========================================================================
// Mock DEMO — espejo EXACTO de las filas de ejemplo de BASE_DATOS_GUYTON.xlsx.
// Fuente de verdad: docs/generar_excel.py (listas SHEETS). Copiado de ahi tal
// cual, sin "mejorar" textos ni agregar tildes: el Excel real no las tiene.
// Nombres de campo = headers del modelo de datos (docs/MODELO_DATOS.md), en
// snake_case literal. Los ids DEMO llevan el patron "-demo-N".
//
// Ningun componente importa este archivo: solo lo lee api/cliente.js.
// Las escrituras lo mutan EN MEMORIA (se pierden al recargar la pagina).
// ==========================================================================

export const db = {
  // 1. config ---------------------------------------------------------------
  config: [
    { clave: 'nombre_academia', valor: 'Academia Preuniversitaria Guyton',
      descripcion: 'Nombre completo de la academia' },
    { clave: 'whatsapp', valor: '+51 986 833 308',
      descripcion: 'Numero de WhatsApp de contacto de la academia' },
    { clave: 'drive_root_id', valor: '',
      descripcion: 'ID de la carpeta raiz de Google Drive (vacio hasta que el usuario la comparta)' },
    { clave: 'color_primario', valor: '#0829B8', descripcion: 'Azul real - color primario de marca' },
    { clave: 'color_acento', valor: '#FF4A18', descripcion: 'Naranja Guyton - color de acento' },
    { clave: 'lema', valor: 'Asegura tu ingreso', descripcion: 'Lema de la academia' },
  ],

  // 2. usuarios ---------------------------------------------------------------
  usuarios: [
    { id_usuario: 'usr-demo-1', dni: '70000001', nombres: 'Ana', apellidos: 'Quispe Mamani',
      celular: '986111001', email: 'ana.admin@guyton.demo', rol: 'superadmin',
      clave_acceso: '1111', foto_url: '', estado: 'activo', fecha_registro: '2026-06-15' },
    { id_usuario: 'usr-demo-2', dni: '70000002', nombres: 'Carlos', apellidos: 'Huanca Ticona',
      celular: '986111002', email: 'carlos.docente@guyton.demo', rol: 'docente',
      clave_acceso: '2222', foto_url: '', estado: 'activo', fecha_registro: '2026-06-15' },
    { id_usuario: 'usr-demo-3', dni: '70000003', nombres: 'Rosa', apellidos: 'Flores Apaza',
      celular: '986111003', email: 'rosa.auxiliar@guyton.demo', rol: 'auxiliar',
      clave_acceso: '3333', foto_url: '', estado: 'activo', fecha_registro: '2026-06-15' },
    { id_usuario: 'usr-demo-4', dni: '70000004', nombres: 'Luis', apellidos: 'Condori Yucra',
      celular: '986111004', email: 'luis.estudiante@guyton.demo', rol: 'estudiante',
      clave_acceso: '4444', foto_url: '', estado: 'activo', fecha_registro: '2026-06-20' },
    { id_usuario: 'usr-demo-5', dni: '70000005', nombres: 'Maria', apellidos: 'Chura Pacco',
      celular: '986111005', email: 'maria.estudiante@guyton.demo', rol: 'estudiante',
      clave_acceso: '5555', foto_url: '', estado: 'activo', fecha_registro: '2026-06-25' },
  ],

  // 3. ciclos ---------------------------------------------------------------
  ciclos: [
    { id_ciclo: 'cic-demo-1', nombre: '2026-II', anio: 2026, fecha_inicio: '2026-07-06',
      fecha_fin: '2026-12-19', estado: 'en_curso', precio_matricula: 100.00,
      precio_mensualidad: 250.00, n_mensualidades: 5, descripcion: 'Ciclo semestral 2026-II - DEMO' },
    { id_ciclo: 'cic-demo-2', nombre: '2027-I', anio: 2027, fecha_inicio: '2027-01-12',
      fecha_fin: '2027-06-18', estado: 'planificado', precio_matricula: 100.00,
      precio_mensualidad: 250.00, n_mensualidades: 5,
      descripcion: 'Ciclo planificado 2027-I - DEMO (cursos aun sin docente asignado)' },
  ],

  // 4. cursos ---------------------------------------------------------------
  cursos: [
    { id_curso: 'cur-demo-1', nombre: 'Matematica',
      descripcion: 'Algebra, aritmetica y geometria para el examen de admision - DEMO', orden: 1 },
    { id_curso: 'cur-demo-2', nombre: 'Comunicacion',
      descripcion: 'Comprension lectora y redaccion - DEMO', orden: 2 },
  ],

  // 5. ciclo_cursos (tabla puente) ------------------------------------------
  ciclo_cursos: [
    { id_ciclo_curso: 'cco-demo-1', id_ciclo: 'cic-demo-1', id_curso: 'cur-demo-1',
      id_docente: 'usr-demo-2', orden: 1 },
    { id_ciclo_curso: 'cco-demo-2', id_ciclo: 'cic-demo-1', id_curso: 'cur-demo-2',
      id_docente: 'usr-demo-2', orden: 2 },
    { id_ciclo_curso: 'cco-demo-3', id_ciclo: 'cic-demo-2', id_curso: 'cur-demo-1',
      id_docente: '', orden: 1 },
  ],

  // 6. matriculas -------------------------------------------------------------
  matriculas: [
    { id_matricula: 'mat-demo-1', id_usuario: 'usr-demo-4', id_ciclo: 'cic-demo-1',
      fecha: '2026-06-28', estado: 'matriculado', turno: 'tarde',
      observaciones: 'Matricula completa - DEMO' },
    { id_matricula: 'mat-demo-2', id_usuario: 'usr-demo-5', id_ciclo: 'cic-demo-1',
      fecha: '2026-06-30', estado: 'retirado', turno: 'tarde',
      observaciones: 'DEMO - Retiro por pago de matricula rechazado y falta de regularizacion' },
  ],

  // 7. pagos -----------------------------------------------------------------
  pagos: [
    { id_pago: 'pag-demo-1', id_matricula: 'mat-demo-1', concepto: 'matricula', monto: 100.00,
      fecha_reporte: '2026-06-28', fecha_verificacion: '2026-06-29', medio: 'yape',
      estado: 'verificado', voucher_ref: 'YAPE-000123', id_verificador: 'usr-demo-3' },
    { id_pago: 'pag-demo-2', id_matricula: 'mat-demo-1', concepto: 'mensualidad_1', monto: 250.00,
      fecha_reporte: '2026-07-18', fecha_verificacion: '', medio: 'plin',
      estado: 'pendiente', voucher_ref: 'PLIN-000456', id_verificador: '' },
    { id_pago: 'pag-demo-3', id_matricula: 'mat-demo-2', concepto: 'matricula', monto: 100.00,
      fecha_reporte: '2026-06-30', fecha_verificacion: '2026-07-01', medio: 'efectivo',
      estado: 'rechazado', voucher_ref: 'EFEC-000789', id_verificador: 'usr-demo-3' },
  ],

  // 8. horario (patron semanal) ----------------------------------------------
  horario: [
    { id_horario: 'hor-demo-1', id_ciclo_curso: 'cco-demo-1', dia_semana: 'lunes',
      hora_inicio: '18:00', hora_fin: '20:00', aula_o_enlace: 'Meet: meet.google.com/guyton-mat (DEMO)' },
    { id_horario: 'hor-demo-2', id_ciclo_curso: 'cco-demo-2', dia_semana: 'miercoles',
      hora_inicio: '18:00', hora_fin: '20:00', aula_o_enlace: 'Meet: meet.google.com/guyton-com (DEMO)' },
  ],

  // 9. clases (sesiones fechadas) ---------------------------------------------
  clases: [
    { id_clase: 'cls-demo-1', id_ciclo_curso: 'cco-demo-1', fecha: '2026-07-13',
      hora_inicio: '18:00', hora_fin: '20:00', tema: 'Numeros reales y operaciones basicas (DEMO)',
      modalidad: 'virtual', enlace_en_vivo: 'https://meet.google.com/guyton-mat (DEMO)', estado: 'dictada' },
    { id_clase: 'cls-demo-2', id_ciclo_curso: 'cco-demo-2', fecha: '2026-07-15',
      hora_inicio: '18:00', hora_fin: '20:00', tema: 'Comprension lectora: idea principal (DEMO)',
      modalidad: 'virtual', enlace_en_vivo: 'https://meet.google.com/guyton-com (DEMO)', estado: 'dictada' },
    { id_clase: 'cls-demo-3', id_ciclo_curso: 'cco-demo-1', fecha: '2026-07-20',
      hora_inicio: '18:00', hora_fin: '20:00',
      tema: 'Repaso presencial: ecuaciones lineales - sesion especial (DEMO)',
      modalidad: 'presencial', enlace_en_vivo: '', estado: 'programada' },
  ],

  // 10. materiales -------------------------------------------------------------
  materiales: [
    { id_material: 'mtl-demo-1', id_ciclo_curso: 'cco-demo-1', id_clase: 'cls-demo-1',
      tipo: 'pdf_practica', titulo: 'Practica 1: Numeros reales (DEMO)', semana: 1,
      url_drive: 'https://drive.google.com/file/d/DEMO-practica-1/view', id_material_padre: '',
      fecha_publicacion: '2026-07-13', id_autor: 'usr-demo-2', estado: 'publicado' },
    { id_material: 'mtl-demo-2', id_ciclo_curso: 'cco-demo-1', id_clase: 'cls-demo-1',
      tipo: 'pdf_resolucion', titulo: 'Resolucion Practica 1 (DEMO)', semana: 1,
      url_drive: 'https://drive.google.com/file/d/DEMO-resolucion-1/view',
      id_material_padre: 'mtl-demo-1', fecha_publicacion: '2026-07-14',
      id_autor: 'usr-demo-2', estado: 'publicado' },
    { id_material: 'mtl-demo-3', id_ciclo_curso: 'cco-demo-2', id_clase: 'cls-demo-2',
      tipo: 'video_grabado', titulo: 'Grabacion: Comprension lectora - clase 1 (DEMO)', semana: 1,
      url_drive: 'https://drive.google.com/file/d/DEMO-grabacion-1/view', id_material_padre: '',
      fecha_publicacion: '2026-07-15', id_autor: 'usr-demo-2', estado: 'borrador' },
  ],

  // 11. asistencias -------------------------------------------------------------
  asistencias: [
    { id_asistencia: 'asi-demo-1', id_clase: 'cls-demo-1', id_usuario: 'usr-demo-4',
      estado: 'presente', id_registrador: 'usr-demo-3', observacion: '' },
    { id_asistencia: 'asi-demo-2', id_clase: 'cls-demo-2', id_usuario: 'usr-demo-4',
      estado: 'tardanza', id_registrador: 'usr-demo-3',
      observacion: 'DEMO - llego 10 minutos tarde' },
  ],

  // 12. anuncios -----------------------------------------------------------------
  anuncios: [
    { id_anuncio: 'anu-demo-1', id_ciclo: '', titulo: 'Bienvenida al ciclo 2026-II (DEMO)',
      cuerpo: 'Bienvenidos al nuevo ciclo. Revisen su horario y el grupo de WhatsApp.',
      fecha: '2026-07-01', fijado: 'si', id_autor: 'usr-demo-1', estado: 'publicado' },
    { id_anuncio: 'anu-demo-2', id_ciclo: 'cic-demo-1', titulo: 'Recordatorio: pago de mensualidad (DEMO)',
      cuerpo: 'Recuerden reportar su pago de mensualidad antes del 25.',
      fecha: '2026-07-17', fijado: 'no', id_autor: 'usr-demo-3', estado: 'publicado' },
  ],
}
