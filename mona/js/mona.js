/*global window, doc, Image, fixWhiteSpace, rgbToRgbObj, getLabel, simplDeserialize, waitForNewMMD, MDC_rawMMD, getNodes, allNodeMDLoaded, document, setTimeout, MetadataLoader, console, hexToRgb, FlairMaster, sortNumber, median, MDC_rawMetadata, showMetadata, setInterval, clearInterval, Vector*/

var MONA = {},
    cachedMMD = "",
    cachedNodeMetadata = {},
    focusTitle = "",
    nodeColors = {},
    nodes = {},
    nodeList =[],
    secondaryNodes = {},
    secondaryNodesList = [],
    nodeMetadata = {},
    nodePositions = {},
    typePositions = {},
    colorCount = 0,
    requestsMade = 0,
    tier4size = 15,
    tier3size = 20, 
    tier2size = 25, //also the base size
    tier1size = 30,
    colorArray = ["#009933", "#006699", "#CC9900", "#CC0000", "#CC00CC"],
    historyNodes = [];


function Node(type, title, location, mmdName, parent){
    this.x = 0;
    this.y = 0;
    
	this.type = type;
	this.title = title;
	this.abbrevTitle = title.substring(0, 40) + "...";
	this.location = location;
	this.mmdName = mmdName;
    this.children = [];
    if (parent !== null){
        this.parents = [parent];
    }
    else {
        this.parents = [];
    }
    this.rendered = true;
}

//rev your engines
MONA.initialize = function (){
	cachedNodeMetadata = {};
	nodeColors = {};
	nodes = {};
    secondaryNodes = {};
	nodeMetadata = {};
	nodePositions = {};
	typePositions = {};
	colorCount = 0;
	requestsMade = 0;
	var graphElement = document.getElementById("level1Nodes"),
        typeElement = document.getElementById("typeArea"),
        linesElement = document.getElementById("lineSVG"),
        loadingElement = document.getElementById("level2Nodes"),
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
    var graphElement = document.getElementById("level1Nodes");
	while (graphElement.firstChild){
        graphElement.removeChild(graphElement.firstChild);
	}
    getNodes();
}

//make requests for all the node metadata
function populateNodeMetadata(){
	//for now don't try to load mmd if there is more than 30
	if (Object.keys(nodes).length > 30) {
		return;
	}
    //if there are no nodes display nothing
    if (Object.keys(nodes).length === 0) {
        var loadingElementClear = document.getElementById("level2Nodes");
        while (loadingElementClear.firstChild){
            loadingElementClear.removeChild(loadingElementClear.firstChild);
        }
        return;
	}
	for (var nodeKey in nodes) {
		if (nodes[nodeKey].location !== undefined) {
    		MetadataLoader.getMetadata(nodes[nodeKey].location, "storeNodeMD", false);
			requestsMade++;
		}
	}
    
    //start the loading bar
    var loadingElement = document.getElementById("level2Nodes");
	while (loadingElement.firstChild){
        loadingElement.removeChild(loadingElement.firstChild);
	}
    var loadingDiv = document.createElement('div');
    var loadingText = document.createElement('p');
    loadingText.id="loadingText";
    
    var spinner = new Image(24,24);
    spinner.src = "img/spinner.gif";
    loadingDiv.appendChild(spinner);
    
    loadingText.innerHTML= "0 of " + requestsMade + " node metadata loaded";
    loadingDiv.appendChild(loadingText);
    
    loadingElement.appendChild(loadingDiv);
    
    waitForNodeMDLoaded();
}

