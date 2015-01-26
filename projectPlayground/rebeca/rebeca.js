var REBECA = {};

REBECA.papers = CURATION_PAPERS;
REBECA.authors = CURATION_AUTHORS;

REBECA.initialize = function()
{
	// inits
	REBECA.theStage = document.getElementById("theStage");
	REBECA.loader = document.getElementById("loader");
	
	//init co-authors
	
	// start off with a list view organized by Reading Set
	REBECA.showList();
	
	REBECA.groupBy("readingSet");
	
	REBECA.sortBy("readingSet");
	
	return;
};

REBECA.showList = function()
{
	REBECA.visualizer = FirstThingsFirst;
	
	REBECA.selectButton("list", "view");
	
	REBECA.createView();	
};

REBECA.showTimeline = function()
{
	REBECA.visualizer = TimeAfterTime;

	REBECA.selectButton("timeline", "view");
	
	REBECA.createView();
};

REBECA.createView = function()
{
	// show the loading indicator
	REBECA.loader.style.display = "block";
	
	// clear the stage
	REBECA.theStage.killChildren();
	
	// create the list html	
	REBECA.visualization = REBECA.visualizer.createView();
	
	// add new visualization to the Stage
	//REBECA.theStage.appendChild(REBECA.visualization);
	
	// hide the loading indicator
	REBECA.loader.style.display = "none";
};

REBECA.selectButton = function(buttonName)
{
	
};

REBECA.groupBy = function(fieldName)
{
	REBECA.selectButton(fieldName, "group");
	REBECA.visualizer.groupBy(fieldName);	
};

REBECA.sortBy = function(fieldName)
{
	REBECA.selectButton(fieldName, "sort");
	REBECA.visualizer.sortBy(fieldName);	
};

REBECA.compareBy_title = function(a, b)
{
	return a.title > b.title;
};

REBECA.compareBy_readingSet = function(a, b)
{
	return a.set > b.set;
};

REBECA.compareBy_year = function(a, b)
{
	return a.year <  b.year;
};

REBECA.compareBy_author = function(a, b)
{
	return a.authors[0] > b.authors[0];
};

REBECA.compareBy_affiliation = function(a, b)
{
	return 0;
};

REBECA.compareBy_publisher = function(a, b)
{
	return a.publisher > b.publisher;
};




















/** OVERRIDES and ADDITIONS **/
HTMLDivElement.prototype.killChildren = function()
{
	while (this.hasChildNodes())
	{
	    this.removeChild(this.lastChild);
	}
};
