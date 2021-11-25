import { statesData } from '../searchbar/StatesJS.js';
import { countiesData } from '../searchbar/CountiesJS.js';


// Global object variables for leaflet map manipulations
var userID;
var map = L.map('map').setView([37.8, -96], 4);
var info = L.control();
var geojson;
var countyMarkers = {};
var maxDate;
var minDate;
var countyData = [0, 0, 0, 0];

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
        document.getElementById('favorites').style.display = "flex";
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

    setUpDatePicker();
}


// Function will load the date picker into the map.
// Dynamically sets the date range so you can't select further back than 28 days ago.
function setUpDatePicker() {
    let max = new Date();
    let min = new Date();
    maxDate = document.createElement("input");
    let errorMsg = document.createElement("h5");
    errorMsg.style.color = "red";
    errorMsg.style.textAlign = "center";
    min.setDate(max.getDate() - 28);
    maxDate.setAttribute("type", "date");
    maxDate.setAttribute("min", `${getDateRange(min)}`);
    maxDate.setAttribute("max", `${getDateRange(max)}`);
    maxDate.setAttribute("id", "maxDate");
    maxDate.value = `${getDateRange(max)}`;
    max.setDate(max.getDate() - 7);
    minDate = maxDate.cloneNode(true);
    minDate.setAttribute("id", "minDate");
    minDate.value = `${getDateRange(max)}`;

    let maxLabel = document.createElement("label");
    let minLabel = document.createElement("label");
    maxLabel.style.color = "red";
    minLabel.style.color = "red";
    let br = document.createElement("br");
    let dateForm = document.createElement("form");
    dateForm.style.display = "flex";
    maxLabel.setAttribute("for", "maxDate");
    maxLabel.innerText = "End Date";
    minLabel.setAttribute("for", "minDate");
    minLabel.innerText = "Start Date";

    let maxDiv = document.createElement("div");
    let minDiv = document.createElement("div");
    maxDiv.appendChild(maxLabel);
    maxDiv.appendChild(br);
    maxDiv.appendChild(maxDate);
    minDiv.appendChild(minLabel);
    minDiv.appendChild(br.cloneNode(true));
    minDiv.appendChild(minDate);
    dateForm.setAttribute("id", "datePicker")
    dateForm.appendChild(minDiv);
    dateForm.appendChild(maxDiv);

    document.getElementsByClassName("leaflet-bottom leaflet-left")[0].appendChild(dateForm);
    document.getElementsByClassName("leaflet-bottom leaflet-left")[0].appendChild(errorMsg);
    document.getElementsByClassName("leaflet-bottom leaflet-left")[0].style["pointer-events"] = "auto";
    max = maxDate.value;
    min = minDate.value;

    minDate.addEventListener("input", (e) => {
        if(minDate.value > maxDate.value) {
            errorMsg.innerText = "Start date must be before end date";
            minDate.value = min;
        }

        else {
            errorMsg.innerText = "";
            min = minDate.value;
            if(document.getElementById("countyStats").style.display == "flex")
                getCountyStats(document.getElementById("countyStats").children[0].name.substr(0, 5));
        }
    });

    maxDate.addEventListener("input", (e) => {
        if(maxDate.value < minDate.value) {
            errorMsg.innerText = "Start date must be before end date";
            maxDate.value = max;
        }

        else {
            errorMsg.innerText = "";
            max = maxDate.value;
            if(document.getElementById("countyStats").style.display == "flex")
                getCountyStats(document.getElementById("countyStats").children[0].name.substr(0, 5));
        }
    });
}


