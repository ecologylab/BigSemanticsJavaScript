var MONA = {};
var cachedMMD = "";
cachedNodeMetadata = {};
var nodeColors = {};
var nodes = {};
var nodeMetadata = {};
var nodePositions = {};
var typePositions = {};
var colorCount = 0;
var requestsMade = 0;
var tier4size = 10;
var tier3size = 20;
var tier2size = 30;
var tier1size = 40;
var colorArray = ["#009933","#006699","#CC9900","#CC0000","#CC00CC"]

function Node (type, title, location, mmdName){
	this.type = type;
	this.title = title;
	this.abbrevTitle = title.substring(0,29) + "...";
	this.location = location;
	this.mmdName = mmdName;
} 

MONA.initialize = function(){
	//cachedMMD = "";
	cachedNodeMetadata = {};
	nodeColors = {};
	nodes = {};
	nodeMetadata = {};
	nodePositions = {};
	typePositions = {};
	colorCount = 0;
	requestsMade = 0;
	var graphElement = document.getElementById("graphArea");
	while (graphElement.firstChild) {
    	graphElement.removeChild(graphElement.firstChild);
	}
	var typeElement = document.getElementById("typeArea");	
	while (typeElement.firstChild) {
    	typeElement.removeChild(typeElement.firstChild);
	}
	var linesElement = document.getElementById("lineSVG");	
	while (linesElement.firstChild) {
    	linesElement.removeChild(linesElement.firstChild);
	}
	var nodesLoading = document.createElement('div');
	nodesLoading.innerHTML = "Loading Nodes...";
	graphElement.appendChild(nodesLoading);

	var loadingElement = document.getElementById("nodeMDArea");
	while (loadingElement.firstChild) {
    	loadingElement.removeChild(loadingElement.firstChild);
	}
	var nodeMDLoading = document.createElement('div');
	nodeMDLoading.innerHTML = "Loading Nodes Metadata...";
	loadingElement.appendChild(nodeMDLoading);
	waitForNewMMD();
}

//waits until the new metadata comes in before updating the nodes
function waitForNewMMD() {
    if(MDC_rawMMD===cachedMMD) {
        setTimeout(waitForNewMMD, 100);
        return;
    }
    cachedMMD=MDC_rawMMD;
    var graphElement = document.getElementById("graphArea");
	while (graphElement.firstChild) {
    	graphElement.removeChild(graphElement.firstChild);
	}
    getNodes();
}

function waitForNodeMDLoaded() {
	//if url is 404, then we get an http error 500 from the service and get stuck
	//there are some other cases where we get a service error and get stuch
	//make it greater than one to account for not getting 404s
    if(Object.keys(nodeMetadata).length == 0 || requestsMade - (Object.keys(nodeMetadata).length) > 1) {
        setTimeout(waitForNodeMDLoaded, 100);
        return;
    }
	allNodeMDLoaded();
}

function populateNodeMetadata(){
	//for now don't try to load mmd if there is more than 30 nodes
	if (Object.keys(nodes).length > 20){
		return;
	}
	for (nodeKey in nodes){
		if (nodes[nodeKey].location != undefined){
    		MetadataLoader.getMetadata(nodes[nodeKey].location, "storeNodeMD", false);
			requestsMade++;
		}
	}
	
	waitForNodeMDLoaded();
}

function storeNodeMD(rawMetadata, requestMmd){
	//innifecient could be improved
	for (key in rawMetadata){
		console.log("got some metadata for " + rawMetadata[key]['title']);
		for (nodeKey in nodes){
			//kinda sloppy way to handle redirects
			if (nodes[nodeKey].location != undefined && (nodes[nodeKey].location.indexOf(rawMetadata[key].location) > -1 || rawMetadata[key].location.indexOf(nodes[nodeKey].location) > -1)){
				//show node as loaded
				nodeMetadata[nodeKey] = rawMetadata;
				nodeMDLoaded(nodeKey);
			}
		}
	}
}

function nodeMDLoaded(nodeKey){
	//update color
	var rgb = hexToRgb(nodeColors[nodes[nodeKey].type]);
	var div = document.getElementById(nodeKey);
	div.style.color = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",1)";
	
	var x = nodeMetadata[nodeKey];
	//if incoming metadata is of a different type than we expected update the image
	//FIXME not sure if it works
	if (!nodeMetadata[nodeKey].hasOwnProperty(nodes[nodeKey].mmdName)){
		for (newMMDName in nodeMetadata[nodeKey]){
			var img = FlairMaster.getFlairImage(newMMDName).cloneNode(true);
			img.setAttribute('height',tier3size+'px');
			img.setAttribute('width',tier3size+'px');
			
			var curImgArray = div.getElementsByTagName('img');
			curImg = curImgArray[0];
			curImg = img;
		}
	}
	//var img = FlairMaster.getFlairImage(nodes[nodeKey].mmdName).cloneNode(true);
	//img.setAttribute('height',tier2size+'px');
	//img.setAttribute('width',tier2size+'px');
}

