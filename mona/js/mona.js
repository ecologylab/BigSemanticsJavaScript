/*global fixWhiteSpace, rgbToRgbObj, getLabel, simplDeserialize, waitForNewMMD, MDC_rawMMD, getNodes, allNodeMDLoaded, document, setTimeout, MetadataLoader, console, hexToRgb, FlairMaster, sortNumber, median, MDC_rawMetadata, showMetadata*/

var MONA = {},
    cachedMMD = "",
    cachedNodeMetadata = {},
    nodeColors = {},
    nodes = {},
    secondaryNodes = {},
    nodeMetadata = {},
    nodePositions = {},
    typePositions = {},
    colorCount = 0,
    requestsMade = 0,
    tier4size = 10,
    tier3size = 20,
    tier2size = 30,
    tier1size = 40,
    colorArray = ["#009933", "#006699", "#CC9900", "#CC0000", "#CC00CC"],
    historyNodes = [];


function Node(type, title, location, mmdName){
	this.type = type;
	this.title = title;
	this.abbrevTitle = title.substring(0, 29) + "...";
	this.location = location;
	this.mmdName = mmdName;
    this.children = [];
}

//rev your engines
MONA.initialize = function (){
	cachedNodeMetadata = {};
	nodeColors = {};
	nodes = {};
	nodeMetadata = {};
	nodePositions = {};
	typePositions = {};
	colorCount = 0;
	requestsMade = 0;
	var graphElement = document.getElementById("graphArea"),
        typeElement = document.getElementById("typeArea"),
        linesElement = document.getElementById("lineSVG"),
        loadingElement = document.getElementById("nodeMDArea"),
        nodesLoading = document.createElement('div'),
        nodeMDLoading = document.createElement('div');
	
    while (graphElement.firstChild){
        graphElement.removeChild(graphElement.firstChild);
	}
	while (typeElement.firstChild){
        typeElement.removeChild(typeElement.firstChild);
	}
	while (linesElement.firstChild){
        linesElement.removeChild(linesElement.firstChild);
	}
    
	nodesLoading.innerHTML = "Loading Nodes...";
	graphElement.appendChild(nodesLoading);

	while (loadingElement.firstChild){
        loadingElement.removeChild(loadingElement.firstChild);
	}

    nodeMDLoading.innerHTML = "Loading Nodes Metadata...";
	loadingElement.appendChild(nodeMDLoading);
	waitForNewMMD();
};

//waits until the new metadata comes in before updating the nodes
function waitForNewMMD(){
    if (MDC_rawMMD === cachedMMD){
        setTimeout(waitForNewMMD, 100);
        return;
    }
    cachedMMD = MDC_rawMMD;
    var graphElement = document.getElementById("graphArea");
	while (graphElement.firstChild){
        graphElement.removeChild(graphElement.firstChild);
	}
    getNodes();
}

//make requests for all the node metadata
function populateNodeMetadata(){
	//for now don't try to load mmd if there is more than 30 nodes
	if (Object.keys(nodes).length > 20) {
		return;
	}
	for (var nodeKey in nodes) {
		if (nodes[nodeKey].location !== undefined) {
    		MetadataLoader.getMetadata(nodes[nodeKey].location, "storeNodeMD", false);
			requestsMade++;
		}
	}
    
    //start the loading bar
    var loadingElement = document.getElementById("nodeMDArea");
	while (loadingElement.firstChild){
        loadingElement.removeChild(loadingElement.firstChild);
	}
    var loading = document.createElement('p');
    loading.id="loadingBar";
    loading.innerHTML= "0 of " + requestsMade + " node metadata loaded";
    loadingElement.appendChild(loading);
	
    waitForNodeMDLoaded();
}

//update loading bar while we wait on all the node metadata to come in
function waitForNodeMDLoaded(){

    var loading = document.getElementById("loadingBar");
    if (loading !== null){
        loading.innerHTML= Object.keys(nodeMetadata).length + " of " + requestsMade + " loaded";
    }
    
	//if url is 404, then we get an http error 500 from the service and get stuck
	//there are some other cases where we get a service error and get stuch
	//make it greater than one to account for not getting 404s
    if (Object.keys(nodeMetadata).length === 0 || requestsMade - (Object.keys(nodeMetadata).length) > 1) {
        setTimeout(waitForNodeMDLoaded, 100);
        return;
    }
	allNodeMDLoaded();
}

