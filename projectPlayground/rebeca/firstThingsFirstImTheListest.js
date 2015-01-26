var FirstThingsFirst = {};

FirstThingsFirst.PADDING = 8;
FirstThingsFirst.FACET_BAR_WIDTH = 180;
FirstThingsFirst.PADDING = 8;

// COLORS
FirstThingsFirst.FIELD_BACKGROUND = "#85C2A3";
FirstThingsFirst.FIELD_HIGHLIGHT = "#D6EBE0";
FirstThingsFirst.FIELD_SEMI = "#ADD6C2";




FirstThingsFirst.createView = function()
{
	
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
		
		paper.visualTop = (previousY + FirstThingsFirst.PADDING); 
		
		visual.style.top = (previousY + FirstThingsFirst.PADDING) + "px";
		
		visual.style.left = (FirstThingsFirst.FACET_BAR_WIDTH + FirstThingsFirst.PADDING) + "px";
		
		div.appendChild(visual);
			
		paper.visualHeight = visual.getClientRects()[0].height;
		
		previousY += FirstThingsFirst.PADDING + paper.visualHeight;
		
		//REBECA.theStage.style.height = (previousY + 16) + "px";
	}	
	
	FirstThingsFirst.bars = [];
	
	// generate facet bars
	FirstThingsFirst.setBar = FirstThingsFirst.createSetBar();
	FirstThingsFirst.yearBar = FirstThingsFirst.createYearBar();
	FirstThingsFirst.authorBar = FirstThingsFirst.createAuthorBar();
	FirstThingsFirst.publisherBar = FirstThingsFirst.createPublisherBar();
	
	REBECA.theStage.appendChild(FirstThingsFirst.setBar);
	REBECA.theStage.appendChild(FirstThingsFirst.yearBar);
	REBECA.theStage.appendChild(FirstThingsFirst.authorBar);
	REBECA.theStage.appendChild(FirstThingsFirst.publisherBar);
	
	FirstThingsFirst.backdrop = document.createElement('canvas');
	FirstThingsFirst.backdrop.id = "backdrop";
	FirstThingsFirst.backdrop.style.height = (previousY) + "px";
	FirstThingsFirst.backdrop.height = (previousY);
	FirstThingsFirst.backdrop.width = document.body.scrollWidth - 32-32;
	
	FirstThingsFirst.drawAllPaperBars();
	FirstThingsFirst.clearLinks();
	
	div.appendChild(FirstThingsFirst.backdrop);
		
	FirstThingsFirst.listContainer = div;	
		
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
	
	FirstThingsFirst.clearLinks();
	
	FirstThingsFirst.papers = FirstThingsFirst.papers.sort(sortFunction);
	
	var previousY = 8;
	
	for(i in FirstThingsFirst.papers)
	{
		var paper = FirstThingsFirst.papers[i];
			
		paper.visualTop = (previousY + FirstThingsFirst.PADDING);
		paper.visual.style.top = (previousY + FirstThingsFirst.PADDING) + "px";
	
		previousY += FirstThingsFirst.PADDING + paper.visualHeight;
	}	
};

FirstThingsFirst.createPaperVisual = function(paper)
{
	var div = document.createElement('div');
		div.className = "paperContainer";
		
	var title = document.createElement('a');
		title.className = "field fieldHeader field_title";
		title.href = paper.location;
		title.target = "_blank";
		title.textContent = paper.title;
		title.onmouseover = FirstThingsFirst.fieldHover;	
		title.onmouseout = FirstThingsFirst.fieldUnHover;	
	
	var year = document.createElement('span');
		year.className = "field field_year";
		year.textContent = paper.year;
		year.onmouseover = FirstThingsFirst.fieldHover;	
		year.onmouseout = FirstThingsFirst.fieldUnHover;
		
	
	var authors = document.createElement('span');
		authors.className = "authorsContainer";
		
		for(var a in paper.authors)
		{
			var author = document.createElement('span');
				author.className = "field field_author";
				author.textContent = paper.authors[a];
				author.onmouseover = FirstThingsFirst.fieldHover;	
				author.onmouseout = FirstThingsFirst.fieldUnHover;
		
			authors.appendChild(author);
		}
	
	var publisher = document.createElement('span');
		publisher.className = "field field_publisher";
		publisher.textContent = paper.publisher;
		publisher.onmouseover = FirstThingsFirst.fieldHover;	
		publisher.onmouseout = FirstThingsFirst.fieldUnHover;
		
	var set = document.createElement('span');
		set.className = "field field_set";
		set.textContent = paper.set;
		set.onmouseover = FirstThingsFirst.fieldHover;	
		set.onmouseout = FirstThingsFirst.fieldUnHover;
	
	div.appendChild(title);
	div.appendChild(year);
	div.appendChild(authors);
	div.appendChild(publisher);
	div.appendChild(set);
	
	//div.appendChild(affiliations);	
		
	return div;
};

