let map;
let marker;
let leftClickListener;
let rightClickListener;
let doubleClickListener;
let dragEndListener;
let lineNodes = [];
let line;
let mapLayers = [];
let listaObjetos = [];

let menuPanel  = document.querySelector("#floating-menu-panel");
let submenuPanel = document.querySelector("#floating-submenu-panel");
let menuIcon = document.querySelector("#btnMenu > i");
let floatingModal  = document.querySelector("#floating-modal");



function initMap() {
    // Configura la ubicación inicial del mapa
    let myLatLng = { lat: -12.0651359, lng: -77.0337622 };

    // Crea un nuevo mapa y pásale la configuración
    map = new google.maps.Map(document.getElementById('map'), {
        center: myLatLng,
        zoom: 14,
        fullscreenControl: false,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL,
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        }
    });
    // Asigna eventos de clic a los botones
    document.getElementById('btnMenu').addEventListener('click', function () {
        ocultarPaneles();
        //console.log(menuIcon.classList.contains("fa-bars"));
        if (menuIcon.classList.contains("fa-bars")) {
            menuIcon.classList.remove("fa-bars");
            menuIcon.classList.add("fa-times");
            if (menuPanel.classList.contains("d-none")) {
                menuPanel.classList.remove("d-none");
                if (!submenuPanel.classList.contains("d-none")) {
                    submenuPanel.classList.add("d-none");
                }
            }
        } else {
            menuIcon.classList.remove("fa-times");
            menuIcon.classList.add("fa-bars");
            menuPanel.classList.add("d-none");
        }
    });
    
    document.getElementById('btnVista').addEventListener('click', function () {
        map.setOptions({ draggable: true });
        if (!menuPanel.classList.contains("d-none")) {
            menuIcon.classList.remove("fa-times");
            menuIcon.classList.add("fa-bars");
            menuPanel.classList.add("d-none");
        }
        if (!submenuPanel.classList.contains("d-none")) {
            submenuPanel.classList.add("d-none");
        }
        ocultarPaneles();
        limpiarObjetos();
        limpiarListeners();
    });

    document.getElementById('btnCrear').addEventListener('click', function () {
        ocultarPaneles();
        if(submenuPanel.classList.contains("d-none")){
            submenuPanel.classList.remove("d-none");
            if (!menuPanel.classList.contains("d-none")) {
                menuPanel.classList.add("d-none");
                menuIcon.classList.remove("fa-times");
                menuIcon.classList.add("fa-bars");
            }
        }else{
            submenuPanel.classList.add("d-none");
        }
        
    });

    //Crear
    document.getElementById('btnONU').addEventListener('click', function () {
        detalleOnu({});
        /*
        
        SELECT *,
        ST_MakePoint(longitude, latitude) as location
        FROM your_table;

        let coordinates = [{lat: 50, lon: 30}, {lat: 50, lon: 40}];
        let geojson = {
        "type": "Feature",
        "properties": {},
        "geometry": {
            "type": "LineString",
            "coordinates": coordinates.map(point => [point.lon, point.lat]) // GeoJSON uses [lon, lat]
        }
        };
        let geojsonString = JSON.stringify(geojson);
        INSERT INTO your_table (geom)
        VALUES (ST_GeomFromGeoJSON(:geojsonString));
        */
    });

    document.getElementById('btnMufa').addEventListener('click', function () {
        limpiarListeners();
        limpiarObjetos();
        if (!submenuPanel.classList.contains("d-none")) {
            submenuPanel.classList.add("d-none");
        }
        //Mapa
        leftClickListener = map.addListener('click', function(event) {
            marker && marker.setMap(null); // limpiar marcadores
            document.querySelector('#modal-info').innerHTML = 'Coordenadas: <br>Lat: ' + event.latLng.lat() + '<br>Lon: ' +event.latLng.lng();
            document.querySelector('#mufaCoordenadas').value = `{lat:${event.latLng.lat()},lon:${event.latLng.lng()}}`;
            document.querySelector('#btnGuardar').disabled = false;
            marker = new google.maps.Marker({
                position: event.latLng,
                map: map,
                draggable: true,
                icon: 'resources/img/mufa.png',
                infoWindow: new google.maps.InfoWindow({
                    maxWidth: 300,
                    content: 'Nueva mufa'
                })
            });
            marker.addListener('click', function() {
                this.infoWindow.open(map, this);
            });
            marker.addListener('dragend', function() {
                document.querySelector('#modal-info').innerHTML = 'Coordenadas: <br>Lat: ' + marker.getPosition().lat() + '<br>Lon: ' +marker.getPosition().lng();
                document.querySelector('#mufaCoordenadas').value = `{lat:${marker.getPosition().lat()},lon:${marker.getPosition().lng()}}`;
            });
        });
        //Modal
        document.querySelector('#modal-title').innerHTML = 'Agregar Mufa';
        document.querySelector('#modal-content').innerHTML = `
        <div class="row mx-0 mb-1">
            <div class="col-12">
                <label for="">Poste:</label>
                <select name="mufaPoste" id="mufaPoste" class="form-control form-control-sm"required><option value="">Seleccione</option><option value="0">M001</option></select>
            </div>
            <div class="col-6">
                <label for="">Capacidad:</label>
                <input type="number" class="form-control form-control-sm" id="mufaCapacidad" name="mufaCapacidad" placeholder="0" maxlength="10" min="0" step=".01" required/>
            </div>
            <div class="col-6">
                <label for="">Código de Mufa:</label>
                <input type="text" class="form-control form-control-sm" id="mufaCodigo" name="mufaCodigo" placeholder="Código" maxlength="10" required/>
            </div>
        </div>
        <div class="row mx-0 mb-1">
            <div class="col-6">
                <label for="">Hilo de entrada:</label>
                <select name="mufaHiloEntrada" id="mufaHiloEntrada" class="form-control form-control-sm"required><option value="">Seleccione</option><option value="0">HE1</option></select>
            </div>
            <div class="col-6">
                <label for="">Hilo de salida:</label>
                <select name="mufaHiloSalida" id="mufaHiloSalida" class="form-control form-control-sm"required><option value="">Seleccione</option><option value="0">HS1</option></select>
            </div>
        </div>
        <div class="row mx-0 mb-1">
            <input type="hidden" class="form-control user-select-none" name="mufaCoordenadas"  id="mufaCoordenadas" autocomplete="off" required/>
        </div>`;
        if (floatingModal.classList.contains("d-none")) {
            floatingModal.classList.remove("d-none");
        }
        if (!document.querySelector('#btnFinalizarLinea').classList.contains("d-none")) {
            document.querySelector('#btnFinalizarLinea').classList.add("d-none");
        }
    });
    document.getElementById('btnPoste').addEventListener('click', function () {
        limpiarListeners();
        limpiarObjetos();
        if (!submenuPanel.classList.contains("d-none")) {
            submenuPanel.classList.add("d-none");
        }
        //Mapa
        leftClickListener = map.addListener('click', function(event) {
            marker && marker.setMap(null); // limpiar marcadores
            document.querySelector('#modal-info').innerHTML = 'Coordenadas: <br>Lat: ' + event.latLng.lat() + '<br>Lon: ' +event.latLng.lng();
            document.querySelector('#posteCoordenadas').value = `{lat:${event.latLng.lat()},lon:${event.latLng.lng()}}`;
            document.querySelector('#btnGuardar').disabled = false;
            marker = new google.maps.Marker({
                position: event.latLng,
                map: map,
                draggable: true,
                icon: 'resources/img/poste.png',
                infoWindow: new google.maps.InfoWindow({
                    maxWidth: 300,
                    content: 'Nuevo poste'
                })
            });
            marker.addListener('click', function() {
                this.infoWindow.open(map, this);
            });
            marker.addListener('dragend', function() {
                document.querySelector('#modal-info').innerHTML = 'Coordenadas: <br>Lat: ' + marker.getPosition().lat() + '<br>Lon: ' +marker.getPosition().lng();
                document.querySelector('#posteCoordenadas').value = `{lat:${marker.getPosition().lat()},lon:${marker.getPosition().lng()}}`;
            });
        });
        //Modal
        document.querySelector('#modal-title').innerHTML = 'Agregar Poste';
        document.querySelector('#modal-content').innerHTML = `
        <div class="row mx-0 mb-1">
            <div class="col-6">
                <label for="">Código de Poste:</label>
                <input type="text" class="form-control form-control-sm" id="posteCodigo" name="posteCodigo" placeholder="Código" maxlength="10" required/>
            </div>
            <div class="col-6">
                <label for="">Apoyos:</label>
                <input type="number" class="form-control form-control-sm" id="posteApoyo" name="posteApoyo" placeholder="0" min="0" maxlength="10" required/>
            </div>
        </div>
        <div class="row mx-0 mb-1">
            <div class="col-12">
                <label for="">Propietario:</label>
                <select name="postePropietario" id="postePropietario" class="form-control form-control-sm"required><option value="">Seleccione</option><option value="0">PROPIETARIO</option></select>
            </div>
            <div class="col-6">
                <label for="">Tipo:</label>
                <select name="posteTipo" id="posteTipo" class="form-control form-control-sm" required><option value="">Seleccione</option><option value="0">TIPO</option></select>
            </div>
            <div class="col-6">
                <label for="">Material:</label>
                <select name="posteMaterial" id="posteMaterial" class="form-control form-control-sm" required><option value="">Seleccione</option><option value="0">MATERIAL</option></select>
            </div>
        </div>
        <div class="row mx-0 mb-1">
            <div class="col-3">
                <label for="">F12:</label>
                <input type="number" id="posteF12" name="posteF12" placeholder="0" min="0" maxlength="10" class="form-control form-control-sm" required/>
            </div>
            <div class="col-3">
                <label for="">F12B:</label>
                <input type="number" id="posteF12B" name="posteF12B" placeholder="0" min="0" maxlength="10" class="form-control form-control-sm" required/>
            </div>
            <div class="col-3">
                <label for="">F24:</label>
                <input type="number" id="posteF24" name="posteF24" placeholder="0" min="0" maxlength="10" class="form-control form-control-sm" required/>
            </div>
            <div class="col-3">
                <label for="">F24B:</label>
                <input type="number" id="posteF24B" name="posteF24B" placeholder="0" min="0" maxlength="10" class="form-control form-control-sm" required/>
            </div>
        </div>
        <div class="row mx-0 mb-1">
            <div class="col-3">
                <label for="">F48:</label>
                <input type="number" id="posteF48" name="posteF48" placeholder="0" min="0" maxlength="10" class="form-control form-control-sm" required/>
            </div>
            <div class="col-3">
                <label for="">F48B:</label>
                <input type="number" id="posteF48B" name="posteF48B" placeholder="0" min="0" maxlength="10" class="form-control form-control-sm" required/>
            </div>
            <div class="col-3">
                <label for="">F96:</label>
                <input type="number" id="posteF96" name="posteF96" placeholder="0" min="0" maxlength="10" class="form-control form-control-sm" required/>
            </div>
            <div class="col-3">
                <label for="">F96B:</label>
                <input type="number" id="posteF96B" name="posteF96B" placeholder="0" min="0" maxlength="10" class="form-control form-control-sm" required/>
            </div>
        </div>
        <div class="row mx-0 mb-1">
            <div class="col-3">
                <label for="">F144:</label>
                <input type="number" id="posteF144" name="posteF144" placeholder="0" min="0" maxlength="10" class="form-control form-control-sm" required/>
            </div>
            <div class="col-3">
                <label for="">F144B:</label>
                <input type="number" id="posteF144B" name="posteF144B" placeholder="0" min="0" maxlength="10" class="form-control form-control-sm" required/>
            </div>
        </div>
        <div class="row mx-0 mb-1">
            <input type="hidden" class="form-control user-select-none" name="posteCoordenadas"  id="posteCoordenadas" autocomplete="off" required/>
        </div>`;
        if (floatingModal.classList.contains("d-none")) {
            floatingModal.classList.remove("d-none");
        }
        if (!document.querySelector('#btnFinalizarLinea').classList.contains("d-none")) {
            document.querySelector('#btnFinalizarLinea').classList.add("d-none");
        }
    });
    document.getElementById('btnSplitter').addEventListener('click', function () {
        limpiarListeners();
        limpiarObjetos();
        if (!submenuPanel.classList.contains("d-none")) {
            submenuPanel.classList.add("d-none");
        }
        //Mapa
        leftClickListener = map.addListener('click', function(event) {
            marker && marker.setMap(null); // limpiar marcadores
            document.querySelector('#modal-info').innerHTML = 'Coordenadas: <br>Lat: ' + event.latLng.lat() + '<br>Lon: ' +event.latLng.lng();
            document.querySelector('#splitterCoordenadas').value = `{lat:${event.latLng.lat()},lon:${event.latLng.lng()}}`;
            document.querySelector('#btnGuardar').disabled = false;
            marker = new google.maps.Marker({
                position: event.latLng,
                map: map,
                draggable: true,
                icon: 'resources/img/splitter.png',
                infoWindow: new google.maps.InfoWindow({
                    maxWidth: 300,
                    content: 'Nuevo splitter'
                })
            });
            marker.addListener('click', function() {
                this.infoWindow.open(map, this);
            });
            marker.addListener('dragend', function() {
                document.querySelector('#modal-info').innerHTML = 'Coordenadas: <br>Lat: ' + marker.getPosition().lat() + '<br>Lon: ' +marker.getPosition().lng();
                document.querySelector('#splitterCoordenadas').value = `{lat:${marker.getPosition().lat()},lon:${marker.getPosition().lng()}}`;            
            });
        });
        //Modal
        document.querySelector('#modal-title').innerHTML = 'Agregar Splitter';
        document.querySelector('#modal-content').innerHTML = `
        <div class="row mx-0 mb-1">
            <div class="col-6">
                <label for="">Splitter Padre:</label>
                <select name="splitterPadre" id="splitterPadre" class="form-control form-control-sm"><option value="">Seleccione</option><option value="0">PADRE</option></select>
            </div>
            <div class="col-6">
                <label for="">Código del Splitter:</label>
                <input type="text" class="form-control form-control-sm" id="splitterCodigo" name="splitterCodigo" placeholder="Código" maxlength="10" required/>
            </div>
        </div>
        <div class="row mx-0 mb-1">
            <div class="col-6">
                <label for="">Poste:</label>
                <select name="splitterPoste" id="splitterPoste" class="form-control form-control-sm" required><option value="">Seleccione</option><option value="0">POSTE</option></select>
            </div>
            <div class="col-6">
                <label for="">Hilo de entrada:</label>
                <select name="splitterHiloEntrada" id="splitterHiloEntrada" class="form-control form-control-sm" required><option value="">Seleccione</option><option value="0">HE1</option></select>
            </div>
        </div>
        <div class="row mx-0 mb-1">
            <div class="col-3">
                <label for="">Capacidad:</label>
                <select name="splitterCapacidad" id="splitterCapacidad" class="form-control form-control-sm" required><option value="">Seleccione</option><option value="0">x4</option></select>
            </div>
            <div class="col-3">
                <label for="">Nro:</label>
                <input type="number" class="form-control form-control-sm" id="splitterNro" name="splitterNro" placeholder="0" min="0" maxlength="10" required/>
            </div>
            <div class="col-3">
                <label for="">Pon:</label>
                <select name="splitterPon" id="splitterPon" class="form-control form-control-sm" required><option value="">Seleccione</option><option value="0">z1</option></select>
            </div>
            <div class="col-3">
                <label for="">Nivel:</label>
                <select name="splitterNivel" id="splitterNivel" class="form-control form-control-sm" required><option value="">Seleccione</option><option value="0">z1</option></select>
            </div>
        </div>
        <div class="row mx-0 mb-1">
            <input type="hidden" class="form-control user-select-none" name="splitterCoordenadas"  id="splitterCoordenadas" autocomplete="off" required/>
        </div>`;
        if (floatingModal.classList.contains("d-none")) {
            floatingModal.classList.remove("d-none");
        }
        if (!document.querySelector('#btnFinalizarLinea').classList.contains("d-none")) {
            document.querySelector('#btnFinalizarLinea').classList.add("d-none");
        }
    });
    
    document.getElementById('btnHilo').addEventListener('click', function () {
        limpiarListeners();
        limpiarObjetos();
        if (!submenuPanel.classList.contains("d-none")) {
            submenuPanel.classList.add("d-none");
        }
        let nodeMarker;
        //Mapa
        marker && marker.setMap(null); // limpiar marcadores
        line && line.setMap(null); // limpiar lineas
        leftClickListener = map.addListener('click', function(event) {
            //console.log(`Nodo añadido: ${event.latLng.lat()}, ${event.latLng.lng()}`);
            // if(lineNodes.length > 0){
            //     document.querySelector('#btnGuardar').disabled = false;
            // }
            nodeMarker = new google.maps.Marker({
                position: event.latLng,
                map: map,
                draggable: true,
                icon: 'resources/img/lineNode.png',
                title: `Nodo ${lineNodes.length + 1}`
            });
            nodeMarker.addListener('dragend', function() {
                line.setPath(lineNodes.map(marker => marker.getPosition()));
            });
            lineNodes.push(nodeMarker);
            // Dibuja la línea con los nodos actuales
            if (line) {
                line.setMap(null);
            }
            line = new google.maps.Polyline({
                path: lineNodes.map(marker => marker.getPosition()),
                geodesic: true,
                strokeColor: '#0798ec',
                strokeOpacity: 1.0,
                strokeWeight: 2
            });
            line.setMap(map);
        });
        //Modal
        document.querySelector('#modal-title').innerHTML = 'Agregar Hilo';
        document.querySelector('#modal-content').innerHTML = `
        <div class="row mx-0 mb-1">
            <div class="col-6">
                <label for="">Código de hilo:</label>
                <input type="text" class="form-control form-control-sm" id="hiloCodigo" name="hiloCodigo" placeholder="Código" maxlength="10" required/>
            </div>
            <div class="col-6">
                <label for="">Nivel:</label>
                <select name="hiloNivel" id="hiloNivel" class="form-control form-control-sm"required><option value="">Seleccione</option><option value="0">Nivel</option></select>
            </div>
        </div>
        <div class="row mx-0 mb-1">
            <div class="col-4">
                <label for="">Condición:</label>
                <select name="hiloCondicion" id="hiloCondicion" class="form-control form-control-sm"required><option value="">Seleccione</option><option value="0">Condición</option></select>
            </div>
            <div class="col-4">
                <label for="">Capacidad:</label>
                <input type="number" class="form-control form-control-sm" id="hiloCapacidad" name="hiloCapacidad" placeholder="0.00" min="0" maxlength="10" required/>
            </div>
            <div class="col-4">
                <label for="">Longitud:</label>
                <input type="number" class="form-control form-control-sm" id="hiloLongitud" name="hiloLongitud" placeholder="0.00" min="0" step=".01" maxlength="10" required/>
            </div>
        </div>
        <div class="row mx-0 mb-1">
            <input type="hidden" class="form-control user-select-none" name="hiloCoordenadas"  id="hiloCoordenadas" autocomplete="off" required/>
        </div>`;
        if (floatingModal.classList.contains("d-none")) {
            floatingModal.classList.remove("d-none");
        }
        if (document.querySelector('#btnFinalizarLinea').classList.contains("d-none")) {
            document.querySelector('#btnFinalizarLinea').classList.remove("d-none");
        }
    });
    
    //Finalizar la línea
    document.getElementById('btnFinalizarLinea').addEventListener('click', function () {
        if(lineNodes.length > 1){
            if(confirm('¿Está seguro de que desea guardar? No podrá modificarlo luego de confirmar.')){
                limpiarListeners();
                document.querySelector('#btnGuardar').disabled = false;
                document.querySelector('#btnFinalizarLinea').disabled = true;
                lineNodes.filter(marker => {
                    const marcadorEnLinea = google.maps.geometry.poly.isLocationOnEdge(marker.getPosition(), line);
                    if (marcadorEnLinea) {
                        marker.setMap(null); 
                        return false;
                    }
                    return true;
                });
                //console.log('Coordenadas finales:');
                let coordMsg = '';
                let arrNodes = [];
                line.getPath().getArray().forEach(function(node, index) {
                    coordMsg += `[${index + 1}] Lat: ${node.lat()}, Lon: ${node.lng()}<br>`;
                    arrNodes.push(`{lat:${node.lat()},lon:${node.lng()}}`);
                });
                document.querySelector('#modal-info').innerHTML = 'Coordenadas: <br>' + coordMsg; 
                document.querySelector('#hiloCoordenadas').value = `[${arrNodes.join(',')}]`;            

            }
        }else{
            alert('Debe seleccionar más de un nodo para crear la línea.');
        }
    });

    document.getElementById('btnCancelar').addEventListener('click', function () {
        ocultarPaneles();
        limpiarListeners();
        limpiarObjetos();
    });
    
    document.querySelector('#formRegistrar').addEventListener("submit", (e) => {
        e.preventDefault();
        let formData = new FormData(e.target);
        let formDataObject = {};

        formData.forEach(function(value, key) {
            formDataObject[key] = value;
        });
        let res = JSON.stringify(formDataObject);
        // Mostrar los datos en consola como un objeto JSON
        console.log(res);
        alert(res);
    });
    //CONEXIÓN AL BACKEND ANTIGUO
    const arrayTipoMarcadores = 
    {   
        /*'onu': {funcion: 'listarOnus',     tipo: 'Onu', icono: 'onu.png'},
        'mufa': {funcion: 'listarMufas',    tipo: 'Mufa', icono: 'mufa.png'},
        'poste': {funcion: 'listarPostes',   tipo: 'Poste', icono: 'poste.png'},
        'splitter': {funcion: 'listarSplitters', tipo: 'Splitter', icono: 'splitter.png'}*/
    }
    //const apiUrl = 'http://localhost/googlemap-api/api/listarOnus';
    for(item in arrayTipoMarcadores)
    {
        let apiUrl = arrayTipoMarcadores[item];
        const xhr = new XMLHttpRequest();
        xhr.open('GET', apiUrl.funcion, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        // fetch(`http://localhost/googlemap-api/api/${apiUrl.funcion}`)//pg
        fetch(`http://localhost/red-api/api/${apiUrl.funcion}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            //console.log(apiUrl.funcion,data);
            listaObjetos[apiUrl.tipo] = data;
            // console.log('fetch',listaObjetos);
            let items = '';
            data.forEach( (item) => {
                item.tipo = apiUrl.tipo;
                // console.log(item);
                let elemento_array =  apiUrl.tipo.toLowerCase()+'_id';
                if(!item.hasOwnProperty('icono')) item.icono = apiUrl.icono;
                dibujarMarcador(item);
                // items +=
                // `<a href="javascript:void(0)" class="list-group-item list-group-item-action small border-0 py-1">
                //     <input  type="checkbox" name="${apiUrl.tipo}[${item[apiUrl.tipo.toLowerCase()+'_id']}]" id="${apiUrl.tipo}[${item[apiUrl.tipo.toLowerCase()+'_id']}]" 
                //             onchange="mostrarItem(this,'${apiUrl.tipo}',${item[elemento_array]})" checked><span> ${apiUrl.tipo} ${item.codigo}</span>
                // </a>`;
                items +=
                `<a href="javascript:void(0)" class="list-group-item list-group-item-action small border-0 py-1" onclick="verMarcador('${apiUrl.tipo}',${item[elemento_array]})">
                    <span> ${apiUrl.tipo} ${item.codigo}</span>
                </a>`;
            });
            document.querySelector('#floating-menu-panel').innerHTML += 
            `<div id="floating-submenu-panel-items mb-2 fw-bold border-0" class="list-group">
                <a class="list-group-item list-group-item-action" onclick="mostrarGrupo('grupo_${apiUrl.tipo}')"><span>${apiUrl.tipo} (${data.length})</span></a>
                <div id="grupo_${apiUrl.tipo}">${items}</div>
            </div>`;
        })
        .catch(error => {
            console.error('Fetch error:', error);
            document.querySelector('#floating-menu-panel').innerHTML += 
            `<div id="floating-submenu-panel-items mb-2 fw-bold border-0" class="list-group">
                <a class="list-group-item list-group-item-action small"><span>Ocurrió un error al cargar ${apiUrl.tipo}</span></a>
            </div>`
        });
    }
    //CONEXION A NODEJS
    const arrayListaPrincipal = 
    {   
        'onu': {tipo: 'onu', funcion: '', icono: 'onu.png'}//,
        // 'mufa': {funcion: 'listarMufas',    tipo: 'Mufa', icono: 'mufa.png'},
        // 'poste': {funcion: 'listarPostes',   tipo: 'Poste', icono: 'poste.png'},
        // 'splitter': {funcion: 'listarSplitters', tipo: 'Splitter', icono: 'splitter.png'}
    }
    for(item in arrayListaPrincipal)
    {
        let apiUrl = arrayListaPrincipal[item];
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        fetch(`http://localhost:3001/${apiUrl.tipo}/${apiUrl.funcion}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            //console.log(apiUrl.funcion,data);
            listaObjetos[apiUrl.tipo] = data;
            // console.log('fetch',listaObjetos);
            let items = '';
            data.forEach( (item) => {
                item.tipo = apiUrl.tipo;
                console.log(item);
                let elemento_array =  apiUrl.tipo+'_id';
                /*if(!item.hasOwnProperty('icono'))*/ item.icono = apiUrl.icono;
                dibujarMarcador(item);
                items +=
                `<a href="javascript:void(0)" class="list-group-item list-group-item-action small border-0 py-1" onclick="verMarcador('${apiUrl.tipo}',${item[elemento_array]})">
                    <span> ${apiUrl.tipo} ${item.cliente_nombre}</span>
                </a>`;
            });
            document.querySelector('#floating-menu-panel').innerHTML += 
            `<div id="floating-submenu-panel-items mb-2 fw-bold border-0" class="list-group">
                <a class="list-group-item list-group-item-action" onclick="mostrarGrupo('grupo_${apiUrl.tipo}')"><span>${apiUrl.tipo} (${data.length})</span></a>
                <div id="grupo_${apiUrl.tipo}">${items}</div>
            </div>`;
        })
        .catch(error => {
            console.error('Fetch error:', error);
            document.querySelector('#floating-menu-panel').innerHTML += 
            `<div id="floating-submenu-panel-items mb-2 fw-bold border-0" class="list-group">
                <a class="list-group-item list-group-item-action small"><span>Ocurrió un error al cargar ${apiUrl.tipo}</span></a>
            </div>`
        });
    }
}

function ocultarPaneles(){
    document.querySelectorAll('#formRegistrar [required]').forEach(function(elemento) {
        elemento.removeAttribute('required');
    });
    if (!floatingModal.classList.contains("d-none")) {
        floatingModal.classList.add("d-none");
    }
    if (!menuPanel.classList.contains("d-none")) {
        menuPanel.classList.add("d-none");
    }
    if (!submenuPanel.classList.contains("d-none")) {
        submenuPanel.classList.add("d-none");
    }
}
function limpiarListeners(){
    google.maps.event.removeListener(leftClickListener);
    google.maps.event.removeListener(rightClickListener);
    google.maps.event.removeListener(doubleClickListener);
    google.maps.event.removeListener(dragEndListener);
}
function limpiarObjetos(){
    lineNodes = lineNodes.filter(marker => { // limpiar marcadores encima de las lineas
        if(marker){
            const marcadorEnLinea = google.maps.geometry.poly.isLocationOnEdge(marker.getPosition(), line);
            if (marcadorEnLinea) {
                marker.setMap(null); 
                return false;
            }
            return true;
        }
    });
    line && line.setMap(null); // limpiar lineas
    marker && marker.setMap(null); // limpiar marcadores
    marker = null;
    line = null;
    document.querySelector('#modal-info').innerHTML = '';
    document.querySelector('#btnGuardar').disabled = true;
}
//
function editarRegistro(tipo,id){
    item = {};
    console.log('listaOb',listaObjetos[tipo]);
    if(listaObjetos[tipo].length > 0){
        item = listaObjetos[tipo].filter(x => x.tipo === tipo && x[tipo.toLowerCase()+'_id'] === id)[0];
    }
    switch(tipo){
        case 'Onu':         detalleOnu(item); break;
        // case 'Mufa':        detalleMufa(item); break;
        // case 'Poste':       detallePoste(item); break;
        // case 'Splitter':    detalleSplitter(item); break;
        // case 'Hilo':        detalleHilo(item); break;
    }
}
function dibujarMarcador(marcador){
    mapLayers.push(marcador);
    let contenidoHtml = ``;//Información<br> ${JSON.stringify(marcador)}
    for(let key in marcador){
        contenidoHtml += `<tr><td>${key}:</td><td>${marcador[key]}</td></tr>`;
    }
    console.log('DibujarMarcador',marcador);
    const coordenadas = JSON.parse(marcador.geom);
    console.log('DibujarMarcador',coordenadas);
    const center = new google.maps.LatLng(coordenadas.lat, coordenadas.lon);
    // const center = new google.maps.LatLng(marcador.lat, marcador.lon);
    marker = new google.maps.Marker({
        position: center,
        map: map,
        draggable: false,
        icon:  'resources/img/'+ marcador.icono,
        infoWindow: new google.maps.InfoWindow({
            maxWidth: 400,
            content: `  <div class="m-1">
                            <div class="d-flex justify-content-between">
                                <span>${marcador.tipo}</span>
                                <!-- <button onclick="editarRegistro('${marcador.tipo}',${marcador[marcador.tipo.toLowerCase()+'_id']})" class="btn btn-sm btn-primary mx-1">Editar</button> -->
                            </div>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead><tr><th>Propiedad</th><th>Valor</th></tr></thead>
                                    <tbody>${contenidoHtml}</tbody>
                                </table>
                            </div>
                        </div>`
        })
    });
    marker.addListener('click', function() {
        this.infoWindow.open(map, this);
    });
    map.panTo(center);
}
function verMarcador(tipo,id){
    const item = listaObjetos[tipo].filter(x => x.tipo === tipo && x[tipo.toLowerCase()+'_id'] == id)[0];
    // console.log('verMarcador',listaObjetos[tipo],item)
    const center = new google.maps.LatLng(item.lat, item.lon);
    map.panTo(center);
    map.setZoom(18);
}
function mostrarGrupo(tipo){
    let grupo = document.querySelector(`#${tipo}`);
    if(grupo.classList.contains('show')){
        grupo.classList.remove('show');
        grupo.classList.toggle('hide');
        grupo.style.display = 'block';
        grupo.style.opacity = 1;
    }else{
        grupo.classList.remove('hide');
        grupo.classList.toggle('show');
        grupo.style.display = 'none';
        grupo.style.opacity = 0;
        grupo.style.transition = 'opacity 0.6s linear';
    }
}

function quitarMarcador(marcador){
    console.log(map);
    for (let i = 0; i < map.markers.length; i++) {
        const marcador_ = map.markers[i];
        if (marcador_.getPosition().lat() === marcador.lat && marcador_.getPosition().lng() === marcador.lon) {
            marcador_.setMap(null); 
            map.markers.splice(i, 1); 
            mapLayers.splice(i, 1); 
            break;
        }
    }
}

function mostrarItem(checkbox,tipo,id){
    // console.log(checkbox,tipo,id);
    // console.log(listaObjetos[tipo]);
    const item = listaObjetos[tipo].filter(x => x.tipo === tipo && x[tipo.toLowerCase()+'_id'] === id)[0];
    // console.log('Item encontrado',item);
    if(checkbox.checked){
        console.log('MostrarItem',item.tipo);
        if( ['Onu','Mufa','Poste','Splitter'].includes(tipo)){
            dibujarMarcador(item);
        }
    }else{
        console.log('unchecked');
        quitarMarcador(item);
    }
}

function detalleOnu(data){
    console.log('detalleOnu',data);
    limpiarListeners();
    limpiarObjetos();
    if (!submenuPanel.classList.contains("d-none")) {
        submenuPanel.classList.add("d-none");
    }
    //Mapa
    leftClickListener = map.addListener('click', function(event) {
        marker && marker.setMap(null); // limpiar marcadores
        document.querySelector('#modal-info').innerHTML = 'Coordenadas: <br>Lat: ' + event.latLng.lat() + '<br>Lon: ' +event.latLng.lng();
        document.querySelector('#onuCoordenadas').value = `{lat:${event.latLng.lat()},lon:${event.latLng.lng()}}`;
        document.querySelector('#btnGuardar').disabled = false;
        marker = new google.maps.Marker({
            position: event.latLng,
            map: map,
            draggable: true,
            icon: 'resources/img/onu.png',
            infoWindow: new google.maps.InfoWindow({
                maxWidth: 300,
                content: 'Nueva ONU'
            })
        });
        marker.addListener('click', function() {
            this.infoWindow.open(map, this);
        });
        marker.addListener('dragend', function() {
            document.querySelector('#modal-info').innerHTML = 
            'Coordenadas: <br>Lat: ' + marker.getPosition().lat() + '<br>Lon: ' + marker.getPosition().lng();
            document.querySelector('#onuCoordenadas').value = 
            `{lat:${marker.getPosition().lat()},lon:${marker.getPosition().lng()}}`;            
        });
    });
    //Modal
    document.querySelector('#modal-title').innerHTML = 'Agregar ONU';
    //prueba 
    data.hilo_id = '1';
    data.splitter_id = '2';
    //fin prueba
    document.querySelector('#modal-content').innerHTML = `
    <div class="row mx-0 mb-1">
        <div class="col-6">
            <label for="">Hilo:</label>
            <select name="onuHilo" id="onuHilo" class="form-control form-control-sm"required>
            <option value="">Seleccione</option><option value="${data.hilo_id}">${data.hilo_id}</option></select>
        </div>
        <div class="col-6">
            <label for="">Splitter:</label>
            <select name="onuSplitter" id="onuSplitter" class="form-control form-control-sm"required>
            <option value="">Seleccione</option><option value="${data.splitter_id}">${data.splitter_id}</option></select>
        </div>
    </div>
    <div class="row mx-0 mb-1">
        <div class="col-md-12">
            <label for="">Cliente:</label>
            <select name="onuCliente" id="onuCliente" class="form-control form-control-sm"required>
            <option value="">Seleccione</option><option value="0">Cliente</option></select>
        </div>
        <div class="col-md-12">
            <label for="">Dirección del cliente:</label>
            <input type="text" class="form-control form-control-sm" id="onuDireccionCliente" name="onuDireccionCliente" placeholder="Dirección" maxlength="100" value="${data ? data.id : ''}" required/>
        </div>
    </div>
    <div class="row mx-0 mb-1">
        <div class="col-4">
            <label for="">Velocidad en MB:</label>
            <input type="number" class="form-control form-control-sm" id="onuVelocidad" name="onuVelocidad" placeholder="0.00" min="0" step=".01" maxlength="10" value="${data ? data.id : ''}"required/>
        </div>
        <div class="col-4">
            <label for="">Inicio Contrato:</label>
            <input type="date" class="form-control form-control-sm" id="onuInicioContrato" name="onuInicioContrato" value="${data ? data.id : ''}" required/>
        </div>
        <div class="col-4">
            <label for="">Monto de Pago:</label>
            <input type="number" class="form-control form-control-sm" id="onuMontoPago" name="onuMontoPago" placeholder="0.00" min="0" step=".01" maxlength="10" value="${data ? data.id : ''}" required/>
        </div>
    </div>
    <div class="row mx-0 mb-1">
        <input type="hidden" class="form-control user-select-none" name="onuCoordenadas"  id="onuCoordenadas" autocomplete="off" value="${data ? data.id : 0}" required/>
    </div>`;
    if (floatingModal.classList.contains("d-none")) {
        floatingModal.classList.remove("d-none");
    }
    if (!document.querySelector('#btnFinalizarLinea').classList.contains("d-none")) {
        document.querySelector('#btnFinalizarLinea').classList.add("d-none");
    }
}


