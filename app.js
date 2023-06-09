/** Set-up del mapa */
var map = L.map('map').setView([4.570868, -74.297333], 6);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom: 5,
    maxZoom: 15,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const options = {
    draggable : true
}
/** Definicion de variables */
const imprimiendoDB = document.querySelector(".imprimiendoDB");
let retornoPLaceholder;
let DB;
let marcadores = [];
let nombres = [];
let geoDato = [];

window.onload = () => {
    console.log("Documento Listo");

    /*Evento del mapa */
    map.on("click", mapaTest);

    crearDB();
}

/** Tooltip para ver coordenadas */
var popup = L.popup({
    offset: [0, -30]
});

function onMapToolTip(e) {
    let nombreTooltip = nombres.filter( datoNombre => datoNombre.id == e.target._leaflet_id);
    
    popup
    .setLatLng(e.latlng)
    .setContent(`<b style='font-size: small;'> ${nombreTooltip[0].nombre} - ${e.latlng.toString()}</b>`)
    .openOn(map);
}

/*Funcion para poner marcadores */
function mapaTest(e){
    /**Tomando los datos */
    coord1 = e.latlng.lat;
    coord2 = e.latlng.lng;

    /**Poniedo marcador */
    let marker2;

    marker2 = L.marker([coord1, coord2]).addTo(map);
    marcadores = [...marcadores, marker2]

    const infoCoord = {
        lat: coord1,
        long: coord2,
        id: marker2._leaflet_id
    }

    llenandoTabla(marcadores)

    /** Evento del marcador con tooltip */
    marker2.on("mouseover", onMapToolTip) 
    
    /*removiendo marcadores */
    marker2.on("click", (a) => {
        let borrarMarcador = marcadores.filter( geoDato => geoDato._leaflet_id == marker2._leaflet_id);

        map.removeLayer(borrarMarcador[0]);
        nombres = [];

        marcadores = marcadores.filter( geoDato => geoDato._leaflet_id != marker2._leaflet_id);

        llenandoTabla( marcadores );
        console.log(datosGeograficos);
    });

    /** Borrar dato desde X de la tabla */
    const tabla = document.querySelector(".tabla__puntos-mapa");
    tabla.addEventListener("click", (e) => {
        e.preventDefault;
        if(e.target.classList.contains("borrar-geoDato") ){

            const datoId = e.target.id;
            
            let marcadorBorrar = marcadores.filter( geoDato => geoDato._leaflet_id == datoId);

            marcadores = marcadores.filter( geoDato => geoDato._leaflet_id != datoId);
            llenandoTabla( marcadores );

            map.removeLayer(marcadorBorrar[0]);
            nombres = [];
        }
    });
}

/**Funcion del text */
function blur(e, inputText){

    const datoNombre = {
        nombre: e.target.value,
        id: e.target.id,
        latitud: e.target.classList[1],
        longitud: e.target.classList[2]
    }
    nombres = [...nombres, datoNombre];

    const formulario = document.querySelector("#formulario");
    formulario.addEventListener("submit", nuevoGeoDato);

    function nuevoGeoDato(e){
        e.preventDefault();

        const geoMarcadorDB = {
            nombre: datoNombre.nombre,
            id: Date.now(),
            latitud: datoNombre.latitud,
            longitud: datoNombre.longitud
        }

        /** Insertar registro en IndexedDB */
        const transaction = DB.transaction(["geo"], "readwrite");

        /** Habilitando el objectStore*/
        const objectStore = transaction.objectStore("geo");

        /** Insertando en la DB*/
        let request = objectStore.add(geoMarcadorDB);

        request.onsuccess = function(){
            console.log("GEODATO agregado al almacén", request.result);
        };

        request.onerror = function() {
            console.log("Error", request.error);
        };

        transaction.oncomplete = function(){
            console.log("GEODATO Agregado");
        };
    }

    console.log(nombres);

}