FirstThingsFirst.fieldHover = function(event)
{
	//console.log(event);
			
	var value = event.target.textContent;
	var fieldType = event.target.classList[event.target.classList.length-1];
		
	FirstThingsFirst.clearLinks();
	
	var sameFields = document.getElementsByClassName(fieldType);
	
	// feature the bar
	if(fieldType != "field_title")
		FirstThingsFirst.featureBar(fieldType);	
		
	
	// semi highlight other fields of the same type
	for(var i = 0; i < sameFields.length; i++)
	{
		if(sameFields[i].classList[0] != "item")
			sameFields[i].style.background = FirstThingsFirst.FIELD_SEMI;
		
	}
	
	// full hightlight fields with the same value
	for(var i = 0; i < sameFields.length; i++)
	{
		if(sameFields[i].textContent == value)
		{
			sameFields[i].style.background = FirstThingsFirst.FIELD_HIGHLIGHT;
		
			if(fieldType != "field_title")
			{
				var paper;
				var pVisual = event.target;
				var j = 0;
				
				while(pVisual.className != "paperContainer")
				{
					pVisual = pVisual.parentElement;					
					if(++j > 10) break;
				}
				
				for(var k = 0; k < FirstThingsFirst.papers.length; k++)
				{		
					if(pVisual == FirstThingsFirst.papers[k].visual)
						paper = FirstThingsFirst.papers[k];		
				}
		
				if(sameFields[i].classList[0] == "item")
					FirstThingsFirst.drawStrongLinkFromPaper(paper, sameFields[i]);
			}
		}
	}
	
	// show connection on the sidebar
};

FirstThingsFirst.itemHover = function(event)
{
	//console.log(event);
			
	var value = event.target.textContent;
	var fieldType = event.target.classList[event.target.classList.length-1];
		
	FirstThingsFirst.clearLinks();
	
	var sameFields = document.getElementsByClassName(fieldType);
	
		
	
	// semi highlight other fields of the same type
	for(var i = 0; i < sameFields.length; i++)
	{
		if(sameFields[i].classList[0] != "item")
			sameFields[i].style.background = FirstThingsFirst.FIELD_SEMI;
		
	}
	
	// full hightlight fields with the same value
	for(var i = 0; i < sameFields.length; i++)
	{
		if(sameFields[i].textContent == value)
		{
			sameFields[i].style.background = FirstThingsFirst.FIELD_HIGHLIGHT;
		}
	}
	
	// show connection from the sidebar
	var matchingPapers = FirstThingsFirst.getMatchingPapers(fieldType, value);
	for(var k = 0; k < matchingPapers.length; k++)
	{			
		FirstThingsFirst.drawStrongLinkFromPaper(matchingPapers[k], event.target);
	}
	
};

FirstThingsFirst.semiHighlightMatchingFields = function(fieldName)
{
	var sameFields = document.getElementsByClassName(fieldName);
	
	// semi highlight other fields of the same type
	for(var i = 0; i < sameFields.length; i++)
	{
		sameFields[i].style.background = FirstThingsFirst.FIELD_SEMI;
	}
};

