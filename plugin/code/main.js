// GLODBAL VARIABLES
var slideOutVisual;
var SLIDEOUT_WIDTH = 320;

window.onload = setup(document);


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    toggleSlideOut();
  });


/*
 * Sets up the plugin.
 * Should be called when the webpage has loaded
 */
function setup(document)
{
	// create the the 'slide-out'
	buildSlideOut(document);
}