//store the metadata for a node once it comes in
function storeNodeMD(rawMetadata, requestMmd){
	//innifecient could be improved
	for (var key in rawMetadata){
		console.log("got some metadata for " + rawMetadata[key].title);
		for (var nodeKey in nodes){
			//kinda sloppy way to handle redirects
			if (nodes[nodeKey].location !== undefined && (nodes[nodeKey].location.indexOf(rawMetadata[key].location) > -1 || rawMetadata[key].location.indexOf(nodes[nodeKey].location) > -1)){
				//show node as loaded
				nodeMetadata[nodeKey] = rawMetadata;
				nodeMDLoaded(nodeKey);
                getSecondaryNodes(rawMetadata, nodeKey);
			}
		}
	}
}

//when a single node's metadata is loaded update its colors
function nodeMDLoaded(nodeKey){
	//update color
	var rgb = hexToRgb(nodeColors[nodes[nodeKey].type]);
	var div = document.getElementById(nodeKey);
	div.style.color = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",1)";
	
	//if incoming metadata is of a different type than we expected update the image
	//FIXME not sure if it works
	if (!nodeMetadata[nodeKey].hasOwnProperty(nodes[nodeKey].mmdName)){
		for (var newMMDName in nodeMetadata[nodeKey]){
			var img = FlairMaster.getFlairImage(newMMDName).cloneNode(true);
			img.setAttribute('height',tier3size+'px');
			img.setAttribute('width',tier3size+'px');
			
			var curImgArray = div.getElementsByTagName('img');
			var curImg = curImgArray[0];
			curImg = img;
		}
	}
}

//when all node metadata is loaded update image sizes
function allNodeMDLoaded(){
	var loadingElement = document.getElementById("nodeMDArea");
    loadingElement.removeChild(loadingElement.firstChild);
	updateImgSizes("acm_portal");
	updateImgSizes("acm_portal_author");
	updateLines();
}

//when we navigate add the old one to the history
function addToHistory(MDC_rawMetadata){
    var newNode;
    for (var mmdType in MDC_rawMetadata){
        newNode = new Node(mmdType, MDC_rawMetadata[mmdType].title, MDC_rawMetadata[mmdType].location, MDC_rawMetadata[mmdType].meta_metadata_name);
        historyNodes.push(newNode);
    }
    var historyElement = document.getElementById("historyArea");
    var div = document.createElement('div');
    
    if (newNode.location !== undefined){
        div.style.cursor = "pointer";
		div.setAttribute('onclick','onNodeClick("'+newNode.location+'")');
    }

    var nodeText = "";
    if(MDC_rawMetadata[mmdType].title.length > 30)
        nodeText = newNode.abbrevTitle;//trim this
    else
        nodeText = newNode.title;
    var nodePara = document.createElement('p');
    nodePara.innerHTML = nodeText;
    nodePara.className = "nodeText";
    
    //images are preloaded so we make copies of them		
    var img = FlairMaster.getFlairImage(newNode.mmdName).cloneNode(true);
    img.setAttribute('height',tier2size+'px');
    img.setAttribute('width',tier2size+'px');

    div.appendChild(img);
    div.appendChild(nodePara);
    historyElement.insertBefore(div, historyElement.firstChild);
}

