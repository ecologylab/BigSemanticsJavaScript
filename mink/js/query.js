function toGScholarUrl(searchString){
	var terms = searchString.split(" ");
	var url = "http://scholar.google.com/scholar?q=";
	for (var x in terms){
		url += terms[x];
		url += "+";
	}
    encodeURI(url);
    console.log(url);
    return url;
}


function Query(query, engines, parentID){
	this.query = query;
	this.engines = engines;
	this.urls = [];
	this.contextTitle = "";
	if(!engines){
		this.urls = [query];
	}
	else{
		for (var i = 0; i < engines.length; i++){
			if(engines[i] == 'google_scholar'){
				this.urls.push(toGScholarUrl(query));
			}
		}
		this.contextTitle = query;

	}
	
	this.uuid = generateUUID();
	this.parentID = parentID;
	this.childQueries = [];
	this.pileMap = new Map();
	this.leftMostCol = 1;
	this.columns = [];
	minkApp.queryMap.put(this.uuid, this);
	this.addToHistory();
}


Query.prototype.buildQuery = function(parent){
	
	var queryCont = buildDiv('minkQuery');
	
	queryCont.addEventListener('mouseenter', minkApp.queryHighlight);
	queryCont.addEventListener('mouseleave', minkApp.queryUnhighlight);
	var qData = buildDiv('queryData');
	qData.addEventListener('click', minkApp.restoreQueryFromHistory);
	var qButton = buildDiv('minkNewQueryButton');
	qButton.addEventListener('click', minkApp.newQueryBox);
	queryCont.id = this.uuid;
	qData.innerHTML = this.query;
	var qbIcon = document.createElement('img');
	qbIcon.src = "./img/plus.svg";
	qbIcon.className = 'minkNewIcon';
	qButton.appendChild(qbIcon);
	queryCont.appendChild(qData);
	queryCont.appendChild(qButton);
	parent.appendChild(queryCont);
	
}

Query.prototype.addToHistory = function(){
	var queryHolder = $('#minkQueries')[0];
	if(this.parentID){
		//todo
		var parentHTML = $(('#' + this.parentID)).next()[0];
		this.buildQuery(parentHTML);

	}else{
		this.buildQuery(queryHolder);
	}
	
}