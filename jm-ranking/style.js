let modal = document.querySelector(".modal");
let closeButton = document.querySelector(".close-button");
const titulo =  document.getElementById('usuarioRegistrado'); 
const divCanciones = document.querySelector("#divCanciones");
let JSON_list = [
        {
            "album": "Noche", 
            "css" : "background-color: #000;",
            "canciones":
            [   {"nro":"1","nombre":"Noche de Lluvia","Duración":"2:27"},
                {"nro":"2","nombre":"Lo Sobrenatural","Duración":"2:58"},
                {"nro":"3","nombre":"MCMLXXX","Duración":"4:20"},
                {"nro":"4","nombre":"Grandes Éxitos","Duración":"3:49"},
                {"nro":"5","nombre":"El Ser Supremo","Duración":"4:01"},
                {"nro":"6","nombre":"Noche De Brujas","Duración":"4:27"},
                {"nro":"7","nombre":"Una Nueva Identidad","Duración":"3:33"},
                {"nro":"8","nombre":"Fantasmas","Duración":"3:29"},
                {"nro":"9","nombre":"Noche de baile","Duración":"3:35"},
                {"nro":"10","nombre":"¡Esta Noche es la Reunión!","Duración":"4:25"},
                {"nro":"11","nombre":"Noche de Discoteque","Duración":"4:52"},
                {"nro":"12","nombre":"Sonámbulos","Duración":"3:47"},
                {"nro":"13","nombre":"Natt i Stockholm","Duración":"3:54"}
            ]
        },
        {
            "album": "Psalmos", 
            "css" : "background-color: #16147a;",
            "canciones":
            [   {"nro":"1","nombre":"Lamentable","Duración":"3:53"},
                {"nro":"2","nombre":"Violencia","Duración":"4:21"},
                {"nro":"3","nombre":"Chambelán (Nunca Fui)","Duración":"4:48"},
                {"nro":"4","nombre":"Codependientes","Duración":"4:01"},
                {"nro":"5","nombre":"O Discordia","Duración":"4:03"},
                {"nro":"6","nombre":"Sin Ampersand","Duración":"3:56"},
                {"nro":"7","nombre":"Padre Nuestro","Duración":"4:19"},
                {"nro":"8","nombre":"Tu Dedo Medio","Duración":"3:19"},
                {"nro":"9","nombre":"SSDD","Duración":"3:36"},
                {"nro":"10","nombre":"Cara o Cruz","Duración":"4:05"},
                {"nro":"11","nombre":"La Dama y El Moribundo","Duración":"5:31"},
                {"nro":"12","nombre":"Imposible","Duración":"2:56"}
            ]
        },
        {
            "album": "Carmesí", 
            "css" : "background-color: #932020;",
            "canciones":
            [   {"nro":"1","nombre":"Lunes 28","Duración":"3:53"},
                {"nro":"2","nombre":"Con Ustedes, La Rocola Humana","Duración":"3:40"},
                {"nro":"3","nombre":"Literatura Rusa","Duración":"3:38"},
                {"nro":"4","nombre":"No Como El Filme","Duración":"4:05"},
                {"nro":"5","nombre":"Entre Comillas","Duración":"2:54"},
                {"nro":"6","nombre":"Plural Siendo Singular","Duración":"3:30"},
                {"nro":"7","nombre":"Abril","Duración":"4:31"},
                {"nro":"8","nombre":"Teo, El Gato Persa Rinde Su Declaración","Duración":"3:54"},
                {"nro":"9","nombre":"Puerto Partida (Soy Un Cobarde)","Duración":"4:28"},
                {"nro":"10","nombre":"Sinmigo","Duración":"3:26"},
                {"nro":"11","nombre":"El Mundo De Mi Almohada","Duración":"3:58"},
                {"nro":"12","nombre":"¿A Poco No?","Duración":"3:48"},
                {"nro":"13","nombre":"Siempre Tendremos Dallas","Duración":"4:11"}
            ]
        },
        {
            "album": "Giallo", 
            "css" : "background-color: #B49214;",
            "canciones":
            [   {"nro":"1","nombre":"Quita Esa Cara","Duración":"4:17"},
                {"nro":"2","nombre":"Soy El Diluvio","Duración":"3:04"},
                {"nro":"3","nombre":"Cantar De Gesta","Duración":"3:35"},
                {"nro":"4","nombre":"Quince Mil Días","Duración":"4:00"},
                {"nro":"5","nombre":"Cerraron Chipinque","Duración":"4:22"},
                {"nro":"6","nombre":"La Herida","Duración":"3:44"},
                {"nro":"7","nombre":"A Tu Merced","Duración":"4:20"},
                {"nro":"8","nombre":"Nadie Más Vendrá","Duración":"3:44"},
                {"nro":"9","nombre":"En Vano","Duración":"4:21"},
                {"nro":"10","nombre":"Providencia A La Izquierda","Duración":"4:40"},
                {"nro":"11","nombre":"Documentales","Duración":"3:43"},
                {"nro":"12","nombre":"Siempre Vos","Duración":"3:28"},
                {"nro":"13","nombre":"Lo Dorado Desvanece","Duración":"3:21"}
            ]
        },
        {
            "album": "Alba",
            "css" : "background-color: #797D7F;",
            "canciones":
            [   {"nro":"1","nombre":"Willkommen","Duración":"2:46"},
                {"nro":"2","nombre":"Aún Hay Más","Duración":"2:47"},
                {"nro":"3","nombre":"Los De Septiembre","Duración":"3:18"},
                {"nro":"4","nombre":"La Célula No Explotó","Duración":"2:54"},
                {"nro":"5","nombre":"Caballeros Británicos","Duración":"3:27"},
                {"nro":"6","nombre":"Ahora Y Hoy","Duración":"2:59"},
                {"nro":"7","nombre":"No Lo Cambio Por Nada","Duración":"3:09"},
                {"nro":"8","nombre":"Etrusco Único","Duración":"3:58"},
                {"nro":"9","nombre":"Maldita Rueda","Duración":"4:14"},
                {"nro":"10","nombre":"Carrusel De Adultos","Duración":"3:37"}
            ]
        },
        {
            "album": "Carmesí (Deluxe)",
            "css" : "background-color: #611674;",
            "canciones":
            [   {"nro":"1","nombre":"Lunes 28","Duración":"3:53"},
                {"nro":"2","nombre":"Con Ustedes, La Rocola Humana","Duración":"3:40"},
                {"nro":"3","nombre":"Literatura Rusa","Duración":"3:38"},
                {"nro":"4","nombre":"No Como El Filme","Duración":"4:05"},
                {"nro":"5","nombre":"Entre Comillas","Duración":"2:54"},
                {"nro":"6","nombre":"Plural Siendo Singular","Duración":"3:30"},
                {"nro":"7","nombre":"Abril","Duración":"4:31"},
                {"nro":"8","nombre":"Teo, El Gato Persa Rinde Su Declaración","Duración":"3:54"},
                {"nro":"9","nombre":"Puerto Partida (Soy Un Cobarde)","Duración":"4:28"},
                {"nro":"10","nombre":"Sinmigo","Duración":"3:26"},
                {"nro":"11","nombre":"El Mundo De Mi Almohada","Duración":"3:58"},
                {"nro":"12","nombre":"¿A Poco No?","Duración":"3:48"},
                {"nro":"13","nombre":"Siempre Tendremos Dallas","Duración":"4:11"},
                {"nro":"14","nombre":"Conversaciones Sobre Anatomía","Duración":"4:17"},
                {"nro":"15","nombre":"Sólo un momento","Duración":"4:20"},
                {"nro":"16","nombre":"El Pájaro Vio El Cielo Y Se Voló","Duración":"3:46"},
                {"nro":"17","nombre":"El camino a pie","Duración":"4:25"},
                {"nro":"18","nombre":"Monumental","Duración":"3:23"}
            ]
        },
        {
            "album": "Aurora",
            "css" : "background-color: #9b7023;",
            "canciones":
            [   {"nro":"1","nombre":"Casanova","Duración":"3:29"},
                {"nro":"2","nombre":"Nueva Inglaterra","Duración":"3:21"},
                {"nro":"3","nombre":"Aplaudan en Silencio","Duración":"3:35"},
                {"nro":"4","nombre":"Domingo de Ceniza","Duración":"3:48"},
                {"nro":"5","nombre":"Posa y Sonríe","Duración":"3:13"},
                {"nro":"6","nombre":"Tiempo Compartido","Duración":"3:18"}
            ]
        }
    ];