function allNodeMDLoaded(){
	var loadingElement = document.getElementById("nodeMDArea");
	while (loadingElement.firstChild) {
    	loadingElement.removeChild(loadingElement.firstChild);
	}
	updateImgSizes("acm_portal");
	updateImgSizes("acm_portal_author");
	updateLines();
}


function updateImgSizes(mmdType){
	
	var citationCountList = [];
	var foundOne = false;
	for (nodeKey in nodeMetadata){
		if (nodeMetadata[nodeKey][mmdType] != null){
			foundOne = true;
			if (mmdType == "acm_portal" && nodeMetadata[nodeKey].acm_portal.citations != null){
				citationCountList.push(nodeMetadata[nodeKey].acm_portal.citations.length);
			}
			//currently ranks by total citations
			//up for debate if this is best
			else if (mmdType == "acm_portal_author" && nodeMetadata[nodeKey].acm_portal_author.publication_detail.citation_count != null){
				citationCountList.push(parseInt(nodeMetadata[nodeKey].acm_portal_author.publication_detail.citation_count));
			}
			else { 
				citationCountList.push(0);
			}
		}
	}
	//if no nodes of mmdType exist, just return
	if (!foundOne) return;
	
	//maybe move entirely into utility?
	citationCountList = citationCountList.sort(sortNumber).reverse();
	var midMedian = median(citationCountList);
	var halfLength = Math.ceil(citationCountList.length / 2);    
	var leftSide = citationCountList.splice(0,halfLength);
	var rightSide = citationCountList;//.splice(halfLength,citationCountList.length);
	var topMedian = median(leftSide);
	var bottomMedian = median(rightSide);
		
	for (nodeKey in nodes){
		if (nodeMetadata.hasOwnProperty(nodeKey) && nodeMetadata[nodeKey][mmdType] != null){
			var citationCount = 0;
			if (mmdType == "acm_portal"){
				if (nodeMetadata[nodeKey].acm_portal.citations != null){
					citationCount = nodeMetadata[nodeKey].acm_portal.citations.length;
				}
			}
			else if (mmdType == "acm_portal_author"){
				if (nodeMetadata[nodeKey].acm_portal_author.publication_detail.citation_count != null){
					citationCount = nodeMetadata[nodeKey].acm_portal_author.publication_detail.citation_count;
				}
			}
			var imgs = document.getElementById(nodeKey).getElementsByTagName('img');
			var img = imgs[0];
			if (citationCount >= topMedian){
				img.setAttribute('height',tier1size+'px');
				img.setAttribute('width',tier1size+'px');
			}
			else if (citationCount < topMedian && citationCount >= midMedian){
				img.setAttribute('height',tier2size+'px');
				img.setAttribute('width',tier2size+'px');
			}
			else if (citationCount < midMedian && citationCount >= bottomMedian){
				img.setAttribute('height',tier3size+'px');
				img.setAttribute('width',tier3size+'px');
			}
			else {
				img.setAttribute('height',tier4size+'px');
				img.setAttribute('width',tier4size+'px');
			}
		}
	}
}

function getNodes(){
	console.log(MDC_rawMetadata);
	console.log(MDC_rawMMD);
	for (metadataType in MDC_rawMetadata){
		
		for (key in MDC_rawMetadata[metadataType]){
			
			var currentField = MDC_rawMetadata[metadataType][key];
			if (currentField instanceof Array){
				if (currentField[0].hasOwnProperty("meta_metadata_name")){
					if (currentField[0]["meta_metadata_name"] != "rich_document" && currentField[0]["meta_metadata_name"] != "image"){
						nodeColors[key] = colorArray[colorCount];
						colorCount++;
						for (var i = 0;  i < currentField.length; i++){
							var newNode = new Node(key, currentField[i]["title"], currentField[i]["location"], currentField[i]["meta_metadata_name"]);
							nodes[currentField[i]["title"]] = newNode;
						}
					}
				}
				else {
					for (key2 in currentField[0]){
						if (currentField[0][key2].hasOwnProperty("meta_metadata_name")){
							if (currentField[0][key2]["meta_metadata_name"] != "rich_document" && currentField[0][key2]["meta_metadata_name"] != "image"){
								nodeColors[key] = colorArray[colorCount];
								colorCount++;				
								for (var i = 0;  i < currentField.length; i++){
									var newNode = new Node(key, currentField[i][key2]["title"], currentField[i][key2]["location"], currentField[i][key2]["meta_metadata_name"]);
									nodes[currentField[i][key2]["title"]] = newNode;
								}			
							}
						}
					}
				}
			}
			if (currentField instanceof Object){
				if (currentField.hasOwnProperty("meta_metadata_name") && currentField.hasOwnProperty("location")){
					if (currentField["meta_metadata_name"] != "rich_document" && currentField["meta_metadata_name"] != "image"){
						nodeColors[key] = colorArray[colorCount];
						colorCount++;
						var newNode = new Node(key, currentField["title"], currentField["location"], currentField["meta_metadata_name"]);
						nodes[currentField["title"]] = newNode;
					}
				}
			}
		}
	}
	populateNodeMetadata();
	drawNodes();
	drawTypes();
	drawLines();
};

