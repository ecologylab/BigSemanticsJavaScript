/** Global Variables **/
var hasMetadata = false;
var metadata = {};
var settings = {};
var selectionListener = false;


// Retrieve the extension settings from the the background page.
chrome.extension.sendRequest({loadOptions: "all"}, function(response) {
  settings = response;
});


// Calls the windw.onload function after 1 second, this is to ensure that the onload function is called on the page.
setTimeout(window.onload, 1000);
window.addEventListener("message", function(event) {
    // We only accept messages from ourselves
    if (event.source != window)
      return;
    if (event.data.type && (event.data.type == "EXPANSION_EVENT")) {
    //  console.log("Content script received: " + event.data.text);
	chrome.extension.sendRequest({append_to_log: "yes", type:"incontext_expand_crumb", item: event.data.text}, function(response) {
	});
      
      //port.postMessage(event.data.text);
    }
}, false);



window.onload = function() {
	//console.log("On load version 1.00005");
}

