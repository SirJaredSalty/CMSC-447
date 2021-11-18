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
    
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", "autocomplete-list");
    
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);
    
        // Loop for each matching county/state substring
        for (i = 0; i < arr.length; i++) {
            /*check if the item starts with the same letters as the text field value:*/
            if (arr[i].county.substr(0, val.length).toUpperCase() == val.toUpperCase() && c != 10) {
                c += 1;
    
                /*create a DIV element for each matching element:*/
                b = document.createElement("DIV");
    
                /*make the matching letters bold:*/
                b.innerHTML = "<strong>" + arr[i].county.substr(0, val.length) + "</strong>";
                b.innerHTML += arr[i].county.substr(val.length) + ", " + arr[i].state;
    
                /*insert a input field that will hold the current array item's value:*/
                b.innerHTML += "<input type='hidden' value='" + arr[i].county + "'>";
    
                /*execute a function when someone clicks on the item value (DIV element):*/
                b.addEventListener("click", function(e) {
                    // insert the value for the autocomplete text field
                    inp.value = this.getElementsByTagName("input")[0].value;
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
                             "state": statesData.features[j].properties.name});
            break;
        }
    }
}

document.getElementsByTagName("form")[0].addEventListener("submit", function(e) {
    e.preventDefault();
});

autocomplete(document.getElementById("searchbarInput"), countyJSON);