/** Funcion para llenar la tabla */
function llenandoTabla( datos ){
    const tBody = document.querySelector("tbody");

    // Limpiar HTML
    limpiarHTML();

    // Recorriendo el Objeto de datos geograficos
    datos.forEach( geoDato => {

        const row = document.createElement("tr");
        
        const td1 = document.createElement("td");
        td1.textContent = geoDato._latlng.lat;

        const td2 = document.createElement("td");
        td2.textContent = geoDato._latlng.lng;

        const div = document.createElement("div")
        div.style.border = "1px solid grey";
        const td3 = document.createElement("td");
        const inputText = document.createElement("input");
        inputText.type = "text";
        inputText.placeholder = "Escribe aqui el nombre";
        inputText.classList.add("textArea", geoDato._latlng.lat, geoDato._latlng.lng);
        inputText.id = geoDato._leaflet_id
        inputText.autocomplete = "off"

        inputText.onblur = function(e, inputText){
             blur(e, inputText);
        }

        td3.appendChild(inputText);

        const td4 = document.createElement("td");
        const a = document.createElement("a");
        a.href = "javascript:void(0)";
        a.classList.add("borrar-geoDato");
        a.id = geoDato._leaflet_id;
        a.style.color = "#A830F2";
        a.style.textDecoration = "none";
        a.style.fontSize = "x-large"
        a.textContent = "X";
        td4.appendChild(a);

        div.appendChild(td3);

        row.appendChild(td1);
        row.appendChild(td2);
        row.appendChild(div);
        row.appendChild(td4);

        // LLenando la tabla
        tBody.appendChild(row);
    });
};

function limpiarHTML(){
    const tBody = document.querySelector("tbody");
    tBody.innerHTML = "";
}

const btnLimpiarTabla = document.querySelector(".button-vaciar");

btnLimpiarTabla.addEventListener("click", () => {
    marcadores.forEach( marker => map.removeLayer(marker))

    marcadores = [];
    llenandoTabla( marcadores )
});

function crearDB(){
    /** Creando la base de datos en version 1.0 */
    const crearDB = window.indexedDB.open("geo", 1);

    /** Si hay un error */
    crearDB.onerror = function(){
        console.log("hubo un error");
    }

    /** Si todo sale bien*/
    crearDB.onsuccess = function(){
        console.log("BD Creada - onsucces");
        DB = crearDB.result;
        console.log(DB);

        /** Mostrar citas al cargar con INDEXED DB ya listo */
        imprimirGeoDatos();
    }

    /** Definiendo el schema */
    crearDB.onupgradeneeded = function(e){
        const db = e.target.result;

        const objectStore = db.createObjectStore("geo", {
            keyPath: "geo",
            autoIncrement: true
        });

        /** Definiendo todas las columnas */
        objectStore.createIndex("latitud", "latitud", { unique: false});
        objectStore.createIndex("longitud", "longitud", { unique: false});
        objectStore.createIndex("nombre", "nombre", { unique: true});
        objectStore.createIndex("id", "id", { unique: false});

        console.log("DB creada y lista");
    }
};

function imprimirGeoDatos(){

    /** Leer el contenido de la base de datos */
    const objectStore = DB.transaction("geo").objectStore("geo");
    
    objectStore.openCursor().onsuccess = function(e){

        const cursor = e.target.result;

        if(cursor){
            const h2 = document.createElement("h2");
            h2.textContent = e.target.result.value.nombre;
            h2.style.marginBottom = 0;

            const div1 = document.createElement("div");
            div1.textContent = `Latitud: ${e.target.result.value.latitud}`;
            
            const div2 = document.createElement("div");
            div2.textContent = `Longitud: ${e.target.result.value.longitud}`;

            const linea = document.createElement("hr");
            imprimiendoDB.appendChild(h2);
            imprimiendoDB.appendChild(div1);
            imprimiendoDB.appendChild(div2);
            imprimiendoDB.appendChild(linea);

            /** Al siguiente elemento */
            cursor.continue();
        }
    }
};