function onNodeClick(location){
	document.getElementById("targetURL").value = location;
	showMetadata();
	MONA.initialize();
}

function onNodeMouseover(nodeKey){
	var line = document.getElementById(nodes[nodeKey].title+"Line");
	var rgb = hexToRgb(nodeColors[nodes[nodeKey].type]);
	line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.7)";

	var div = document.getElementById(nodeKey);
	var pArray = div.getElementsByTagName('p');
	var p = pArray[0];
	p.innerHTML = nodes[nodeKey].title;
	updateLines();
}

function onNodeMouseout(nodeKey){
	if (nodes.hasOwnProperty(nodeKey)){
		var line = document.getElementById(nodes[nodeKey].title+"Line");
		var rgb = hexToRgb(nodeColors[nodes[nodeKey].type]);
		line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.2)";
	
		if(nodeKey.length > 30){
			var div = document.getElementById(nodeKey);
			var pArray = div.getElementsByTagName('p');
			var p = pArray[0];
			p.innerHTML = nodes[nodeKey].abbrevTitle;
		}
	}
	updateLines();
}

function onTypeMouseover(type){
	var lines = document.getElementsByClassName(type+"Line");
	for (var i=0; i<lines.length; i++){
		var rgb = hexToRgb(nodeColors[type]);
		lines[i].style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.7)";
	}
}

function onTypeMouseout(type){
	var lines = document.getElementsByClassName(type+"Line");
	for (var i=0; i<lines.length; i++){
		var rgb = hexToRgb(nodeColors[type]);
		lines[i].style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.2)";
	}
}

function drawNodes(){
	for (nodeKey in nodes){
		var graphElement = document.getElementById("graphArea");
		var div = document.createElement('div');
		
		if (nodes[nodeKey].location != undefined){//visualize this
			div.style.cursor = "pointer";
			div.setAttribute('onclick','onNodeClick("'+nodes[nodeKey].location+'")');
		}
		div.setAttribute('onmouseover','onNodeMouseover("'+nodeKey+'")');
		div.setAttribute('onmouseout','onNodeMouseout("'+nodeKey+'")');
		div.id = nodeKey;
		
		var nodeText = ""
		if(nodeKey.length > 30)
			nodeText = nodes[nodeKey].abbrevTitle;
		else
			nodeText = nodeKey;
		var nodePara = document.createElement('p');
		nodePara.innerHTML = nodeText;
		nodePara.className = "nodeText";
		
		for (nodeType in nodeColors)
			if (nodes[nodeKey].type == nodeType){
				div.className=nodeType;
				var rgb = hexToRgb(nodeColors[nodeType]);
				div.style.color = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.5)";
			}
		
		//images are preloaded so we make copies of them		
		var img = FlairMaster.getFlairImage(nodes[nodeKey].mmdName).cloneNode(true);
		img.setAttribute('height',tier2size+'px');
		img.setAttribute('width',tier2size+'px');
		
		div.appendChild(img);
		div.appendChild(nodePara);
		graphElement.appendChild(div);
		nodePositions[nodeKey] = div.getBoundingClientRect();
	}
}

function drawTypes(){
	var typeElement = document.getElementById("typeArea");
	for (nodeType in nodeColors){
		var div = document.createElement('div');
		div.setAttribute('onmouseover','onTypeMouseover("'+nodeType+'")');
		div.setAttribute('onmouseout','onTypeMouseout("'+nodeType+'")');
		div.innerHTML = nodeType;
		div.className=nodeType;
		div.id=nodeType;
		div.style.color = nodeColors[nodeType];
		div.style.textAlign = "right";
		typeElement.appendChild(div);
	}
	var children = typeElement.children;
	for (var i = 0; i < children.length; i++) {
		var child = children[i];
		typePositions[child.id] = child.getBoundingClientRect();	
	}

}

function drawLines(){	
	var typeElement = document.getElementById("lineSVG");
	for (nodeKey in nodes){
		var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		line.setAttribute('class', nodes[nodeKey].type+"Line");
		line.setAttribute('id', nodes[nodeKey].title+"Line");
		line.setAttribute('x1', nodePositions[nodeKey].left);
		line.setAttribute('x2', typePositions[nodes[nodeKey].type].right+2);
		line.setAttribute('y1', nodePositions[nodeKey].top+nodePositions[nodeKey].height/2);
		line.setAttribute('y2', typePositions[nodes[nodeKey].type].top+10);
		var rgb = hexToRgb(nodeColors[nodes[nodeKey].type]);
		line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.2)";
		line.setAttribute('stroke-width', 1);
		typeElement.appendChild(line);
	}	
}

function updateLines(){
	for (nodeKey in nodes){
		//update line ends
		var div = document.getElementById(nodeKey);
		nodePositions[nodeKey] = div.getBoundingClientRect();
		var line = document.getElementById(nodes[nodeKey].title+"Line");
		line.setAttribute('x1', nodePositions[nodeKey].left);
		line.setAttribute('y1', nodePositions[nodeKey].top+nodePositions[nodeKey].height/2);
	}
}
