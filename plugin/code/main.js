// GLODBAL VARIABLES

var slideOutVisual;


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


/*
 * Creates the slide-out to display information about the meta-metadata, metadata, and clippings available on the page.
 */
function buildSlideOut(document)
{
	// create new div
	slideOutVisual = document.createElement("div");
	
	// assign propertyies and default styling
	slideOutVisual.className = "slide";
	
	// add new div to the page
	document.body.appendChild(slideOutVisual);
}


/*
 * slides the slideout out
 */
function goOut() 
{
	slideOutVisual.style.right = parseInt(slideOutVisual.style.right)+1 + "px";
}

/*
 * slides the slideout back in
 */
function goIn()
{
	slideOutVisual.style.right = parseInt(slideOutVisual.style.right)-1 + "px";
}


/*
 * Toogles the Slide-Out, by sliding it in or out of view
 */ 
function toggleSlideOut()
{
	var w = document.getElementById("slide");
	var t;
	
	// check to see if the slide-out is open
	if (slideOutVisual.style.right === "0px") { //go in if slideout is out
		
		t = setInterval("goIn()",2);
		
		setTimeout(function() {
			clearInterval(t);
			slideOutVisual.style.right = "-300px";
		},600);
		
		//slideOutVisual.style.right = "-300px"; 
		
	} else { // else, make slideout come out
		
		t = setInterval("goOut()",2);
		
		setTimeout(function() {
			clearInterval(t);
			slideOutVisual.style.right = "0px";
		},600);
		
		//slideOutVisual.style.right = "0px"; 
	}
	
	
}