//make more important nodes bigger
function updateImgSizes(mmdType){
	var citationCountList = [];
	var foundOne = false;
	for (var nodeKey in nodeMetadata){
		if (nodeMetadata[nodeKey][mmdType] !== undefined){
			foundOne = true;
			if (mmdType == "acm_portal" && nodeMetadata[nodeKey].acm_portal !== undefined && nodeMetadata[nodeKey].acm_portal.citations !== undefined){
				citationCountList.push(nodeMetadata[nodeKey].acm_portal.citations.length);
			}
			//currently ranks by total citations
			//up for debate if this is best
			else if (mmdType == "acm_portal_author" && nodeMetadata[nodeKey].acm_portal_author.publication_detail.citation_count !== undefined){
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
    console.log(citationCountList);
	var midMedian = median(citationCountList);
	var halfLength = Math.ceil(citationCountList.length / 2);    
	var leftSide = citationCountList.splice(0,halfLength);
	var rightSide = citationCountList;//.splice(halfLength,citationCountList.length);
	var topMedian = median(leftSide);
	var bottomMedian = median(rightSide);
		
	for (nodeKey in nodes){
		if (nodeMetadata.hasOwnProperty(nodeKey) && nodeMetadata[nodeKey][mmdType] !== undefined) {
			var citationCount = 0;
			if (mmdType == "acm_portal"){
				if (nodeMetadata[nodeKey].acm_portal.citations !== undefined) {
					citationCount = nodeMetadata[nodeKey].acm_portal.citations.length;
				}
			}
			else if (mmdType == "acm_portal_author"){
				if (nodeMetadata[nodeKey].acm_portal_author.publication_detail.citation_count !== undefined){
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

//extract what will be nodes from the focus's metadata
function getNodes(){
	console.log(MDC_rawMetadata);
    simplDeserialize(MDC_rawMMD);
    console.log(MDC_rawMMD);

    for (var metadataType in MDC_rawMetadata){
		
		for (var key in MDC_rawMetadata[metadataType]){
            var newNode;
			var currentField = MDC_rawMetadata[metadataType][key];
			if (currentField instanceof Array){
				if (currentField[0].hasOwnProperty("meta_metadata_name")){
					if (currentField[0].meta_metadata_name != "rich_document" && currentField[0].meta_metadata_name != "image"){
                        key = getLabel(key);
						nodeColors[key] = colorArray[colorCount];
						colorCount++;
						for (var i = 0;  i < currentField.length; i++){
							if (currentField[i].hasOwnProperty('title')){
                                newNode = new Node(key, currentField[i].title, currentField[i].location, currentField[i].meta_metadata_name, null);
                                nodes[currentField[i].title] = newNode;
                            }
						}
					}
				}
				else {
					for (var key2 in currentField[0]){
						if (currentField[0][key2].hasOwnProperty("meta_metadata_name")){
							if (currentField[0][key2].meta_metadata_name != "rich_document" && currentField[0][key2].meta_metadata_name != "image"){
								key = getLabel(key);
                                nodeColors[key] = colorArray[colorCount];
								colorCount++;				
								for (var j = 0;  j < currentField.length; j++){
                                    if (currentField[j][key2].hasOwnProperty('title')){
									   newNode = new Node(key, currentField[j][key2].title, currentField[j][key2].location, currentField[j][key2].meta_metadata_name, null);
									   nodes[currentField[j][key2].title] = newNode;
                                    }
								}			
							}
						}
					}
				}
			}
			if (currentField instanceof Object){
				if (currentField.hasOwnProperty("meta_metadata_name") && currentField.hasOwnProperty("location")){
					if (currentField.meta_metadata_name != "rich_document" && currentField.meta_metadata_name != "image"){
				        key = getLabel(key);
                        nodeColors[key] = colorArray[colorCount];
						colorCount++;
						newNode = new Node(key, currentField.title, currentField.location, currentField.meta_metadata_name, null);
						nodes[currentField.title] = newNode;
					}
				}
			}
		}
	}
	populateNodeMetadata();
	drawNodes();
	drawTypes();
	drawLines();
}

//extract what will be secondary nodes from an existing node's metadata
function getSecondaryNodes(nodeMMD, parent){
    simplDeserialize(nodeMMD);
    //this is passed to our line drawing function so it can 
    var currentNodes = {};
    for (var metadataType in nodeMMD){
		
		for (var key in nodeMMD[metadataType]){
            var newNode;
			var currentField = nodeMMD[metadataType][key];
			if (currentField instanceof Array){
				if (currentField[0].hasOwnProperty("meta_metadata_name")){
					if (currentField[0].meta_metadata_name != "rich_document" && currentField[0].meta_metadata_name != "image"){
                        key = getLabel(key);
						for (var i = 0;  i < currentField.length; i++){
                            if (currentField[i].hasOwnProperty('title')){
                                newNode = new Node(key, currentField[i].title, currentField[i].location, currentField[i].meta_metadata_name);
                                nodes[parent].children.push(currentField[i].title);
                            }
                            //if the node doesn't already exist create it. also currently bounded at 100 
                            if (!secondaryNodes.hasOwnProperty(currentField[i].title) && !nodes.hasOwnProperty(currentField[i].title) && Object.keys(secondaryNodes).length < 100){
                                secondaryNodes[currentField[i].title] = newNode;
                                //currentNodes[currentField[i].title] = true;
                            }
						}
					}
				}
				else {
					for (var key2 in currentField[0]){
						if (currentField[0][key2].hasOwnProperty("meta_metadata_name")){
							if (currentField[0][key2].meta_metadata_name != "rich_document" && currentField[0][key2].meta_metadata_name != "image"){
								key = getLabel(key);				
								for (var j = 0;  j < currentField.length; j++){
                                    if (currentField[j][key2].hasOwnProperty('title')){
								        newNode = new Node(key, currentField[j][key2].title, currentField[j][key2].location, currentField[j][key2].meta_metadata_name);
                                        nodes[parent].children.push(currentField[j][key2].title);
                                    }
                                    if (!secondaryNodes.hasOwnProperty(currentField[j][key2].title) && !nodes.hasOwnProperty(currentField[j][key2].title) && Object.keys(secondaryNodes).length < 100){
                                        secondaryNodes[currentField[j][key2].title] = newNode;
                                        //currentNodes[currentField[j][key2].title] = true;
                                    }
                                }			
							}
						}
					}
				}
			}
			if (currentField instanceof Object){
				if (currentField.hasOwnProperty("meta_metadata_name") && currentField.hasOwnProperty("location")){
					if (currentField.meta_metadata_name != "rich_document" && currentField.meta_metadata_name != "image"){
				        key = getLabel(key);
						newNode = new Node(key, currentField.title, currentField.location, currentField.meta_metadata_name);
                        nodes[parent].children.push(currentField.title);
				        if (!secondaryNodes.hasOwnProperty(currentField.title) && !nodes.hasOwnProperty(currentField.title) && Object.keys(secondaryNodes).length < 100){
                            secondaryNodes[currentField.title] = newNode;
                            //currentNodes[currentField.title] = true;
                        }
					}
				}
			}
		}
	}
	//populateNodeMetadata();
	drawSecondaryNodes();
    drawSecondaryLines(parent);
}

function onNodeClick(location){
	document.getElementById("targetURL").value = location;
	showMetadata();
    addToHistory(MDC_rawMetadata);
	MONA.initialize();
}

function onNodeMouseover(nodeKey){
	var line = document.getElementById(nodes[nodeKey].title+"Line");
	var rgb = hexToRgb(nodeColors[nodes[nodeKey].type]);
	line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.7)";

	var nodeDiv = document.getElementById(nodeKey);    
    var pArray = nodeDiv.getElementsByTagName('p');
	var p = pArray[0];
    p.style.backgroundColor = nodeDiv.style.color;
    p.style.color = "white";
	p.innerHTML = nodes[nodeKey].title;
    
    var lines = document.getElementsByClassName(nodes[nodeKey].title+"Line");
	for (var i=0; i<lines.length; i++){
        rgb = rgbToRgbObj(lines[i].style.stroke);
		lines[i].style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.7)";
	}
	updateLines();
}

function onNodeMouseout(nodeKey){
	if (nodes.hasOwnProperty(nodeKey)){
		var line = document.getElementById(nodes[nodeKey].title+"Line");
		var rgb = hexToRgb(nodeColors[nodes[nodeKey].type]);
		line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.2)";
	
		var nodeDiv = document.getElementById(nodeKey);        
        var pArray = nodeDiv.getElementsByTagName('p');
        var p = pArray[0];
        if(nodeKey.length > 30){
			p.innerHTML = nodes[nodeKey].abbrevTitle;
		}
        p.style.color = p.style.backgroundColor;
        p.style.backgroundColor = "transparent";
        
        var lines = document.getElementsByClassName(nodes[nodeKey].title+"Line");
        for (var i=0; i<lines.length; i++){
            rgb = rgbToRgbObj(lines[i].style.stroke);
            lines[i].style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.2)";
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

//create divs for first layer of nodes
function drawNodes(){
	for (var nodeKey in nodes){
		var graphElement = document.getElementById("graphArea");
		var div = document.createElement('div');
		
		if (nodes[nodeKey].location !== undefined){//visualize this
			div.style.cursor = "pointer";
			div.setAttribute('onclick','onNodeClick("'+nodes[nodeKey].location+'")');
		}
		div.setAttribute('onmouseover','onNodeMouseover("'+nodeKey+'")');
		div.setAttribute('onmouseout','onNodeMouseout("'+nodeKey+'")');
		div.id = nodeKey;
		
		var nodeText = "";
		if(nodeKey.length > 30)
			nodeText = nodes[nodeKey].abbrevTitle;
		else
			nodeText = nodeKey;
		var nodePara = document.createElement('p');
		nodePara.innerHTML = nodeText;
		nodePara.className = "nodeText";
		
		for (var nodeType in nodeColors)
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

//create divs for second layer of nodes
function drawSecondaryNodes(){
	for (var nodeKey in secondaryNodes){
        if (document.getElementById(nodeKey) === null){
            var graphElement = document.getElementById("nodeMDArea");
            var div = document.createElement('div');

            if (secondaryNodes[nodeKey].location !== undefined){//visualize this
                div.style.cursor = "pointer";
                div.setAttribute('onclick','onNodeClick("'+secondaryNodes[nodeKey].location+'")');
            }
            div.setAttribute('onmouseover','onNodeMouseover("'+nodeKey+'")');
            div.setAttribute('onmouseout','onNodeMouseout("'+nodeKey+'")');
            div.id = nodeKey;

            var nodeText = "";
            if(nodeKey.length > 30)
                nodeText = secondaryNodes[nodeKey].abbrevTitle;
            else
                nodeText = nodeKey;
            var nodePara = document.createElement('p');
            nodePara.innerHTML = nodeText;
            nodePara.className = "nodeText";

            for (var nodeType in nodeColors)
                if (secondaryNodes[nodeKey].type == nodeType){
                    div.className=nodeType;
                    var rgb = hexToRgb(nodeColors[nodeType]);
                    div.style.color = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.5)";
                }

            //FIXME currently breaks? Not sure what is up		
            var img = FlairMaster.getFlairImage(secondaryNodes[nodeKey].mmdName).cloneNode(true);
            img.setAttribute('height',tier2size+'px');
            img.setAttribute('width',tier2size+'px');

            div.appendChild(img);
            div.appendChild(nodePara);
            graphElement.appendChild(div);
            nodePositions[nodeKey] = div.getBoundingClientRect();
        }
	}
}

function drawTypes(){
	var typeElement = document.getElementById("typeArea");
	for (var nodeType in nodeColors){
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
	for (var nodeKey in nodes){
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

//draws lines for one chunk of secondary nodes
function drawSecondaryLines(parent){
	var lineElement = document.getElementById("lineSVG");
	
    for (var i in nodes[parent].children){
        var nodeKey = nodes[parent].children[i];
        //FIXME make it look through first level as well
        if (secondaryNodes[nodeKey] !== undefined && document.getElementById(secondaryNodes[nodeKey].title+"Line") !== undefined){
            var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            //bit of a hack for now. Need to decide how to approach this
            line.setAttribute('class', secondaryNodes[nodeKey].parent+"Line");
            line.setAttribute('id', secondaryNodes[nodeKey].title+"Line");
            line.setAttribute('x1', nodePositions[nodeKey].left);
            line.setAttribute('x2', nodePositions[parent].left+2);
            line.setAttribute('y1', nodePositions[nodeKey].top+nodePositions[nodeKey].height/2);
            line.setAttribute('y2', nodePositions[parent].top+10);
            var rgb = hexToRgb(nodeColors[secondaryNodes[nodeKey].type]);
            line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.2)";
            line.setAttribute('stroke-width', 1);
            lineElement.appendChild(line);
        }
	}	

}

//maybe make this work for all lines
function updateLines(){
	for (var nodeKey in nodes){
		//update line ends
		var div = document.getElementById(nodeKey);
		nodePositions[nodeKey] = div.getBoundingClientRect();
		var line = document.getElementById(nodes[nodeKey].title+"Line");
		line.setAttribute('x1', nodePositions[nodeKey].left);
		line.setAttribute('y1', nodePositions[nodeKey].top+nodePositions[nodeKey].height/2);
        
        //Bug occurs within this loop!
        for (var i in nodes[nodeKey].children){
            var childKey = nodes[nodeKey].children[i];
            //update line ends
            //Change How lines work so you can have many to many
            var div2 = document.getElementById(childKey);
            if (div2 !== null){
                nodePositions[childKey] = div2.getBoundingClientRect();
                var line2 = {};
                if (secondaryNodes[childKey] !== undefined){
                    line2 = document.getElementById(secondaryNodes[childKey].title+"Line");
                }
                else if (nodes[childKey] !== undefined){
                    line2 = document.getElementById(nodes[childKey].title+"Line");
                }
                line2.setAttribute('x1', nodePositions[childKey].left);
                line2.setAttribute('x2', nodePositions[nodeKey].left+2);
                line2.setAttribute('y1', nodePositions[childKey].top+nodePositions[childKey].height/2);
                line2.setAttribute('y2', nodePositions[nodeKey].top+10);
            }
        }
	}
}
