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

  // 13. banqueo_preguntas -------------------------------------------------------
  // Banco de preguntas del "Banqueo Guyton UNA Puno". Estas preguntas son
  // INVENTADAS de muestra (NO son preguntas reales de la academia): solo sirven
  // para probar la vista en modo DEMO. Cada justificacion arranca con "Ejemplo
  // DEMO." para dejar claro su caracter provisional. En produccion, el backend
  // sirve el banco real desde la hoja privada banqueo_preguntas (nunca el repo).
  // 'correcta' es un numero 1..5 que apunta a la opcion correcta (1 = la primera).
  banqueo_preguntas: [
    { id_pregunta: 'bpg-demo-1', curso: 'Comunicación', tema: 'Ortografía', subtema: 'Tildación',
      enunciado: '¿Cuál de las siguientes palabras lleva tilde correctamente?',
      opciones: ['exámen', 'cárcel', 'júven', 'facilmente', 'reirse'], correcta: 2,
      justificacion: 'Ejemplo DEMO. "Cárcel" es una palabra grave (llana) terminada en consonante distinta de "n" o "s", por eso lleva tilde. "Examen" y "joven" son graves terminadas en "n", así que no se tildan.',
      fuente: 'Examen de Admisión UNA Puno 2018 - I Fase (DEMO)',
      imagen_url: '', estado: 'publicado' },
    { id_pregunta: 'bpg-demo-2', curso: 'Comunicación', tema: 'Gramática', subtema: 'Categorías gramaticales',
      enunciado: 'En la oración "Ella corre velozmente por el parque", la palabra "velozmente" es un…',
      opciones: ['adjetivo', 'sustantivo', 'adverbio', 'verbo', 'pronombre'], correcta: 3,
      justificacion: 'Ejemplo DEMO. "Velozmente" modifica al verbo "corre" e indica el modo; las palabras terminadas en "-mente" que responden a "¿cómo?" son adverbios.',
      fuente: 'Examen de Admisión UNA Puno 2019 - II Fase (DEMO)',
      imagen_url: '', estado: 'publicado' },
    { id_pregunta: 'bpg-demo-3', curso: 'Comunicación', tema: 'Semántica', subtema: 'Sinónimos',
      enunciado: '¿Cuál es el sinónimo más preciso de la palabra "efímero"?',
      opciones: ['eterno', 'pasajero', 'profundo', 'resistente', 'enorme'], correcta: 2,
      justificacion: 'Ejemplo DEMO. "Efímero" significa de muy corta duración; su sinónimo es "pasajero". "Eterno" sería su antónimo.',
      fuente: 'Examen General SOC 2018 - 2.a Fase (DEMO)',
      imagen_url: '', estado: 'publicado' },
    { id_pregunta: 'bpg-demo-4', curso: 'Comunicación', tema: 'Conectores lógicos', subtema: 'Concesión',
      enunciado: 'En "Aunque estudió toda la noche, no aprobó el examen", ¿qué relación expresa el conector "aunque"?',
      opciones: ['causa', 'consecuencia', 'concesión', 'condición', 'finalidad'], correcta: 3,
      justificacion: 'Ejemplo DEMO. "Aunque" introduce una objeción que no impide lo que dice la oración principal: es un conector de concesión.',
      fuente: 'Examen de Admisión UNA Puno 2020 - I Fase (DEMO)',
      imagen_url: '', estado: 'publicado' },
    { id_pregunta: 'bpg-demo-11', curso: 'Comunicación', tema: 'Ortografía', subtema: 'Uso de grafías',
      enunciado: '¿En cuál de las alternativas todas las palabras están escritas correctamente?',
      opciones: ['hechar, vaya, tuvo', 'echar, valla, tuvo', 'echar, vaya, tubo', 'hechar, valla, tubo', 'echar, valla, tubo'], correcta: 2,
      justificacion: 'Ejemplo DEMO. "Echar" (del verbo echar) va sin h; "valla" es una cerca; "tuvo" es del verbo tener. Las demás mezclan grafías incorrectas.',
      fuente: 'Examen de Admisión UNA Puno 2021 - II Fase (DEMO)',
      imagen_url: '', estado: 'publicado' },
    { id_pregunta: 'bpg-demo-5', curso: 'Historia', tema: 'Perú prehispánico', subtema: 'Los incas',
      enunciado: '¿Cuál fue la capital del Imperio incaico (Tahuantinsuyo)?',
      opciones: ['Cajamarca', 'Cusco', 'Lima', 'Chan Chan', 'Tiwanaku'], correcta: 2,
      justificacion: 'Ejemplo DEMO. El Cusco fue el centro político y religioso del Tahuantinsuyo; de él partían los cuatro suyos que dan nombre al imperio.',
      fuente: 'Examen de Admisión UNA Puno 2017 - I Fase (DEMO)',
      imagen_url: '', estado: 'publicado' },
    { id_pregunta: 'bpg-demo-6', curso: 'Historia', tema: 'Independencia del Perú', subtema: 'Proclamación',
      enunciado: '¿En qué año se proclamó la independencia del Perú?',
      opciones: ['1810', '1821', '1824', '1879', '1532'], correcta: 2,
      justificacion: 'Ejemplo DEMO. José de San Martín proclamó la independencia del Perú el 28 de julio de 1821 en Lima.',
      fuente: 'Examen General SOC 2019 - 1.a Fase (DEMO)',
      imagen_url: '', estado: 'publicado' },
    { id_pregunta: 'bpg-demo-7', curso: 'Historia', tema: 'Mundo contemporáneo', subtema: 'Guerras mundiales',
      enunciado: '¿Qué acontecimiento desencadenó el inicio de la Primera Guerra Mundial en 1914?',
      opciones: ['La caída del Muro de Berlín', 'El asesinato del archiduque Francisco Fernando', 'El ataque a Pearl Harbor', 'La Revolución rusa', 'La firma del Tratado de Versalles'], correcta: 2,
      justificacion: 'Ejemplo DEMO. El asesinato del archiduque Francisco Fernando en Sarajevo desató la crisis diplomática que llevó a la Primera Guerra Mundial.',
      fuente: 'Examen de Admisión UNA Puno 2020 - II Fase (DEMO)',
      imagen_url: '', estado: 'publicado' },
    { id_pregunta: 'bpg-demo-12', curso: 'Historia', tema: 'Perú prehispánico', subtema: 'Culturas preincas',
      enunciado: 'La cultura Nazca es reconocida principalmente por…',
      opciones: ['las líneas y geoglifos en el desierto', 'la ciudadela de Machu Picchu', 'la portada del Sol', 'los quipus administrativos', 'la fortaleza de Kuélap'], correcta: 1,
      justificacion: 'Ejemplo DEMO. La cultura Nazca destaca por sus enormes líneas y geoglifos trazados en el desierto de Ica, visibles desde el aire.',
      fuente: 'Examen de Admisión UNA Puno 2021 - I Fase (DEMO)',
      imagen_url: '', estado: 'publicado' },
    { id_pregunta: 'bpg-demo-8', curso: 'Razonamiento Verbal', tema: 'Analogías', subtema: 'Agente y lugar',
      enunciado: 'MÉDICO es a HOSPITAL como MAESTRO es a…',
      opciones: ['pizarra', 'escuela', 'libro', 'alumno', 'examen'], correcta: 2,
      justificacion: 'Ejemplo DEMO. La relación es "agente : lugar donde labora". El médico trabaja en el hospital; el maestro, en la escuela.',
      fuente: 'Examen de Admisión UNA Puno 2018 - II Fase (DEMO)',
      imagen_url: '', estado: 'publicado' },
    { id_pregunta: 'bpg-demo-9', curso: 'Razonamiento Verbal', tema: 'Término excluido', subtema: 'Campo semántico',
      enunciado: 'Señala la palabra que NO pertenece al grupo: rosa, clavel, girasol, roble, tulipán.',
      opciones: ['rosa', 'clavel', 'girasol', 'roble', 'tulipán'], correcta: 4,
      justificacion: 'Ejemplo DEMO. Rosa, clavel, girasol y tulipán son flores; el roble es un árbol, por eso queda excluido del grupo.',
      fuente: 'Examen General SOC 2018 - 2.a Fase (DEMO)',
      imagen_url: '', estado: 'publicado' },
    { id_pregunta: 'bpg-demo-10', curso: 'Razonamiento Verbal', tema: 'Oraciones incompletas', subtema: 'Coherencia léxica',
      enunciado: 'Completa: "La sequía fue tan ______ que los ríos quedaron completamente ______."',
      opciones: ['breve – llenos', 'severa – secos', 'leve – caudalosos', 'corta – crecidos', 'húmeda – vacíos'], correcta: 2,
      justificacion: 'Ejemplo DEMO. El sentido exige intensidad y consecuencia coherentes: una sequía "severa" deja los ríos "secos".',
      fuente: 'Examen de Admisión UNA Puno 2019 - I Fase (DEMO)',
      imagen_url: '', estado: 'publicado' },
    { id_pregunta: 'bpg-demo-13', curso: 'Razonamiento Verbal', tema: 'Analogías', subtema: 'Parte y todo',
      enunciado: 'PÁGINA es a LIBRO como ______ es a ______.',
      opciones: ['rueda : bicicleta', 'agua : mar', 'maestro : aula', 'perro : ladrido', 'sol : calor'], correcta: 1,
      justificacion: 'Ejemplo DEMO. "Página" es una parte del "libro"; del mismo modo, la "rueda" es una parte de la "bicicleta" (relación parte-todo).',
      fuente: 'Examen de Admisión UNA Puno 2022 - I Fase (DEMO)',
      imagen_url: '', estado: 'publicado' },
    { id_pregunta: 'bpg-demo-14', curso: 'Razonamiento Verbal', tema: 'Término excluido', subtema: 'Sinonimia',
      enunciado: 'Señala el término que NO es sinónimo de los demás: cándido, ingenuo, malicioso, inocente, crédulo.',
      opciones: ['cándido', 'ingenuo', 'malicioso', 'inocente', 'crédulo'], correcta: 3,
      justificacion: 'Ejemplo DEMO. Cándido, ingenuo, inocente y crédulo comparten la idea de falta de malicia; "malicioso" expresa lo contrario, por eso se excluye.',
      fuente: 'Examen General SOC 2020 - 2.a Fase (DEMO)',
      imagen_url: '', estado: 'publicado' },
  ],

  // 14. banqueo_progreso --------------------------------------------------------
  // Progreso del banqueo POR usuario y curso. Arranca vacío y se llena EN
  // MEMORIA a medida que el alumno responde (registrarRespuestaBanqueo): al
  // recargar la página se reinicia, como el resto de escrituras del mock DEMO.
  banqueo_progreso: [],
}
