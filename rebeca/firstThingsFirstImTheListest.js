var FirstThingsFirst = {};

FirstThingsFirst.PADDING = 8;
FirstThingsFirst.FACET_BAR_WIDTH = 180;
FirstThingsFirst.PADDING = 8;

FirstThingsFirst.items = [];

FirstThingsFirst.createView = function()
{
	FirstThingsFirst.items = [];
	
	var div = document.createElement('div');
		div.className = "listContainer";
		
	REBECA.theStage.appendChild(div);

	// Generate list of papers
	
	FirstThingsFirst.papers = REBECA.papers;
	
	var previousY = 8;

	for(i in FirstThingsFirst.papers)
	{
		var paper = FirstThingsFirst.papers[i];
		
		var visual = FirstThingsFirst.createPaperVisual(paper);
		
		paper.visual = visual;
		
		visual.style.top = (previousY + FirstThingsFirst.PADDING) + "px";
		
		visual.style.left = (FirstThingsFirst.FACET_BAR_WIDTH + FirstThingsFirst.PADDING) + "px";
		
		div.appendChild(visual);
			
		paper.visualHeight = visual.getClientRects()[0].height;
		
		previousY += FirstThingsFirst.PADDING + paper.visualHeight;
		
		div.style.height = (previousY - 16) + "px";
	}	
	
	// generate facet bars
	//FirstThingsFirst.setBar = FirstThingsFirst.createSetBar();
	//FirstThingsFirst.yearBar = FirstThingsFirst.createYearBar();
	//FirstThingsFirst.authorBar = FirstThingsFirst.createAuthorBar();
	//FirstThingsFirst.affiliationBar = FirstThingsFirst.createAffiliationBar();
	//FirstThingsFirst.publisherBar = FirstThingsFirst.createPublisherBar();
	
	
		
	return div;
};

FirstThingsFirst.groupBy = function(fieldName)
{
	
};

FirstThingsFirst.sortBy = function(fieldName)
{
	var sortFunction;
	
	switch(fieldName)
	{
		case "title" :		sortFunction = REBECA.compareBy_title;
							 	break;
							 
		case "readingSet" :	sortFunction = REBECA.compareBy_readingSet;
							 	break;
							 	
		case "year" :		sortFunction = REBECA.compareBy_year;
							 	break;
		
		case "author" :		sortFunction = REBECA.compareBy_author;
							 	break;
							 	
		case "affiliation": sortFunction = REBECA.compareBy_affiliation;
							 	break;
							 	
		case "publisher" :	sortFunction = REBECA.compareBy_publisher;
							 	break;				 	
	}
	
	FirstThingsFirst.papers = FirstThingsFirst.papers.sort(sortFunction);
	
	var previousY = 8;
	
	for(i in FirstThingsFirst.papers)
	{
		var paper = FirstThingsFirst.papers[i];
				
		paper.visual.style.top = (previousY + FirstThingsFirst.PADDING) + "px";
	
		previousY += FirstThingsFirst.PADDING + paper.visualHeight;
	}	
};

FirstThingsFirst.createPaperVisual = function(paper)
{
	var div = document.createElement('div');
		div.className = "paperContainer";
		
	var title = document.createElement('a');
		title.className = "title";
		title.href = paper.location;
		title.target = "_blank";
		title.textContent = paper.title;	
	
	var year = document.createElement('div');
		year.className = "year";
		year.textContent = paper.year;
		
	
	var authors = document.createElement('div');
		authors.className = "authorsContainer";
		
		for(var a in paper.authors)
		{
			var author = document.createElement('div');
				author.className = "author";
				author.textContent = paper.authors[a];
			authors.appendChild(author);
		}
	
	var publisher = document.createElement('div');
		publisher.className = "publisher";
		publisher.textContent = paper.publisher;
	
	div.appendChild(title);
	div.appendChild(year);
	div.appendChild(authors);
	div.appendChild(publisher);
	
	//div.appendChild(affiliations);	
		
	return div;
};