// Function used to convert date format.
function getDateRange(date) {
    let dd = String(date.getDate()).padStart(2, '0');
    let mm = String(date.getMonth() + 1).padStart(2, '0');
    let yyyy = date.getFullYear();
    return (yyyy + '-' + mm + '-' + dd);
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


// Loads in the user's saved favorites from backend database.
function loadUserFavorites() {
    fetch(`http://127.0.0.1:5000/Favorites?id=${userID}`, {method: 'GET'})
    .then(response => {
        if(response.status === 404) 
            return Promise.reject();
        else 
            return response.json();
    })
    .then(data => {
        for(let i = 0; i < data.length; i++) {
            let newFav = document.getElementById("statText").cloneNode(true);
            let newFavBtn = document.getElementsByClassName("editFav")[0].cloneNode(true);
            newFavBtn.innerText = "Remove from favorites";
            newFavBtn.name = data[i]['fips'] + data[i]['start_date'] + data[i]['end_date'];
            newFav.id = newFavBtn.name;
            newFav.classList.add("savedFavs");
            document.getElementById("favorites").appendChild(newFav);
            newFavBtn.addEventListener("click", (e) => removeFromFavorites(e));

            let strData = '<h1><b>' + data[i].name + ', ' + statesData.features.find(state => state.id == String(data[i]['fips']).substr(0, 2)).properties.name + '</b></h1>';
            strData += '<h2 style = "display: inline-block"><b>Population</b>:</h2>&nbsp&nbsp<h2 style = "display: inline-block">' + data[i]['population'] + '</h2><br>';
            strData += '<h2 style = "display: inline-block"><b>Cases</b>:</h2>&nbsp&nbsp<h2 style = "display: inline-block">' + data[i]['cases'] + '</h2><br>';
            strData += '<h2 style = "display: inline-block"><b>Vaccines Initiated</b>:</h2>&nbsp&nbsp<h2 style = "display: inline-block">' + data[i]['vacc_init'] + '</h2><br>';
            strData += '<h2 style = "display: inline-block"><b>Vaccines Completed</b>:</h2>&nbsp&nbsp<h2 style = "display: inline-block">' + data[i]['vacc_comp'] + '</h2><br>';
            strData += '<h2 style = "display: inline-block"><b>Deaths</b>:</h2>&nbsp&nbsp<h2 style = "display: inline-block">' + data[i]['deaths'] + '</h2><br>';
            strData += '<h2 style = "display: inline-block"><b>Start Date</b>:</h2>&nbsp&nbsp<h2 style = "display: inline-block">' + data[i]['start_date'] + '</h2><br>';
            strData += '<h2 style = "display: inline-block"><b>End Date</b>:</h2>&nbsp&nbsp<h2 style = "display: inline-block">' + data[i]['end_date'] + '</h2><br><br>';
            newFav.innerHTML = strData;
            newFav.appendChild(newFavBtn);
        }
    })
    .catch((e) => {});
}


// Fetch backend county data depending on the FIPS.
// Sets the county pop up dialog to the stats found in backend.
function getCountyStats(FIPS) {
    fetch(`http://127.0.0.1:5000/County/${FIPS}`, {method: 'GET'})
    .then(response => {
        if(response.status === 404) 
            return Promise.reject("<h1>Error. No county FIPS found in database.</h1>");
        else 
            return response.json();
    })
    .then(data => {
        let dataRange = [];
        let cases = 0;
        let initiated = 0;
        let completed = 0;
        let deaths = 0;
        
        for(let i = 0; i < data.length; i++) {
            if(String(data[i].date) <= maxDate.value && String(data[i].date) >= minDate.value)
                dataRange.push(data[i]);
        }

        for(let i = 0; i < dataRange.length; i++) {
            cases += dataRange[i].cases;
            initiated += dataRange[i].vaccines_initiated;
            completed += dataRange[i].vaccines_complete;
            deaths += dataRange[i].deaths;
        }

        countyData[0] = initiated;
        countyData[1] = completed;        
        countyData[2] = cases;        
        countyData[3] = deaths;

        let strData = '<h1><b>' + dataRange[0].name + ', ' + statesData.features.find(state => state.id == String(FIPS).substr(0, 2)).properties.name + '</b></h1>';
        strData += '<h2 style = "display: inline-block"><b>Population</b>:</h2>&nbsp&nbsp<h2 style = "display: inline-block">' + dataRange[0].population + '</h2><br>';
        strData += '<h2 style = "display: inline-block"><b>Cases</b>:</h2>&nbsp&nbsp<h2 style = "display: inline-block">' + cases + '</h2><br>';
        strData += '<h2 style = "display: inline-block"><b>Vaccines Initiated</b>:</h2>&nbsp&nbsp<h2 style = "display: inline-block">' + initiated + '</h2><br>';
        strData += '<h2 style = "display: inline-block"><b>Vaccines Completed</b>:</h2>&nbsp&nbsp<h2 style = "display: inline-block">' + completed + '</h2><br>';
        strData += '<h2 style = "display: inline-block"><b>Deaths</b>:</h2>&nbsp&nbsp<h2 style = "display: inline-block">' + deaths + '</h2><br>';
        strData += '<h2 style = "display: inline-block"><b>Start Date</b>:</h2>&nbsp&nbsp<h2 style = "display: inline-block">' + minDate.value + '</h2><br>';
        strData += '<h2 style = "display: inline-block"><b>End Date</b>:</h2>&nbsp&nbsp<h2 style = "display: inline-block">' + maxDate.value + '</h2><br><br>';
        document.getElementById("statText").innerHTML = strData;
    })
    .catch(error => {
        document.getElementById("statText").innerHTML = error;
    })
    .finally(() => {
        document.getElementsByClassName("editFav")[0].name = FIPS + minDate.value + maxDate.value;
        if(document.getElementById("favorites").children.namedItem(FIPS + minDate.value + maxDate.value))
            document.getElementsByClassName("editFav")[0].innerText = "Remove from favorites";
        else
            document.getElementsByClassName("editFav")[0].innerText = "Add to favorites";
            
        document.getElementById('favorites').style.display = "none";
        document.getElementById("countyStats").style.display = "flex";
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
    let newFav = e.path[1].children[2].cloneNode(true);
    let newFavBtn = e.path[1].children[0].cloneNode(true);
    newFav.id = e.target.name;
    newFav.appendChild(newFavBtn);
    newFav.classList.add("savedFavs");
    document.getElementById("favorites").appendChild(newFav);
    newFavBtn.addEventListener("click", (e) => removeFromFavorites(e));

    let fips = e.target.name.substr(0, 5);
    let start = e.target.name.substr(5, 10);
    let end = e.target.name.substr(15, 10);

    fetch(`http://127.0.0.1:5000/Favorites?id=${userID}&fips=${fips}&start=${start}&end=${end}&init=${countyData[0]}
        &comp=${countyData[1]}&cases=${countyData[2]}&deaths=${countyData[3]}`, {method: 'POST'});
}


// Remove a county from the favorites.
function removeFromFavorites(e) {
    console.log(e)
    let removeFav = document.getElementById("favorites").children.namedItem(e.target.name);
    document.getElementById("favorites").removeChild(removeFav);
    let fips = e.target.name.substr(0, 5);
    let start = e.target.name.substr(5, 10);
    let end = e.target.name.substr(15, 10);

    fetch(`http://127.0.0.1:5000/Favorites?id=${userID}&fips=${fips}&start=${start}&end=${end}`, {method: 'DELETE'});
}


// Listen for login button press.
document.getElementById("loginBtn").addEventListener("click", (e) => {
    fetch(`http://127.0.0.1:5000/login?username=${e.path[2][0].value}&password=${e.path[2][1].value}`, {method: 'GET'})
    .then(response => {
        if(response.status === 404) {
            document.getElementById("formMsg").innerText = "Incorrect username/password";
            return Promise.reject();
        }
        else 
            return response.json();
    })
    .then(data => {
        userID = data.id;
        document.getElementById("login").style.display = "none";
        document.getElementById("map").style.display = "flex";
        loadUserFavorites();
        map.invalidateSize();
        
    })
    .catch((e) => {});
});


// Listen for create account button press.
document.getElementById("createAccBtn").addEventListener("click", (e) => {
    fetch(`http://127.0.0.1:5000/login?username=${e.path[2][0].value}&password=${e.path[2][1].value}`, {method: 'POST'})
    .then(response => {
        if(response.status === 404)  {
            document.getElementById("formMsg").innerText = "Username already exists";
            return Promise.reject();
        }
        else 
            return response.json();
    })
    .then(data => {
        userID = data.id;
        document.getElementById("login").style.display = "none";
        document.getElementById("map").style.display = "flex";
        map.invalidateSize();
    })
    .catch((e) => {});
});

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
    if(document.getElementById("favorites").children.namedItem(e.target.name)) {
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