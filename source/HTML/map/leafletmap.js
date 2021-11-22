import { statesData } from '../searchbar/StatesJS.js';
import { countiesData } from '../searchbar/CountiesJS.js';


// Global object variables for leaflet map manipulations
var map = L.map('map').setView([37.8, -96], 4);
var info = L.control();
var geojson;
var countyMarkers = {};
var favorites = [];

// Loads the basic map structure with state and county geometry.
// Also adds various event listeners.
function loadMap() {
    document.getElementsByClassName("leaflet-control-attribution leaflet-control")[0].remove();

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94' +
                'IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        id: 'mapbox/satellite-v9',
        tileSize: 512,
        zoomOffset: -1
    }).addTo(map);

    // Add a home button
    L.easyButton('fa-crosshairs fa-lg', function() {
        map.setView([37.8, -96], 4);
    }).addTo(map);

    // Add a favorites button
    L.easyButton('fa-star fa-lg', function() {
        document.getElementById("countyStats").style.display = "none";
        document.getElementById('favorites').style.display = "block";
        map.scrollWheelZoom.disable();
        map.doubleClickZoom.disable();
    }).addTo(map);

    // Load state outlines
    geojson = L.geoJson(statesData, {
        style: style
    }).addTo(map);
    
    // Load county outlines
    geojson = L.geoJson(countiesData, {
        style: style,
        onEachFeature: onEachFeature
    }).addTo(map);
}


// Function relating to setting/changing the box displaying currently hovered county.
function mapHover() {

    // Initialize the bottom right box displaying current county hovered
    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info', document.getElementsByClassName("leaflet-bottom leaflet-right")[0]);
        this.update();
        document.getElementsByClassName("leaflet-bottom leaflet-right")[0].appendChild(document.getElementsByClassName("info leaflet-control")[0]);
        return this._div;
    };

    // Update the current county being hovered
    info.update = function (props) {
        if(props) {
            let state = statesData.features.find(s => s.id == props.STATE);
            state = state.properties.name
            this._div.innerHTML = '<h4>Currently Hovering:</h4>' + '<b>' + props.NAME + " " + props.LSAD + ", " + state;
        }

        else {
            this._div.innerHTML = '<h4>Currently Hovering:</h4>' + 'None';
        }
    };

    info.addTo(map);
}


// Styling of the state and county outlines/fill colors
function style(feature) {
    return {
        weight: feature.properties.GEO_ID ? 0.7 : 1.7,
        opacity: feature.properties.GEO_ID ? 0.3: 10,
        color: feature.properties.GEO_ID ? 'white' : 'red',
        dashArray: feature.properties.GEO_ID ? '5' : '1',
        fillOpacity: feature.properties.GEO_ID ? 0.3: 10,
        fillColor: feature.properties.GEO_ID ? '#90ee90' : 'null'
    };
}


// Function that keeps track is mouse is hovered over a county
function highlightFeature(e) {
    var layer = e.target;

    // Set style of hovered county
    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    // Call the update function to change the currently hovered county box
    info.update(layer.feature.properties);
}


// Function called when the mouse is no longer hovered on the current county
function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}


// Fetch backend county data depending on the FIPS.
// Sets the county pop up dialog to the stats found in backend.
function getCountyStats(FIPS) {
    fetch(`http://127.0.0.1:5000/County/${FIPS}`, {method: 'GET'})
    .then(response => {
        if(response.status === 404) 
            return Promise.reject("Error. No county FIPS found in database.");
        else 
            return response.json();
    })
    .then(data => {
        let latestData = data[data.length - 4];
        let strData = "Latest Date: " + latestData.date + "\n\nCounty & State: " + latestData.name + ", " + 
                latestData.state + "\n\nPopulation: " + latestData.population + "\n\nCases: " + latestData.cases + 
                "\n\nVaccines Initiated: " + latestData.vaccines_initiated + "\n\nVaccines Completed: " + latestData.vaccines_complete;
        document.getElementById("statText").innerText = strData;
    })
    .catch(error => {
        document.getElementById("statText").innerText = error;
    })
    .finally(() => {
        document.getElementsByClassName("editFav")[0].name = FIPS;
        if(favorites.includes(FIPS))
            document.getElementsByClassName("editFav")[0].innerText = "Remove from favorites";
        else
            document.getElementsByClassName("editFav")[0].innerText = "Add to favorites";
            
        document.getElementById('favorites').style.display = "none";
        document.getElementById("countyStats").style.display = "block";
    });
}


