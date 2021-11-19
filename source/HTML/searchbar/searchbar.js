import { statesData } from './StatesJS.js';
import { countiesData } from './CountiesJS.js';

// Creates the suggested dropdown from the searchbar when typing 
function autocomplete(inp, arr) {

    // Listen for when the searchbar is being typed into
    inp.addEventListener("input", function(event) {
        var a, b, i, c = 0, val = this.value;
    
        // Close any already open lists of autocompleted values
        closeAllLists();
        if (!val) { 
            return false;
        }
    
        // Create a div element that will contain the county dropdowns
        a = document.createElement("div");
        a.setAttribute("id", "autocomplete-list");
    
        // Append the DIV element as a child of the autocomplete container
        this.parentNode.appendChild(a);
    
        // Loop for each matching county/state substring
        for (i = 0; i < arr.length; i++) {
            let searchStr = arr[i].county + ", " + arr[i].state;

            // Check if the County/State starts with the same letters as the text field value
            if (searchStr.substr(0, val.length).toUpperCase() == val.toUpperCase() && c != 10) {
                c += 1;
    
                // Create a DIV element for each matching element:
                b = document.createElement("div");
    
                // Make the matching letters bold
                b.innerHTML = "<strong>" + searchStr.substr(0, val.length) + "</strong>";
                b.innerHTML += searchStr.substr(val.length);
    
                // Insert a input field that will hold the current FIPS code
                b.innerHTML += "<input type='hidden' value='" + arr[i].FIPS + "'>";
    
                // Listen for when a county is selected from the dropdown
                b.addEventListener("click", function(e) {
                    inp.value = "";
                    document.getElementById("FIPS-input").value = this.getElementsByTagName("input")[0].value;
                    document.getElementById("FIPS-input").dispatchEvent(new Event('input'));
                    closeAllLists();
                });
    
                // Append the autocomplete dropdown to the parent div autocomplete-list
                a.appendChild(b);
            }
        }
    });
}

// Close all autocomplete county lists in the document
function closeAllLists() {
    var x = document.getElementById("autocomplete-list");
    if (!x) {
        return false;
    }

    x.remove();
}

// Get county data for searchbar
var countyJSON = [];
for(let i = 0; i < countiesData.features.length; i++) {
    let stateFIPS = countiesData.features[i].properties.STATE;
    for(let j = 0; j < statesData.features.length; j++) {
        if(statesData.features[j].id == stateFIPS) {
            countyJSON.push({"county": countiesData.features[i].properties.NAME + " " + 
                             countiesData.features[i].properties.LSAD,
                             "state": statesData.features[j].properties.name,
                             "FIPS": countiesData.features[i].properties.GEO_ID.slice(9)
            });

            break;
        }
    }
}

// Don't let the input search form to be submitted 
document.getElementsByTagName("form")[0].addEventListener("submit", function(e) {
    e.preventDefault();
});

// Start the function
autocomplete(document.getElementById("searchbarInput"), countyJSON);