//update loading bar while we wait on all the node metadata to come in
function waitForNodeMDLoaded(){

    var loading = document.getElementById("loadingText");
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
	var loadingElement = document.getElementById("level2Nodes");
    loadingElement.removeChild(loadingElement.firstChild);
	updateImgSizes("acm_portal");
	updateImgSizes("acm_portal_author");
	updateLines();
    for (var nodeKey in secondaryNodes){
        secondaryNodesList.push(secondaryNodes[nodeKey]);
    }
    doPhysical();
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
					citationCount = parseInt(nodeMetadata[nodeKey].acm_portal_author.publication_detail.citation_count);
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
            //globaly store the title of the in-focus node
            if (key == "title"){
                focusTitle = MDC_rawMetadata[metadataType][key];
            }
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
                                nodes[currentField[i].location] = newNode;
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
									   nodes[currentField[j][key2].location] = newNode;
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
						nodes[currentField.location] = newNode;
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
    for (var metadataType in nodeMMD){
		for (var key in nodeMMD[metadataType]){
            var newNode;
			var currentField = nodeMMD[metadataType][key];
			if (currentField instanceof Array){
				if (currentField[0].hasOwnProperty("meta_metadata_name")){
					if (currentField[0].meta_metadata_name != "rich_document" && currentField[0].meta_metadata_name != "image"){
                        key = getLabel(key);
						for (var i = 0;  i < currentField.length; i++){
                            // we found a valid node!
                            if (currentField[i].hasOwnProperty('title') && currentField[i].title !== focusTitle && Object.keys(secondaryNodes).length < 400){
                                //update the parent nodes list of children
                                nodes[parent].children.push(currentField[i].location);
                                
                                //if the node doesn't already exist create it. also currently bounded at 200 
                                if (!secondaryNodes.hasOwnProperty(currentField[i].location) && !nodes.hasOwnProperty(currentField[i].location)){
                                    newNode = new Node(key, currentField[i].title, currentField[i].location, currentField[i].meta_metadata_name, parent);
                                    secondaryNodes[currentField[i].location] = newNode;
                                }
            
                                //otherwise update the nodes parents
                                else if (secondaryNodes.hasOwnProperty(currentField[i].location)){
                                    secondaryNodes[currentField[i].location].parents.push(parent);
                                }
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
                                    if (currentField[j][key2].hasOwnProperty('title') && currentField[j][key2].title !== focusTitle){
                                        nodes[parent].children.push(currentField[j][key2].location);  
                                        if (!secondaryNodes.hasOwnProperty(currentField[j][key2].location) && !nodes.hasOwnProperty(currentField[j][key2].location) && Object.keys(secondaryNodes).length < 400){
                                            newNode = new Node(key, currentField[j][key2].title, currentField[j][key2].location, currentField[j][key2].meta_metadata_name, parent);
                                            secondaryNodes[currentField[j][key2].location] = newNode;
                                        }
                                        else if (secondaryNodes.hasOwnProperty(currentField[j][key2].location)){
                                            secondaryNodes[currentField[j][key2].location].parents.push(parent);
                                        }
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
                        if (currentField.title !== focusTitle){
                            nodes[parent].children.push(currentField.location);
                            if (!secondaryNodes.hasOwnProperty(currentField.location) && !nodes.hasOwnProperty(currentField.location) && Object.keys(secondaryNodes).length < 400){
                                newNode = new Node(key, currentField.title, currentField.location, currentField.meta_metadata_name, parent);
                                secondaryNodes[currentField.location] = newNode;
                            }
                            else if (secondaryNodes.hasOwnProperty(currentField.location)){
                                secondaryNodes[currentField.location].parents.push(parent);
                            }
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
	if (nodes.hasOwnProperty(nodeKey)) {
        var line = document.getElementById(nodes[nodeKey].location+"Line");
        var rgb = hexToRgb(nodeColors[nodes[nodeKey].type]);
        line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.7)";

        var nodeDiv = document.getElementById(nodeKey);    
        var pArray = nodeDiv.getElementsByTagName('p');
        var p = pArray[0];
        p.style.backgroundColor = nodeDiv.style.color;
        p.style.color = "white";
        p.innerHTML = nodes[nodeKey].title;

        var lines = document.getElementsByClassName(nodes[nodeKey].location+"Line");
        for (var i=0; i<lines.length; i++){
            rgb = rgbToRgbObj(lines[i].style.stroke);
            lines[i].style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.7)";
        }
        //if something changed update the lines
        if (nodePositions[nodeKey].height != nodeDiv.getBoundingClientRect().height){
            updateLines();
        }
    }
}

function onNodeMouseout(nodeKey){
	if (nodes.hasOwnProperty(nodeKey)){
		var line = document.getElementById(nodes[nodeKey].location+"Line");
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
        
        var lines = document.getElementsByClassName(nodes[nodeKey].location+"Line");
        for (var i=0; i<lines.length; i++){
            rgb = rgbToRgbObj(lines[i].style.stroke);
            lines[i].style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.1)";
        }
        //if something changed update the lines
        if (nodePositions[nodeKey].height != nodeDiv.getBoundingClientRect().height){
            updateLines();
        }
	}
}

function onSecondaryNodeMouseover(nodeKey){
	if (secondaryNodes.hasOwnProperty(nodeKey)) {
        for (var i=0; i<secondaryNodes[nodeKey].parents.length; i++){
            var line = document.getElementById(secondaryNodes[nodeKey].parents[i]+secondaryNodes[nodeKey].location+"Line");
            var rgb = rgbToRgbObj(line.style.stroke);
            line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.7)";
        }  
        
        var nodeDiv = document.getElementById(nodeKey);    
        var pArray = nodeDiv.getElementsByTagName('p');
        var p = pArray[0];
        p.style.backgroundColor = nodeDiv.style.color;
        p.style.color = "white";
        p.innerHTML = secondaryNodes[nodeKey].title;
        //if something changed update the lines
        if (nodePositions[nodeKey].height != nodeDiv.getBoundingClientRect().height){
            updateLines();
        }
    }
}

function onSecondaryNodeMouseout(nodeKey){
	if (secondaryNodes.hasOwnProperty(nodeKey)){
        for (var i=0; i<secondaryNodes[nodeKey].parents.length; i++){
            var line = document.getElementById(secondaryNodes[nodeKey].parents[i]+secondaryNodes[nodeKey].location+"Line");
            var rgb = rgbToRgbObj(line.style.stroke);
            line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.2)";
        }
	
		var nodeDiv = document.getElementById(nodeKey);        
        var pArray = nodeDiv.getElementsByTagName('p');
        var p = pArray[0];
        if(nodeKey.length > 30){
			p.innerHTML = secondaryNodes[nodeKey].abbrevTitle;
		}
        p.style.color = p.style.backgroundColor;
        p.style.backgroundColor = "transparent";
        //if something changed update the lines
        if (nodePositions[nodeKey].height != nodeDiv.getBoundingClientRect().height){
            updateLines();
        }        
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

//create divs for first layer of nodes
function drawNodes(){
	for (var nodeKey in nodes){
		var graphElement = document.getElementById("level1Nodes");
			
        var node = nodes[nodeKey];
        
        node.visual = document.createElement('div');
        //n.visual.className = 'node';
        node.visual.style.webkitTransform = "translate("+node.x+"px, "+node.y+"px)";
        
		if (node.location !== undefined){//visualize this
			node.visual.style.cursor = "pointer";
			node.visual.setAttribute('onclick','onNodeClick("'+nodes[nodeKey].location+'")');
		}
		node.visual.setAttribute('onmouseover','onNodeMouseover("'+nodeKey+'")');
		node.visual.setAttribute('onmouseout','onNodeMouseout("'+nodeKey+'")');
		node.visual.id = nodeKey;
		
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
				node.visual.className=nodeType;
				var rgb = hexToRgb(nodeColors[nodeType]);
				node.visual.style.color = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.5)";
			}
		
		//images are preloaded so we make copies of them		
		var img = FlairMaster.getFlairImage(nodes[nodeKey].mmdName).cloneNode(true);
		img.setAttribute('height',tier2size+'px');
		img.setAttribute('width',tier2size+'px');
		
		node.visual.appendChild(img);
		node.visual.appendChild(nodePara);
		graphElement.appendChild(node.visual);
		nodePositions[nodeKey] = node.visual.getBoundingClientRect();
	}
}

//decide which nodes to render
//might need to change this if asynchro gives trouble
function markNodesToRender(){
    var upperBound = 100;
//mark them all not to be rendered at first
    for (var nodeKey in secondaryNodes){
        secondaryNodes[nodeKey].rendered = false;
    }  
    //if we have less than the upper bound render them all
    if (Object.keys(secondaryNodes).length < upperBound){
        for (var nodeKey2 in secondaryNodes){
            secondaryNodes[nodeKey2].rendered = true;
        }
    }
    //else only render those with more than 1 parent
    //will need to be made more robust
    else {
        for (var nodeKey3 in secondaryNodes){
            if (secondaryNodes[nodeKey3].parents.length > 1){
                secondaryNodes[nodeKey3].rendered = true;
            }
            // else if the node is already drawn we need to erase it and its lines
            else if (document.getElementById(nodeKey) !== null){
                for (var p in secondaryNodes[nodeKey3].parents){
                    var parent = secondaryNodes[nodeKey3].parents[p];
                }
            }
        }
    }
}

//create divs for second layer of nodes
function drawSecondaryNodes(){
    
    //only render the top 200
    //markNodesToRender();
    
	for (var nodeKey in secondaryNodes){
        if (document.getElementById(nodeKey) === null && secondaryNodes[nodeKey].rendered){
            var graphElement = document.getElementById("level2Nodes");
            
            var node = secondaryNodes[nodeKey];
            
            node.visual = document.createElement('div');
            
            if (node.location !== undefined){//visualize this
                node.visual.style.cursor = "pointer";
                node.visual.setAttribute('onclick','onNodeClick("'+secondaryNodes[nodeKey].location+'")');
            }
            node.visual.setAttribute('onmouseover','onSecondaryNodeMouseover("'+nodeKey+'")');
            node.visual.setAttribute('onmouseout','onSecondaryNodeMouseout("'+nodeKey+'")');
            node.visual.id = nodeKey;

            var nodeText = "";
            if(nodeKey.length > 30)
                nodeText = secondaryNodes[nodeKey].abbrevTitle;
            else
                nodeText = nodeKey;
            var nodePara = document.createElement('p');
            nodePara.innerHTML = nodeText;
            nodePara.className = "nodeText";

            for (var nodeType in nodeColors){
                if (secondaryNodes[nodeKey].type == nodeType){
                    node.visual.className=nodeType;
                    var rgb = hexToRgb(nodeColors[nodeType]);
                    node.visual.style.color = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.5)";
                }
            }  
            //if color is not defined make it black
            if (node.visual.style.color === ""){
                node.visual.style.color = "rgba(" + 0 + "," + 0 + "," + 0 + ",.5)";
            }

            var img = FlairMaster.getFlairImage(secondaryNodes[nodeKey].mmdName).cloneNode(true);
            img.setAttribute('height',tier2size+'px');
            img.setAttribute('width',tier2size+'px');

            node.visual.appendChild(img);
            node.visual.appendChild(nodePara);
            graphElement.appendChild(node.visual);
            nodePositions[nodeKey] = node.visual.getBoundingClientRect();
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
		line.setAttribute('id', nodes[nodeKey].location+"Line");
		line.setAttribute('x1', nodePositions[nodeKey].left);
		line.setAttribute('x2', typePositions[nodes[nodeKey].type].right+2);
		line.setAttribute('y1', nodePositions[nodeKey].top+nodePositions[nodeKey].height/2);
		line.setAttribute('y2', typePositions[nodes[nodeKey].type].top+10);
		var rgb = hexToRgb(nodeColors[nodes[nodeKey].type]);
		line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.1)";
		line.setAttribute('stroke-width', 1);
		typeElement.appendChild(line);
	}	
}

//draws lines for children of one primary node
function drawSecondaryLines(parent){
	var lineElement = document.getElementById("lineSVG");
	
    for (var i in nodes[parent].children){
        var nodeKey = nodes[parent].children[i];
        if (secondaryNodes[nodeKey] !== undefined && document.getElementById(secondaryNodes[nodeKey].location+"Line") !== undefined){
            var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', parent+"Line");
            line.setAttribute('id', nodes[parent].location+secondaryNodes[nodeKey].location+"Line");
            line.setAttribute('x1', nodePositions[nodeKey].left);
            line.setAttribute('x2', nodePositions[parent].left+2);
            line.setAttribute('y1', nodePositions[nodeKey].top+nodePositions[nodeKey].height/2);
            line.setAttribute('y2', nodePositions[parent].top+nodePositions[parent].height/2);
            var rgb = hexToRgb(nodeColors[secondaryNodes[nodeKey].type]);
            line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.1)";
            line.setAttribute('stroke-width', 1);
            lineElement.appendChild(line);
        }
	}	

}

//maybe make more efficient by only updating changed ones
function updateLines(){
	for (var nodeKey in nodes){
        var doc = document.documentElement;
		var topOffset = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
        
        //update line ends
		var div = document.getElementById(nodeKey);
		nodePositions[nodeKey] = div.getBoundingClientRect();
		var line = document.getElementById(nodes[nodeKey].location+"Line");
		line.setAttribute('x1', nodePositions[nodeKey].left);
		line.setAttribute('y1', nodePositions[nodeKey].top+nodePositions[nodeKey].height/2 + topOffset);
        
        for (var i in nodes[nodeKey].children){
            var childKey = nodes[nodeKey].children[i];
            //update line ends
            var div2 = document.getElementById(childKey);
            if (div2 !== null){
                nodePositions[childKey] = div2.getBoundingClientRect();
                var line2 = {};
                if (secondaryNodes[childKey] !== undefined){
                    line2 = document.getElementById(nodes[nodeKey].location+secondaryNodes[childKey].location+"Line");
                }
                else if (nodes[childKey] !== undefined){
                    line2 = document.getElementById(nodes[nodeKey].location+nodes[childKey].location+"Line");
                }
                if (line2 !== null){
                    line2.setAttribute('x1', nodePositions[childKey].left);
                    line2.setAttribute('x2', nodePositions[nodeKey].left+2);
                    line2.setAttribute('y1', nodePositions[childKey].top + nodePositions[childKey].height/2 + topOffset);
                    line2.setAttribute('y2', nodePositions[nodeKey].top + nodePositions[nodeKey].height/2 + topOffset);
                }
            }
        }
	}
}

/* ================================================================== Let's render it! */

var MAX_STEP = 0;
var STEP_COUNT = 0;
var physicalInterval;
var NODE_RENDER_TIMER = 400;

function doPhysical(n)
{
	MAX_STEP = n;
	STEP_COUNT = 0;
	
	//while(STEP_COUNT < MAX_STEP)
	//	stepPhyscial();
	
	physicalInterval = setInterval(stepPhyscial, NODE_RENDER_TIMER);
}

var BEAUTY = 10;
var UGLY = -50;
var TOUCH_DISTANCE = 120;

var width = 0;
var height = 0;
var nodeCounter = 0;

function stepPhyscial()
{
	//console.log(STEP_COUNT);
	
	if(STEP_COUNT == MAX_STEP)
		clearInterval(physicalInterval);
		
	STEP_COUNT++;
	
	//resetLines();
	
    var n, node, p, pDist, pSpeed, pX, pY;
	// calculate attractive forces
	for(n = 0; n < secondaryNodesList.length; n++)
	{
		node = secondaryNodesList[n];
		node.vector = new Vector([0,0,0]);
		
		for(p = 0; p < node.parents.length; p++)
		{
			var parent = node.parents[p];
			pDist = Math.sqrt( Math.pow((parent.x - node.x), 2) + Math.pow((parent.y - node.y), 2) );
			
			if(pDist > TOUCH_DISTANCE-0)
			{
				pX = (parent.x - node.x) / pDist;
				pY = (parent.y - node.y) / pDist;
				
				var power = Math.sqrt(Math.pow(nodes.length - n, 2));
				
				pSpeed = (pDist / width) * BEAUTY * power; 
				
				pX *= pSpeed;
				pY *= pSpeed;
				
				node.vector = node.vector.add(new Vector([pX, pY, 0]));
			}
		}
	}	
	
	// add in replusive forces
	
	for(n = 0; n < secondaryNodesList.length; n++)
	{
		node = secondaryNodesList[n];
		
		var replusionVector = new Vector([0,0,0]);
		
		for(p = 0; p <nodes.length; p++)
		{
			
			if(n != p)
			{
				var other = nodes[p];
				pDist = Math.sqrt( Math.pow((other.x - node.x), 2) + Math.pow((other.y - node.y), 2) );
				
				if(pDist < TOUCH_DISTANCE)
				{
					pX = (other.x - node.x) / pDist;
					pY = (other.y - node.y) / pDist;
					
					pSpeed =  ((TOUCH_DISTANCE - pDist) / TOUCH_DISTANCE) * UGLY; 
									
					pX *= pSpeed;
					pY *= pSpeed;
					
					replusionVector = replusionVector.add(new Vector([pX, pY, 0]));
				}
			}
		}
		
		//replusionVector.items[0] /= nodes.length - 1; 
		//replusionVector.items[1] /= nodes.length - 1;
				
		node.vector = node.vector.add(replusionVector);
	}
	
	
	//step through 1 tick
	
	
	for(n = 1; n < secondaryNodesList.length; n++)
	{
		node = secondaryNodesList[n];
		
		if(!isNaN(node.vector.items[0]))
		{
			node.x += node.vector.items[0];
		}
		
		if(!isNaN(node.vector.items[1]))
		{
			node.y += node.vector.items[1];
		}
		
		if(node.x < 10)
			node.x = 10;
		else if(node.x > width-10)
			node.x = width-10;
			
		if(node.y < 10)
			node.y = 10;
		else if(node.y > height-10)
			node.y = height-10;
			
		/*
		if( node.first)
		{
			if(node.x < 500)
				node.x = 500;
			else if(node.x > 700)
				node.x = 700;
		}
		else
		{
			if(node.x < 700)
				node.x = 700;
			else if(node.x > width - 10)
				node.x = width -10;
		}
		*/
	}
	
	nodeCounter = 0;
	
	
	//setTimeout(moveNextNode, NODE_RENDER_TIMER);
	moveNextNode();
}

function moveNode(n)
{
	//console.log("moving node: "+n.parents.length);
	n.visual.style.webkitTransform = "translate("+n.x+"px, "+n.y+"px)";
    
	for(var i = 0; i < n.parents.length; i++)
	{
		updateLines();
        //drawLine(n.x, n.y, n.parents[i].x, n.parents[i].y);
	}
}

function moveNextNode()
{
	//console.log("moving next node");
	moveNode(secondaryNodesList[nodeCounter]);
	nodeCounter++;	
	
	if(nodeCounter < secondaryNodesList.length)
	{	
		//setTimeout(moveNextNode, NODE_RENDER_TIMER);
		moveNextNode();
	}
}