// When a county is clicked zoom in on it and open the dialog box.
// Also place down a marker where a county was clicked/searched.
function openStats(e) {
    let msg = e.target.feature.properties.NAME + " " + e.target.feature.properties.LSAD;
    let FIPS = e.target.feature.properties.GEO_ID.slice(9);
    let marker = new L.Marker(e.target.getBounds().getCenter());

    // Add marker to map and zoom in
    map.addLayer(marker);
    marker.bindPopup(`<h5><b>${msg}</b></h5><button id = "marker${FIPS}">Delete marker</button>`).openPopup();
    map.fitBounds(e.target.getBounds(), {maxZoom: 6});
    getCountyStats(FIPS);

    // Remove marker from map if county already has a marker
    if(countyMarkers[`marker${FIPS}`])
        map.removeLayer(countyMarkers[`marker${FIPS}`]);

    // Add marker property to countyMarkers object
    countyMarkers[`marker${FIPS}`] = marker;

    // Check if remove marker button is clicked
    document.addEventListener("click", function(e) {
        if(String(e.path[0].id).substr(0, 6) == "marker" && countyMarkers[String(e.path[0].id)]) {
           map.removeLayer(countyMarkers[String(e.path[0].id)]);
           delete countyMarkers[String(e.path[0].id)];
        }
    });

    map.doubleClickZoom.disable();
}


// Each layer (a county outline on the map) can be moused over/out, and clicked for various events
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: openStats
    });

    layer._leaflet_id = feature.properties.GEO_ID.slice(9);
}


// Add a county to the favorites.
function addToFavorites(e) {
    let newFav = e.path[1].children[0].cloneNode(true);
    let newFavBtn = e.path[1].children[1].cloneNode(true);
    newFav.id = e.target.name;
    newFav.appendChild(newFavBtn);
    newFav.classList.add("savedFavs");
    document.getElementById("favorites").appendChild(newFav);
    favorites.push(newFav.id);
    newFavBtn.addEventListener("click", (e) => removeFromFavorites(e));
}


// Remove a county to the favorites.
function removeFromFavorites(e) {
    favorites = favorites.filter(f => f != e.target.name);
    let removeFav = document.getElementById("favorites").children.namedItem(e.target.name);
    document.getElementById("favorites").removeChild(removeFav);
}


// Disable dragging of the map if cursor is hovered over the searchbar
document.onmousemove = function(event) {
    event.target.id == "searchbarInput" ?  map.dragging.disable() : map.dragging.enable();
}

// When someone selects a county from the searchbar zoom in on the area
document.getElementById("FIPS-input").addEventListener("input", function(e) {            
    geojson.getLayer(e.target.value).fireEvent('click');
});

// Close the stats menu when exit button is clicked
document.getElementById("exitStats").addEventListener("click", function(e) {
    document.getElementById("countyStats").style.display = "none";
    map.doubleClickZoom.enable();
});

// Close the favorites menu when exit button is clicked
document.getElementById("exitFav").addEventListener("click", function(e) {
    document.getElementById("favorites").style.display = "none";
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();
});

// Listen for when county is added/removed from favorites
document.getElementsByClassName("editFav")[0].addEventListener("click", function(e) {
    if(favorites.includes(e.target.name)) {
        document.getElementsByClassName("editFav")[0].innerText = "Add to favorites";
        removeFromFavorites(e);
    }

    else {
        document.getElementsByClassName("editFav")[0].innerText = "Remove from favorites";
        addToFavorites(e);
    }
});


// Start script
loadMap();
mapHover();