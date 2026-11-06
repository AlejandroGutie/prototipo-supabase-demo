// Catálogos del diccionario y de sql.sql. En modo local alimentan los select.
// Cuando la aplicación use Supabase, estos valores salen de las tablas cat_*.
window.VIBA_CATALOGOS = {
    tipoDocumento: [
        ['CC', 'Cédula de ciudadanía'],
        ['TI', 'Tarjeta de identidad'],
        ['RC', 'Registro civil'],
        ['NIP', 'Número único de identificación personal'],
        ['CE', 'Cédula de extranjería'],
        ['PA', 'Pasaporte'],
        ['PEP', 'Permiso especial de permanencia'],
        ['PPT', 'Permiso por protección temporal'],
        ['NIT', 'Número de identificación tributaria'],
        ['CD', 'Carné diplomático'],
        ['SC', 'Salvoconducto']
    ],
    sexo: [
        ['HOM', 'Hombre'],
        ['MUJ', 'Mujer'],
        ['NB', 'No binario'],
        ['OTR', 'Otro']
    ],
    sn: [
        ['S', 'Sí'],
        ['N', 'No']
    ],
    programa: [
        ['ASA', 'ASA · Acompañamiento'],
        ['INACIA', 'INACIA'],
        ['MACRO', 'MacroPsilo'],
        ['MICRODOSIS', 'Microdosis'],
        ['MEDICINAS', 'Medicinas que expanden la consciencia'],
        ['RENASER', 'RenaSer'],
        ['FENESER', 'FeneSer'],
        ['ADAM', 'Adam'],
        ['TRANSACCIONAL', 'Transaccional']
    ],
    aceptacion: [
        ['APTO', 'Apto'],
        ['NO_APTO', 'No apto'],
        ['PENDIENTE', 'Pendiente']
    ],
    parentesco: [
        ['PAR_PM', 'Padre/Madre'],
        ['PAR_HI', 'Hijo/Hija'],
        ['PAR_HE', 'Hermano/Hermana'],
        ['PAR_AB', 'Abuelo/Abuela'],
        ['PAR_NI', 'Nieto/Nieta'],
        ['PAR_TI', 'Tío/Tía'],
        ['PAR_SO', 'Sobrino/Sobrina'],
        ['PAR_PR', 'Primo/Prima'],
        ['PAR_CO', 'Cónyuge / Esposo / Esposa'],
        ['PAR_CP', 'Compañero(a) permanente / Pareja de hecho'],
        ['PAR_SU', 'Suegro/Suegra'],
        ['PAR_YE', 'Yerno/Nuera'],
        ['PAR_CU', 'Cuñado/Cuñada'],
        ['PAR_AD', 'Padre/Madre adoptante o hijo(a) adoptivo(a)'],
        ['PAR_TU', 'Tutor legal / Apoderado / Representante legal'],
        ['PAR_YO', 'Ninguno (titular de la solicitud / yo mismo)'],
        ['PAR_AM', 'Amigo/Amiga'],
        ['PAR_VE', 'Vecino/Vecina'],
        ['PAR_CT', 'Compañero(a) de trabajo'],
        ['PAR_EM', 'Empleador/Empleado'],
        ['PAR_OT', 'Otro']
    ],
    servicio: [
        ['ASA', 'Acompañamiento ASA'],
        ['DON', 'Donación'],
        ['PROD', 'Compra de productos'],
        ['MICRO', 'Microdosis'],
        ['ASMED', 'Asesoría médica'],
        ['ASINF', 'Asesoría informativa'],
        ['ADAM', 'Acompañamiento Adam'],
        ['ANIMK', 'Acompañamiento Animate-K'],
        ['SEMI', 'Seminario'],
        ['OTRO', 'Otro']
    ],
    /* Etiquetas operativas del diccionario, en versión legible para el selector. */
    servicioFeneser: [
        ['FENE_PAL', 'Acompañamiento paliadélico (final de vida, hasta 6 meses de pronóstico)'],
        ['FENE_ASE', 'Asesoría para la persona en final de vida'],
        ['FENE_FAM', 'Asesoría y recomendaciones para quien acompaña a un ser querido']
    ],
    categoriaEmocional: [
        ['TRISTEZA', 'Tristeza'],
        ['ANSIEDAD', 'Ansiedad'],
        ['IRA', 'Ira / enojo'],
        ['MIEDO', 'Miedo'],
        ['ALEGRIA', 'Alegría'],
        ['CALMA', 'Calma'],
        ['CONFUSION', 'Confusión'],
        ['OTRO', 'Otro']
    ],
    sustancia: [
        ['LSD', 'LSD'],
        ['YAGE', 'Yagé / ayahuasca'],
        ['KETAMINA', 'Ketamina'],
        ['MDMA', 'MDMA'],
        ['HONGOS_PSILO', 'Hongos psilocibios'],
        ['OTRO', 'Otra sustancia']
    ],
    /* Modalidad de la agenda del profesional. */
    modalidad: [
        ['VIRTUAL', 'Virtual'],
        ['PRESENCIAL', 'Presencial']
    ],
    /* Estado de la inscripción de una persona a un taller. */
    estadoInscripcion: [
        ['INSCRITA', 'Inscrita'],
        ['ESPERA', 'Lista de espera'],
        ['CANCELADA', 'Cancelada'],
        ['ASISTIO', 'Asistió']
    ],
    /* Momento de la valoración del profesional. */
    tipoValoracion: [
        ['PRE', 'Valoración previa'],
        ['SEGUIMIENTO', 'Valoración de seguimiento'],
        ['POST', 'Valoración posterior o de cierre']
    ]
};
