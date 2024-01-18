let map;

function initMap() {
    // Configura la ubicación inicial del mapa
    let myLatLng = { lat: -12.0651359, lng: -77.0337622 };

    // Crea un nuevo mapa y pásale la configuración
    let map = new google.maps.Map(document.getElementById('map'), {
        center: myLatLng,
        zoom: 12
    });
    console.log(123);

    // Asigna eventos de clic a los botones
    document.getElementById('markerBtn').addEventListener('click', function () {
        activateDrawInteraction('Point', 'Crear Marcador');
        setActiveButton('markerBtn');
    });

    document.getElementById('lineBtn').addEventListener('click', function () {
        activateDrawInteraction('LineString', 'Crear Línea');
        setActiveButton('lineBtn');
    });

    document.getElementById('polygonBtn').addEventListener('click', function () {
        activateDrawInteraction('Polygon', 'Dibujar Polígono');
        setActiveButton('polygonBtn');
    });

    document.getElementById('panBtn').addEventListener('click', function () {
        if (draw) {
            map.removeInteraction(draw);
        }
        setActiveButton('panBtn');
    });
    document.getElementById('darkModeBtn').addEventListener('click', function () {
        activateDarkMode();
    });
    // document.getElementById('searchBtn').addEventListener('click', function () {
    //     searchAddress();
    // });

    // Función para resaltar el botón activo
    function setActiveButton(activeBtnId) {
        let buttons = document.querySelectorAll('button');
        buttons.forEach(function (button) {
            button.classList.remove('active-button');
        });
        document.getElementById(activeBtnId).classList.add('active-button');
    }

    // Asigna evento de clic al botón de guardar
    document.getElementById('saveBtn').addEventListener('click', function () {
        // Aquí puedes agregar la lógica para guardar según la herramienta seleccionada
        alert('Guardando datos de la herramienta: ' + selectedTool);
    });
    //

    // Ejemplo de cómo activar el modo oscuro al hacer clic en el botón "Modo Oscuro"
    document.getElementById('darkModeBtn').addEventListener('click', function () {
        map.setOptions({ styles: darkModeStyles });
    });

    // Define un conjunto de estilos para el modo oscuro (puedes personalizar esto según tus preferencias)
    var darkModeStyles = [
        {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [
                { color: '#242f3e' }
            ]
        },
        // ... (agrega más estilos según tus necesidades)
    ];
    // Función para actilet el modo oscuro
    function activateDarkMode() {
        document.body.classList.toggle('dark-mode');
    }
    //


    let draw;
    let selectedTool; // letiable para almacenar la herramienta seleccionada

    // Función para actilet la interacción de dibujo correspondiente
    function activateDrawInteraction(type, toolTitle) {
        // Desactiva la interacción actual si existe
        if (draw) {
            map.removeInteraction(draw);
        }

        // Crea la nueva interacción según el tipo
        draw = new ol.interaction.Draw({
            source: vectorLayer.getSource(),
            type: type
        });

        // Agrega la nueva interacción al mapa
        map.addInteraction(draw);

        // Maneja el evento de dibujo completado
        draw.on('drawend', function (event) {
            displayFeatureInfo(event.feature);
        });

        // Actualiza el título del div flotante
        document.getElementById('toolTitle').innerText = toolTitle;
        selectedTool = toolTitle;
    }

    // Función para mostrar información de la geometría en el div flotante
    function displayFeatureInfo(feature) {
        let geometryType = feature.getGeometry().getType();
        let coordinates = feature.getGeometry().getCoordinates();
        // let lonLat = ol.proj.transform(coordinates, 'EPSG:3857', 'EPSG:4326');
        let lonLat = new google.maps.LatLng(coordinates[1], coordinates[0]);
        let formattedCoordinates;

        switch (geometryType) {
            case 'Point':
                formattedCoordinates = 'Latitud: ' + coordinates[1].toFixed(6) + ', Longitud: ' + coordinates[0].toFixed(6);
                break;
            case 'LineString':
            case 'Polygon':
                formattedCoordinates = 'Coordenadas: <br>' + formatCoordinates(coordinates) + '<br>';
                break;
            default:
                formattedCoordinates = 'Información no disponible';
        }

        let infoText = 'Información de la Geometría:<br>';
        infoText += 'Tipo: ' + geometryType + '<br>';
        infoText += formattedCoordinates;
        document.getElementById('featureInfo').innerHTML = infoText;
    }
    // Función para formatear las coordenadas
    function formatCoordinates(coordinates) {
        return coordinates.map(function (coord, index) {
            return `[${index}]` + '(' + coord[1].toFixed(6) + ', ' + coord[0].toFixed(6) + ')';
        }).join(', ');
    }

}