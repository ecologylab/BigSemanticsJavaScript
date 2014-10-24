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
var baseWidthHeight = 25;
var largeWidthHeight = 35;
var smallWidthHeight = 15;
var colorArray = ["#009933","#006699","#CC9900","#CC0000","#CC00CC"]

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
    //Object.keys(nodeMetadata).length > 0 && 
    if(requestsMade - Object.keys(nodeMetadata).length > 1) {
        setTimeout(waitForNodeMDLoaded, 100);
        return;
    }
	updateImgSize();
}


function Node (type, title, location, mmdName){
	this.type = type;
	this.title = title;
	this.location = location;
	this.mmdName = mmdName;
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
				if (currentField.hasOwnProperty("meta_metadata_name")){
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
}

function onNodeMouseout(nodeKey){
	if (nodes.hasOwnProperty(nodeKey)){
		var line = document.getElementById(nodes[nodeKey].title+"Line");
		var rgb = hexToRgb(nodeColors[nodes[nodeKey].type]);
		line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.2)";
	}
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

function populateNodeMetadata(){
	//for now don't try to load mmd if there is more than 30 nodes
	if (nodes.length > 30){
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
	console.log("got some metadata");
	//innifecient could be improved
	for (key in rawMetadata){
		for (nodeKey in nodes){
			if (rawMetadata[key].location == nodes[nodeKey].location){
				//show node as loaded
				nodeMDLoaded(nodeKey);
				nodeMetadata[nodeKey] = rawMetadata;
			}
		}
	}
}

function nodeMDLoaded(nodeKey){
	//update color
	var rgb = hexToRgb(nodeColors[nodes[nodeKey].type]);
	var div = document.getElementById(nodeKey);
	div.style.color = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",1)";
	//update line
	nodePositions[nodeKey] = div.getBoundingClientRect();
	var line = document.getElementById(nodes[nodeKey].title+"Line");
	line.setAttribute('x1', nodePositions[nodeKey].left-2);
	line.setAttribute('y1', nodePositions[nodeKey].top+10);
}

function updateImgSize(){
	var loadingElement = document.getElementById("nodeMDArea");
	while (loadingElement.firstChild) {
    	loadingElement.removeChild(loadingElement.firstChild);
	}
	//calculate averages
	//FIXME PROBLEM> BOOKS have waaaaaay more citations. throw off averages 
	// put into tiers
	var avgCitation = 0;
	var numPapers = 0;
	for (nodeKey in nodeMetadata){
		if (nodeMetadata[nodeKey].acm_portal != null){
			if (nodeMetadata[nodeKey].acm_portal.citations != null && nodeMetadata[nodeKey].acm_portal.title != nodeMetadata[nodeKey].acm_portal.source.title)
				avgCitation += nodeMetadata[nodeKey].acm_portal.citations.length;
				numPapers++;
		}
	}
	avgCitation = avgCitation/numPapers;
	for (nodeKey in nodes){
		if (nodeMetadata.hasOwnProperty(nodeKey) && nodeMetadata[nodeKey].acm_portal != null){
			var citationCount = 0;
			var noCitations = false;
			if (nodeMetadata[nodeKey].acm_portal.citations != null){
				citationCount = nodeMetadata[nodeKey].acm_portal.citations.length;
			}
			else {
				noCitations = true;
			}
			var imgs = document.getElementById(nodeKey).getElementsByTagName('img');
			var img = imgs[0];
			if (!noCitations && citationCount - avgCitation > 2){
				img.setAttribute('height',largeWidthHeight+'px');
				img.setAttribute('width',largeWidthHeight+'px');
			}
			else if (noCitations || citationCount - avgCitation < -2){
				img.setAttribute('height',smallWidthHeight+'px');
				img.setAttribute('width',smallWidthHeight+'px');
			}
		}
	}
	var x = 0;
}

function drawNodes(){
	for (nodeKey in nodes){
		var graphElement = document.getElementById("graphArea");
		var div = document.createElement('div');
		if (nodes[nodeKey].location != undefined){//visualize this
			div.setAttribute('onclick','onNodeClick("'+nodes[nodeKey].location+'")');
		}
		div.setAttribute('onmouseover','onNodeMouseover("'+nodeKey+'")');
		div.setAttribute('onmouseout','onNodeMouseout("'+nodeKey+'")');
		div.id = nodeKey;
		
		var nodeText = ""
		if(nodeKey.length > 30)
			nodeText= nodeKey.substring(0,29) + "...";
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
		img.setAttribute('height',baseWidthHeight+'px');
		img.setAttribute('width',baseWidthHeight+'px');
		
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
		line.setAttribute('x1', nodePositions[nodeKey].left-2);
		line.setAttribute('x2', typePositions[nodes[nodeKey].type].right+2);
		line.setAttribute('y1', nodePositions[nodeKey].top+10);
		line.setAttribute('y2', typePositions[nodes[nodeKey].type].top+10);
		var rgb = hexToRgb(nodeColors[nodes[nodeKey].type]);
		line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.2)";
		line.setAttribute('stroke-width', 1);
		typeElement.appendChild(line);
	}	
}

/* source: http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb */
// might be faster to hash these
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
