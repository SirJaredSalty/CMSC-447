import { statesData } from './StatesJS.js';
import { countiesData } from './CountiesJS.js';

function autocomplete(inp, arr) {
    // Execute a function when someone writes in the text field
    inp.addEventListener("input", function(event) {
        var a, b, i, c = 0, val = this.value;
    
        // Close any already open lists of autocompleted values
        closeAllLists();
        if (!val) { 
            return false;
        }
    
        // create a DIV element that will contain the items (values)
        a = document.createElement("DIV");
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
                b = document.createElement("DIV");
    
                // Make the matching letters bold
                b.innerHTML = "<strong>" + searchStr.substr(0, val.length) + "</strong>";
                b.innerHTML += searchStr.substr(val.length);
    
                // insert a input field that will hold the current FIPS code
                b.innerHTML += "<input type='hidden' value='" + arr[i].FIPS + "'>";
    
                // Execute a function when someone clicks on the item value (DIV element)
                b.addEventListener("click", function(e) {
                    inp.value = "";
                    document.getElementById("FIPS-input").value = this.getElementsByTagName("input")[0].value;
                    document.getElementById("FIPS-input").dispatchEvent(new Event('input'));
                    closeAllLists();
                });
    
                a.appendChild(b);
            }
        }
    });
}

// Close all autocomplete lists in the document
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
            let LSAD = countiesData.features[i].properties.LSAD;
            countyJSON.push({"county": countiesData.features[i].properties.NAME + " " + 
                             LSAD.charAt(0).toUpperCase() + LSAD.slice(1), 
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