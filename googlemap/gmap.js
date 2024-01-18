let map;
let drawingManager;

function initMap() {
    // Configura la ubicación inicial del mapa
    let myLatLng = { lat: -12.0651359, lng: -77.0337622 };

    // Crea un nuevo mapa y pásale la configuración
    let map = new google.maps.Map(document.getElementById('map'), {
        center: myLatLng,
        zoom: 15
    });

    drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false,
        map: map
    });

    //  const drawingManagerz = new google.maps.drawing.DrawingManager({
    //     drawingMode: google.maps.drawing.OverlayType.MARKER,
    //     drawingControl: true,
    //     drawingControlOptions: {
    //     position: google.maps.ControlPosition.TOP_CENTER,
    //     drawingModes: [
    //         google.maps.drawing.OverlayType.MARKER,
    //         google.maps.drawing.OverlayType.CIRCLE,
    //         google.maps.drawing.OverlayType.POLYGON,
    //         google.maps.drawing.OverlayType.POLYLINE,
    //         google.maps.drawing.OverlayType.RECTANGLE,
    //     ],
    //     },
    //     markerOptions: {
    //     icon: "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png",
    //     },
    //     circleOptions: {
    //     fillColor: "#ffff00",
    //     fillOpacity: 1,
    //     strokeWeight: 5,
    //     clickable: false,
    //     editable: true,
    //     zIndex: 1,
    //     },
    // });

    // drawingManagerz.setMap(map);

    google.maps.event.addListener(drawingManager, 'overlaycomplete', function (event) {
        if (event.type == 'marker' || event.type == 'polygon' || event.type == 'polyline') {
            drawingManager.setDrawingMode(null);
            // Aquí puedes realizar acciones adicionales con el objeto event.overlay, por ejemplo, guardar las coordenadas o personalizar el objeto.
        }
    });

    // Asigna eventos de clic a los botones
    document.getElementById('markerBtn').addEventListener('click', function () {
        activateDrawInteraction('marker', 'Crear Marcador');
        setActiveButton('markerBtn');
    });

    document.getElementById('lineBtn').addEventListener('click', function () {
        activateDrawInteraction('line', 'Crear Línea');
        setActiveButton('lineBtn');
    });

    document.getElementById('polygonBtn').addEventListener('click', function () {
        activateDrawInteraction('polygon', 'Dibujar Polígono');
        setActiveButton('polygonBtn');
    });

    document.getElementById('panBtn').addEventListener('click', function () {
        activateDrawInteraction('pan', 'Mover Mapa');
        setActiveButton('panBtn');
    });
    document.getElementById('darkModeBtn').addEventListener('click', function () {
        activateDarkMode();
    });

    // Asigna evento de clic al botón de guardar
    document.getElementById('saveBtn').addEventListener('click', function () {
        // Aquí puedes agregar la lógica para guardar según la herramienta seleccionada
        alert('Guardando datos de la herramienta: ' + selectedTool);
    });
    // Función para actilet el modo oscuro
    function activateDarkMode() {
        document.body.classList.toggle('dark-mode');
    }

    // Función para resaltar el botón activo
    function setActiveButton(activeBtnId) {
        let buttons = document.querySelectorAll('button');
        buttons.forEach(function (button) {
            button.classList.remove('active-button');
        });
        document.getElementById(activeBtnId).classList.add('active-button');
    }

    function activateDrawInteraction(functionType, toolTitle) {
        console.log(toolTitle);
        drawingManager.setMap(null); // Desactivar DrawingManager para cualquier funcionalidad previa
        switch (functionType) {
            case 'pan':
                // Mover mapa
                map.setOptions({ draggable: true });
                break;
            case 'marker':
                // Crear marcador
                drawingManager.setOptions({
                    drawingControl: false,
                    drawingMode: google.maps.drawing.OverlayType.MARKER
                });
                break;
            case 'line':
                // Dibujar línea
                drawingManager.setOptions({
                    drawingControl: false,
                    drawingMode: google.maps.drawing.OverlayType.POLYLINE,
                    polylineOptions: {
                        strokeColor: '#FF0000',
                        strokeOpacity: 1.0,
                        strokeWeight: 2
                    }
                });
                break;
            case 'polygon':
                // Dibujar polígono
                drawingManager.setOptions({
                    drawingControl: false,
                    drawingMode: google.maps.drawing.OverlayType.POLYGON,
                    polygonOptions: {
                        strokeColor: '#FF0000',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: '#FF0000',
                        fillOpacity: 0.35
                    }
                });
                break;
            default:
                break;
        }
        drawingManager.setMap(map);


    }
}