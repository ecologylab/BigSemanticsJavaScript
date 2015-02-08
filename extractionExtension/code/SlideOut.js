/**
 * Creates the slide-out to display information about the meta-metadata, metadata, and clippings available on the page.
 */
function buildSlideOut(document)
{
	// create new div
	slideOutVisual = document.createElement("div");
	
	// assign propertyies and default styling
	slideOutVisual.className = "ideaMache_slide";
	
	// add new div to the page
	document.body.appendChild(slideOutVisual);
}

/**
 * Toogles the Slide-Out, by sliding it in or out of view
 */ 
function toggleSlideOut()
{
	if(slideOutVisual == null)
		buildSlideOut();

	// check to see if the slide-out is open
	if (parseInt(slideOutVisual.style.width) > 0)
	{
		//go in if slideout is out
		goIn();
	}
	else
	{
		// else, make slideout come out
		goOut();
	}	
}

/**
 * slides the slideout out
 */
function goOut() 
{
	slideOutVisual.style.width = SLIDEOUT_WIDTH + "px";
	slideOutVisual.style.boxShadow = "6px 0 16px 5px #888";
}

/**
 * slides the slideout back in
 */
function goIn()
{
	slideOutVisual.style.width = 0 + "px";
	slideOutVisual.style.boxShadow = "none";
}