window.onload = () => {
    console.log(localStorage.getItem('nombre'));
    if(localStorage.getItem('nombre')){
        titulo.innerText = `Hola ${localStorage.getItem('nombre')}`;
        const btnSalir = document.createElement("a");
        btnSalir.id = "btnSalir";
        btnSalir.classList.add("btn","btn-sm","btn-light");
        btnSalir.innerText = 'Salir';
        btnSalir.onclick = () => {
            localStorage.removeItem('nombre');
            localStorage.removeItem('ciudad');
            localStorage.removeItem('edad');
            localStorage.removeItem('sexo');
            console.log(localStorage.getItem('infoUsuario'));
            location.reload();
        }
        document.querySelector('.userName').appendChild(btnSalir);
        //Cargar pestañas
        JSON_list.forEach((album,albumID) =>{
            divCanciones.innerHTML += `<h2 style="text-align:center; margin-top: 40px;">${album.album}</h2>`;
            //Lista
            let newList = document.createElement("ul");
            newList.setAttribute("id", albumID);
            newList.setAttribute("class", "album");
            newList.setAttribute("css", "padding: 0px;");
            album.canciones.forEach( (item) => {
                // console.log(item);
                let newListItem = document.createElement("li");
                newListItem.appendChild(document.createTextNode(item.nombre));
                newListItem.setAttribute("id", item.nro);
                newListItem.setAttribute("class", "draggable");
                newListItem.setAttribute("style", album.css);
                newListItem.setAttribute("draggable", true);
                newList.appendChild(newListItem);
            });
            let newSubmitForm = document.createElement("form");
            newSubmitForm.setAttribute("id", `form_album`);
            newSubmitForm.appendChild(newList);
            newSubmitForm.innerHTML += `<div style="text-align: center"><input type="hidden" id="h_${albumID}" value="${albumID}"><button type="submit" class="btn_submit" onsubmit="guardar(${albumID})">Enviar</button></div>`;
            divCanciones.appendChild(newSubmitForm);
        });
        const guardar = (e) => {
            e.preventDefault();
        };
         //
         var dragSrcEl = null;
         function handleDragStart(e) {
             this.style.opacity = '0.4';  // Change the opacity of the item being dragged
             dragSrcEl = this;
             e.dataTransfer.effectAllowed = 'move';
             e.dataTransfer.setData('text/html', this.innerHTML);
         }
 
         function handleDragOver(e) {
             if (e.preventDefault) {
                 e.preventDefault();  // Prevent the default behavior
             }
             e.dataTransfer.dropEffect = 'move';
             return false;
         }
 
         function handleDrop(e) {
             if (e.stopPropagation) {
                 e.stopPropagation();  // Stop the event from propagating
             }
             if (dragSrcEl != this) {
                 dragSrcEl.innerHTML = this.innerHTML;
                 this.innerHTML = e.dataTransfer.getData('text/html');
             }
             return false;
         }
 
         function handleDragEnd(e) {
             this.style.opacity = '1';  // Reset the opacity of the item being dragged
         }
 
         var items = document.querySelectorAll('li[draggable="true"]');
         items.forEach(function(item) {
             item.addEventListener('dragstart', handleDragStart, false);
             item.addEventListener('dragover', handleDragOver, false);
             item.addEventListener('drop', handleDrop, false);
             item.addEventListener('dragend', handleDragEnd, false);
         });

    }else{
        titulo.innerText = 'Invitado(a)';
        const btnModal = document.createElement("a");
        btnModal.id = "btnRegistro";
        btnModal.classList.add("btn","btn-primary");
        btnModal.innerText = 'Hola, ingresa tu información aquí';
        btnModal.onclick = (event) => {
            console.log(event.target);
            if(event.target === btnModal ){
                modal.classList.toggle("show-modal");
            }
        }
        document.querySelector('.center-container').appendChild(btnModal);
    }
}
closeButton.onclick = () => {
    modal.classList.toggle("show-modal");
}

let formUsuario = document.querySelector("#formUsuario");
formUsuario.onsubmit = (event) =>{
    event.preventDefault();
	const data = new FormData(event.target);
	localStorage.setItem("nombre", data.get("txtNombre"));
	localStorage.setItem("ciudad", data.get("selCiudad"));
	localStorage.setItem("edad", data.get("txtEdad"));
	localStorage.setItem("sexo", data.get("selSexo"));
    alert('OK');
    location.reload();
    // closeButton.click();
}