FirstThingsFirst.fieldUnHover = function(event)
{
	FirstThingsFirst.unhighlightAllFields();
	FirstThingsFirst.clearLinks();
};

FirstThingsFirst.unhighlightAllFields = function()
{
	var fields = document.getElementsByClassName("field");
	for(var i = 0; i < fields.length; i++)
	{		
		fields[i].style.background = FirstThingsFirst.FIELD_BACKGROUND;
	}
	
	var items = document.getElementsByClassName("item");
	for(var i = 0; i < items.length; i++)
	{		
		items[i].style.background = FirstThingsFirst.FIELD_BACKGROUND;
	}
};

FirstThingsFirst.createSetBar = function()
{
	var div = document.createElement('div');
		div.className = "bar";
		
		div.onclick = FirstThingsFirst.clickBar;
		
		div.style.right =  (62*3) - 320  + 320+ "px";
		div.style.zIndex =  2;
		
		
	var header = document.createElement('h2');
		header.textContent = "Reading Set";
		// set the width
		
	div.appendChild(header);
	
	var top = 30;
	var height = document.body.scrollHeight - 133;
	
	var items = [];
	
	for(var p in FirstThingsFirst.papers)
	{
		if(items.indexOf(FirstThingsFirst.papers[p].set) == -1)
			items.push(FirstThingsFirst.papers[p].set);
	}
	
	items = items.sort();
	
	var heightPreItem = height / items.length;
	
	for(var i = 0; i < items.length; i++)
	{		
		var item = document.createElement('span');
			item.className = "item field_set";
			item.textContent = items[i];
			
			item.onmouseover = FirstThingsFirst.itemHover;	
			item.onmouseout = FirstThingsFirst.fieldUnHover;	
			
			item.style.top = top + (heightPreItem * i) + 'px';
		
		div.appendChild(item);
	}
	
	FirstThingsFirst.bars.push({
		"name": "field_set",
		"visual": div,
		"order": 1
	});
	
	return div;
};

FirstThingsFirst.createYearBar = function()
{
	var div = document.createElement('div');
		div.className = "bar";
		
		div.onclick = FirstThingsFirst.clickBar;
		
		div.style.right =  (62*3) - 320  + "px";
		div.style.zIndex =  3;
		
	var header = document.createElement('h2');
		header.textContent = "Year";
		// set the width
		
	div.appendChild(header);
	
	
	var top = 30;
	var height = document.body.scrollHeight - 133;
	
	var items = [];
	var max = 2000; 
	var min = 2000;
	
	for(var p in FirstThingsFirst.papers)
	{
		if(FirstThingsFirst.papers[p].year > max)
			max = FirstThingsFirst.papers[p].year;
		
		if(FirstThingsFirst.papers[p].year < min)
			min = FirstThingsFirst.papers[p].year;
	}
	
	for(var i = 0; i < max - min + 1; i++)
	{
		items.push(max - i);
	}

	
	var heightPreItem = height / items.length;
	
	for(var i = 0; i < items.length+1; i++)
	{		
		var item = document.createElement('span');
			item.className = "item field_year";
			item.textContent = items[i];
			
			item.onmouseover = FirstThingsFirst.itemHover;	
			item.onmouseout = FirstThingsFirst.fieldUnHover;
			
			item.style.top = top + (heightPreItem * i) + 'px';
		
		div.appendChild(item);
	}
	
	
	FirstThingsFirst.bars.push({
		"name": "field_year",
		"visual": div,
		"order": 2
	});
	
	return div;
};

