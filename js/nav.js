/* Barra común. La página activa se marca con data-pagina en el body. */
(function () {
    const pagina = document.body.dataset.pagina || 'personas';
    const header = document.getElementById('app-header');
    if (!header) return;

    const enlaces = [
        ['personas', 'index.html', 'Personas'],
        ['formularios', 'formularios.html', 'Formularios'],
        ['talleres', 'talleres.html', 'Talleres'],
        ['valoraciones', 'valoraciones.html', 'Valoraciones']
    ];

    const nav = enlaces.map(function (item) {
        const activo = item[0] === pagina ? ' class="active"' : '';
        return '<a href="' + item[1] + '"' + activo + '>' + item[2] + '</a>';
    }).join('');

    header.innerHTML =
        '<div class="brand">' +
            '<strong>Consciencia VIBA</strong>' +
            '<span>Datos de acompañamiento</span>' +
        '</div>' +
        '<nav>' + nav + '</nav>';
})();
