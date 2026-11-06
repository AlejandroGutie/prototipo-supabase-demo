// Preguntas del diligenciamiento, por programa, según el diccionario.
// No incluye campos de sistema (archivo, hoja, marca temporal, edad reportada, ids).
(function () {
    const SALUTO = ['ASA', 'INACIA', 'MACRO', 'MICRODOSIS'];
    const CONSUMO = ['ASA', 'INACIA', 'MACRO', 'MICRODOSIS', 'MEDICINAS'];
    const CLINICO = ['ASA', 'INACIA', 'MACRO', 'MICRODOSIS', 'MEDICINAS', 'RENASER', 'FENESER', 'ADAM'];

    function q(id, nombre, tipo, programas, extra) {
        const pregunta = { id: id, nombre: nombre, tipo: tipo, programas: programas };
        if (extra) Object.assign(pregunta, extra);
        return pregunta;
    }

    function si(id) {
        return { depende: { id: id, valor: 'S' } };
    }

    window.VIBA_PREGUNTAS = [
        q('taller_numero', 'Número de taller o acompañamiento de la persona', 'entero', SALUTO.concat(['MEDICINAS']), { min: 1 }),
        q('aprueba_newsletter', '¿Acepta correo de novedades?', 'sn', SALUTO.concat(['MEDICINAS'])),
        q('aprueba_investigacion', '¿Acepta ser contactada para investigación?', 'sn', SALUTO.concat(['MEDICINAS'])),
        q('datos_generales', 'Datos generales de la persona', 'texto', SALUTO),
        q('motivacion', 'Motivación para el taller o el encuentro', 'texto', SALUTO.concat(['MEDICINAS'])),
        q('antecedentes_patologicos', 'Antecedentes patológicos (pasado)', 'texto', SALUTO.concat(['MEDICINAS'])),
        q('enfermedad_actual', 'Enfermedad o infección actual', 'texto', ['MEDICINAS']),
        q('antecedentes_farmacologicos', 'Antecedentes farmacológicos (pasado)', 'texto', SALUTO.concat(['MEDICINAS'])),
        q('antecedentes_spas', 'Antecedentes de experiencias con SPA', 'texto', SALUTO),
        q('emocionalmente_persona', 'Estado emocional que refiere la persona', 'texto', SALUTO.concat(['MEDICINAS'])),
        q('fisicamente_persona', 'Estado físico que refiere la persona', 'texto', SALUTO.concat(['MEDICINAS'])),
        q('escala_animo', 'Ánimo, de 0 a 10', 'escala', CLINICO),
        q('escala_ansiedad', 'Ansiedad, de 0 a 10', 'escala', CLINICO),
        q('escala_sueno', 'Calidad del sueño, de 0 a 10', 'escala', CLINICO),
        q('escala_dolor_eva', 'Dolor (EVA), de 0 sin dolor a 10 máximo', 'escala', CLINICO),
        q('categoria_emocional', 'Categorías emocionales referidas', 'multiple', CLINICO, { catalogo: 'categoriaEmocional' }),
        q('medicamentos', '¿Toma medicamentos, drogas o suplementos actualmente?', 'sn', ['MEDICINAS']),
        q('desc_medicamentos', 'Cuáles medicamentos, drogas o suplementos toma actualmente', 'texto', ['MEDICINAS'], si('medicamentos')),
        q('medicamento_15_dias', '¿Tomó algún medicamento, droga o suplemento en los últimos 15 días?', 'sn', ['MEDICINAS']),
        q('cual_med_15_dias', 'Detalle de lo tomado en los últimos 15 días', 'texto', ['MEDICINAS'], si('medicamento_15_dias')),
        q('medicamentos_psiquiatricos', '¿Ha tomado o toma medicamentos psiquiátricos?', 'sn', ['MEDICINAS', 'RENASER']),
        q('cuales_med_psiquiatricos', 'Cuáles medicamentos psiquiátricos y dosis', 'texto', ['MEDICINAS', 'RENASER'], si('medicamentos_psiquiatricos')),
        q('operaciones_accidentes', '¿Operaciones, accidentes traumáticos o transfusiones?', 'sn', ['MEDICINAS']),
        q('desc_operaciones_accidentes', 'Cuál operación o accidente', 'texto', ['MEDICINAS'], si('operaciones_accidentes')),
        q('vivi_operaciones_accidentes', 'Cómo vivió la operación, el accidente o la transfusión', 'texto', ['MEDICINAS'], si('operaciones_accidentes')),
        q('intervenciones_oculares', '¿Intervenciones oculares o problema en ojos, nariz o boca?', 'sn', ['MEDICINAS']),
        q('cuales_intervenciones_oculares', 'Cuáles intervenciones o problemas oftálmicos', 'texto', ['MEDICINAS'], si('intervenciones_oculares')),
        q('alergias', '¿Ha sido o es alérgico a algo?', 'sn', ['MEDICINAS']),
        q('cuales_alergias', 'Cuáles alergias', 'texto', ['MEDICINAS'], si('alergias')),
        q('vacunado', '¿Se ha vacunado en los últimos 10 años?', 'sn', ['MEDICINAS']),
        q('cuales_vacunas', 'Cuáles vacunas', 'texto', ['MEDICINAS'], si('vacunado')),
        q('tolerancia_vacunas', 'Cómo toleró la vacuna', 'texto', ['MEDICINAS'], si('vacunado')),
        q('primeravez_tomando', '¿Primera vez tomando un psicoactivo, una droga o una medicina ancestral?', 'sn', ['MEDICINAS']),
        q('cuales_tomado', 'Qué otros psicoactivos, drogas o medicinas ancestrales ha tomado', 'texto', ['MEDICINAS'], { depende: { id: 'primeravez_tomando', valor: 'N' } }),
        q('primeravez_ayahuasca_yage', '¿Primera vez tomando ayahuasca o yagé?', 'sn', ['MEDICINAS']),
        q('problemas_tomando', '¿Ha presentado problemas al tomar medicamentos, drogas o medicinas ancestrales?', 'sn', ['MEDICINAS']),
        q('cuales_problemas', 'Cuáles problemas o inconvenientes ha presentado', 'texto', ['MEDICINAS'], si('problemas_tomando')),
        q('enfermedad_mental_antes', '¿Ha padecido alguna enfermedad mental?', 'sn', ['MEDICINAS']),
        q('cual_enf_mental_antes', 'Cuál enfermedad mental ha padecido', 'texto', ['MEDICINAS'], si('enfermedad_mental_antes')),
        q('enfermedad_mental_actual', '¿Padece actualmente alguna enfermedad mental?', 'sn', ['MEDICINAS']),
        q('cual_enf_mental_actual', 'Cuál enfermedad mental padece actualmente', 'texto', ['MEDICINAS'], si('enfermedad_mental_actual')),
        q('sustancias', 'Sustancias discriminadas', 'sustancias', CONSUMO),
        q('red_apoyo', 'Quiénes conforman la red de apoyo', 'texto', ['MEDICINAS']),
        q('pretende_tomar', 'Medicina o taller al que busca asistir', 'texto', ['MEDICINAS']),
        q('fecha_toma_pretende', 'Fecha de toma de ayahuasca a la cual pretende ir', 'fecha', ['MEDICINAS']),
        q('enteraste_encuentro', 'Cómo se enteró del encuentro', 'texto', ['MEDICINAS']),
        q('percepcion_muerte', 'Qué percepción de la muerte tiene la persona', 'texto', SALUTO),
        q('disposicion_taller', 'Disposición para seguir instrucciones en el taller', 'texto', SALUTO),
        q('disposicion_ojos', 'Disposición para permanecer con ojos cubiertos', 'texto', SALUTO),
        q('disposicion_postaller', 'Disposición para ejercicios post-taller y reintegro', 'texto', SALUTO),
        q('nombre_acudiente', 'Nombre del acudiente', 'texto', SALUTO.concat(['MEDICINAS'])),
        q('telefono_acudiente', 'Teléfono del acudiente, con indicativo', 'entero', SALUTO.concat(['MEDICINAS']), { min: 1 }),
        q('percepcion_entrevistador', 'Percepción del entrevistador', 'texto', SALUTO),
        q('propuesta_intervencion', 'Fecha de la propuesta de intervención', 'fecha', SALUTO),
        q('notas_reintegro', 'Notas del reintegro', 'texto', SALUTO),
        q('diagnostico_profesional', '¿Tiene un diagnóstico dado por un profesional de la salud?', 'sn', ['RENASER']),
        q('cual_diagnostico', 'Cuál diagnóstico y qué tratamientos ha hecho', 'texto', ['RENASER'], si('diagnostico_profesional')),
        q('claridad_conscienciaviba', '¿Tiene claridad sobre el enfoque de la Fundación?', 'sn', ['RENASER']),
        q('sabe_sustancias', 'Qué sabe de las sustancias psicodélicas y su aplicación terapéutica', 'texto', ['RENASER']),
        q('objetivos', 'Objetivos planteados para el proceso actual', 'texto', ['RENASER']),
        q('apoyo_proceso', 'Cómo cree que podemos apoyar su proceso', 'texto', ['RENASER']),
        q('apoyo_psiquiatrico', '¿Cuenta con apoyo psiquiátrico o psicoterapéutico?', 'sn', ['RENASER']),
        q('afirmacion_proceso_salud', 'Apreciación sobre el proceso de salud y enfermedad', 'texto', ['RENASER']),
        q('visita_pagina', '¿Visitó la página y leyó el portafolio?', 'sn', ['RENASER']),
        q('tiempos_respuesta', '¿Acepta tiempos de respuesta de hasta 2 semanas?', 'sn', ['RENASER']),
        q('desplazamiento', '¿Se desplazaría hasta Guarne si vive fuera de Medellín?', 'sn', ['RENASER']),
        q('aceptado', 'Concepto de aceptación al proceso', 'catalogo', ['MEDICINAS', 'RENASER'], { catalogo: 'aceptacion' }),
        q('observaciones', 'Observaciones de seguimiento', 'texto', ['MEDICINAS', 'RENASER']),
        q('tu_persona_enferma', '¿Es usted la persona frente a la situación que amenaza la vida?', 'sn', ['FENESER']),
        q('parentesco', 'Parentesco con la persona de la situación', 'catalogo', ['FENESER'], { catalogo: 'parentesco', depende: { id: 'tu_persona_enferma', valor: 'N' } }),
        q('situacion_final_vida', 'Situación de final de vida', 'texto', ['FENESER']),
        q('preocupacion', 'Qué le preocupa de este proceso de final de vida', 'texto', ['FENESER']),
        q('consciencia_ayudar', 'En qué cree que Consciencia VIBA puede ayudarle', 'texto', ['FENESER']),
        q('servicios_feneser', 'Servicios FeneSer de interés', 'multiple', ['FENESER'], { catalogo: 'servicioFeneser' }),
        q('situacion_desafiante', 'Situación o experiencia más desafiante', 'texto', ['ADAM']),
        q('enfermedad_psiquiatrica', '¿Enfermedad de base o antecedente psiquiátrico?', 'sn', ['ADAM']),
        q('cual_enf_psiquiatrica', 'Cuál enfermedad de base o antecedente psiquiátrico', 'texto', ['ADAM'], si('enfermedad_psiquiatrica')),
        q('servicio', 'Servicio del movimiento administrativo', 'catalogo', ['TRANSACCIONAL'], { catalogo: 'servicio' }),
        q('valor_consignado', 'Valor consignado', 'decimal', ['TRANSACCIONAL'], { min: 0 })
    ];
})();