FirstThingsFirst.createAuthorBar = function()
{
	var div = document.createElement('div');
		div.className = "bar";
		
		div.onclick = FirstThingsFirst.clickBar;
		
		div.style.right =  (62*2) - 320 + "px";
		div.style.zIndex =  4;
		
	var header = document.createElement('h2');
		header.textContent = "Author";
		// set the width
		
	div.appendChild(header);
	
	var top = 30;
	var height = document.body.scrollHeight - 133;
	
	var items = [];
	
	for(var p in FirstThingsFirst.papers)
	{
		for(var a in FirstThingsFirst.papers[p].authors)
		{
			if(items.indexOf(FirstThingsFirst.papers[p].authors[a]) == -1)
				items.push(FirstThingsFirst.papers[p].authors[a]);
		}
	}
	
	items = items.sort();
	
	var heightPreItem = height / items.length;
	
	for(var i = 0; i < items.length; i++)
	{		
		var item = document.createElement('span');
			item.className = "item field_author";
			item.textContent = items[i];
			
			item.onmouseover = FirstThingsFirst.itemHover;	
			item.onmouseout = FirstThingsFirst.fieldUnHover;
			
			item.style.top = top + (heightPreItem * i) + 'px';
		
		div.appendChild(item);
	}
	
	FirstThingsFirst.bars.push({
		"name": "field_author",
		"visual": div,
		"order": 3
	});
	
	return div;
};

FirstThingsFirst.createPublisherBar = function()
{
	var div = document.createElement('div');
		div.className = "bar";
		
		div.onclick = FirstThingsFirst.clickBar;
		
		div.style.right =  (62*1) - 320 + "px";
		div.style.zIndex =  5;
		
	var header = document.createElement('h2');
		header.textContent = "Publisher";
		// set the width
		
	div.appendChild(header);
	
	var top = 30;
	var height = document.body.scrollHeight - 133;
	
	var items = [];
	
	for(var p in FirstThingsFirst.papers)
	{
		if(items.indexOf(FirstThingsFirst.papers[p].publisher) == -1)
			items.push(FirstThingsFirst.papers[p].publisher);
	}
	
	items = items.sort();
	
	var heightPreItem = height / items.length;
	
	for(var i = 0; i < items.length; i++)
	{		
		var item = document.createElement('span');
			item.className = "item field_publisher";
			item.textContent = items[i];
			
			item.onmouseover = FirstThingsFirst.itemHover;	
			item.onmouseout = FirstThingsFirst.fieldUnHover;
			
			item.style.top = top + (heightPreItem * i) + 'px';
		
		div.appendChild(item);
	}
	
	FirstThingsFirst.bars.push({
		"name": "field_publisher",
		"visual": div,
		"order": 4
	});
	
	return div;
};

FirstThingsFirst.featureBar = function(fieldName)
{
	var firstBar;
	var otherBars = [];
	for(var i = 0; i < FirstThingsFirst.bars.length; i++)
	{		
		var bar = FirstThingsFirst.bars[i];
		if(bar.name == fieldName)
			firstBar = bar;
		else
			otherBars.push(bar);
	}
	
	firstBar.visual.style.right =  (62*3) - 320  + 320+ "px";
	firstBar.visual.style.zIndex =  2;
	
	for(var i = 0; i < otherBars.length; i++)
	{		
		var bar = otherBars[i];
			bar.visual.style.right =  (62 * (3 - i) ) - 320 + "px";
			bar.visual.style.zIndex = 3 + i;
	}
	
};

FirstThingsFirst.clickBar = function(event)
{
	var bar;
	
	for(var i = 0; i < FirstThingsFirst.bars.length; i++)
	{		
		if(event.target == FirstThingsFirst.bars[i].visual)
			bar = FirstThingsFirst.bars[i];		
	}
	
	FirstThingsFirst.featureBar(bar.name);
	
	FirstThingsFirst.unhighlightAllFields();
	FirstThingsFirst.semiHighlightMatchingFields(bar.name);
	
};

FirstThingsFirst.drawAllPaperBars = function()
{
	var ctx = FirstThingsFirst.backdrop.getContext("2d");
	
	for(var i = 0; i < FirstThingsFirst.papers.length; i++)
	{
		var paper = FirstThingsFirst.papers[i];
		ctx.lineWidth="1";
		ctx.fillStyle="green";
		var x = (FirstThingsFirst.FACET_BAR_WIDTH + FirstThingsFirst.PADDING) + 600 - 16;
		var y = paper.visualTop - 16;
		var h = paper.visualHeight;
		
		ctx.rect(x, y, 10, h);
		ctx.fill();
	}
};

FirstThingsFirst.drawStrongLinkFromPaper = function(paper, item)
{
	var ctx = FirstThingsFirst.backdrop.getContext("2d");
	
	ctx.lineWidth="3";
	ctx.strokeStyle="white";

	var x = (FirstThingsFirst.FACET_BAR_WIDTH + FirstThingsFirst.PADDING) + 600 - 16;
	var y = paper.visualTop - 16;
	var h = paper.visualHeight;
	
	var fX = item.getClientRects()[0].left;
		fX = document.body.scrollWidth - 32 -16  -  (62*3) - 320 ;
	
	var fY = item.getClientRects()[0].top - (item.getClientRects()[0].height / 2);
		fY -= 103;//
		fY += FirstThingsFirst.listContainer.scrollTop;
		console.log(FirstThingsFirst.listContainer.scrollTop);
	
	ctx.beginPath();
	
	
	ctx.beginPath();
	ctx.moveTo(x,y);
	ctx.quadraticCurveTo(x, y+(h/2),  fX,fY-1);
	
	ctx.moveTo(fX,fY-1);
	ctx.lineTo(fX,fY+6);
	
	ctx.moveTo(x,y+h);
	ctx.quadraticCurveTo(x, y+(h/2),  fX,fY+6);
	
	ctx.moveTo(x,y+h);
	ctx.lineTo(x,y);	
	ctx.stroke();	

};

FirstThingsFirst.drawWeakLinkFromPaper = function(paper, item)
{
		var ctx = FirstThingsFirst.backdrop.getContext("2d");
	
	ctx.lineWidth="1";
	ctx.strokeStyle="lightgray";

	var x = (FirstThingsFirst.FACET_BAR_WIDTH + FirstThingsFirst.PADDING) + 600 - 16;
	var y = paper.visualTop - 16;
	var h = paper.visualHeight;
	
	var fX = item.getClientRects()[0].left;
		fX = document.body.scrollWidth - 32 -16  -  (62*3) - 320 ;
	
	var fY = item.getClientRects()[0].top - (item.getClientRects()[0].height / 2);
		fY -= 103;//
		fY += FirstThingsFirst.listContainer.scrollTop;
		console.log(FirstThingsFirst.listContainer.scrollTop);
	
	ctx.beginPath();
	
	
	ctx.beginPath();
	ctx.moveTo(x,y);
	ctx.quadraticCurveTo(x, y+(h/2),  fX,fY-1);
	
	ctx.moveTo(fX,fY-1);
	ctx.lineTo(fX,fY+6);
	
	ctx.moveTo(x,y+h);
	ctx.quadraticCurveTo(x, y+(h/2),  fX,fY+6);
	
	ctx.moveTo(x,y+h);
	ctx.lineTo(x,y);	
	ctx.stroke();	
};

FirstThingsFirst.drawWeakLinksForField = function(fieldname)
{
	for(var i = 0; i < FirstThingsFirst.papers.length; i++)
	{
		
	}
};

FirstThingsFirst.clearLinks = function()
{
	FirstThingsFirst.backdrop.height = FirstThingsFirst.backdrop.height;	
	
};

FirstThingsFirst.getMatchingPapers = function(fieldName, value)
{
	var papers = [];
	
	for(var i = 0; i < FirstThingsFirst.papers.length; i++)
	{
		var p = FirstThingsFirst.papers[i];
		if(fieldName == "field_set")
		{
			if(p.set == value)
				papers.push(p);
		}
		else if(fieldName == "field_year")
		{
			if(p.year == value)
				papers.push(p);
		}
		else if(fieldName == "field_publisher")
		{
			if(p.publisher == value)
				papers.push(p);
		}
		else if(fieldName == "field_author")
		{
			for(var a in p.authors)
			{
				if(p.authors[a] == value)
				{
					papers.push(p);
					break;
				}
			}
		}
	}	
	return papers;
};




























