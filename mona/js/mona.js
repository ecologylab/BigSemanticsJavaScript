/*global window, doc, Image, fixWhiteSpace, rgbToRgbObj, getLabel, simplDeserialize, waitForNewMMD, MDC_rawMMD, getNodes, allNodeMDLoaded, document, setTimeout, MetadataLoader, console, hexToRgb, FlairMaster, sortNumber, median, MDC_rawMetadata, showMetadata, setInterval, clearInterval, Vector, getRandomArbitrary, doPhysical, graphWidth:true, graphHeight:true, primaryNodes:true, secondaryNodes:true, renderedNodesList:true, secondaryNodesList:true, nodeList:true, nodePositions:true, drawSecondaryNodes, updateAllLines, Heap, deleteChildren*/

var MONA = {},
    cachedMMD = "",     //the old in focus meta-metadata. used to compare against current in focus meta-metadata
    focusTitle = "",    //the title of the in focus node. used to avoid creating copy of focus node in graph area
    nodeColors = {},    //maps node type to a color
    nodeMetadata = {},  //maps node location to that node's metatata
    typePositions = {}, //maps a type (reference, author, etc.), to its position on the screen
    pageMidHeight,      //the pixel vertical center of the page. used to center MICE/the graph area
    colorCount = 0,     //number of colors we have used. used to index clorArray
    COLOR_ARRAY = ["#009933", "#006699", "#CC9900", "#CC0000", "#CC00CC"], 
    requestsMade = 0,   //number of requests for metadata made
    T4_SIZE = 15,       //image sizes in pixels
    T3_SIZE = 20,
    T2_SIZE = 25,       //also the base size
    T1_SIZE = 30,
    NUM_STEPS = 100,    //number of iterations of grapher algorithm
    historyNodes = [],  //list of nodes display in history
    renderInterval,     //the rendering interval for setInterval.
    unrenderedNodesHeap,//prior to being drawn, nodes are stored here. sorted by number of parents
    GRAPH_ELEM,         //the html element of the graph area
    TYPE_ELEM,          //the html element of the type area
    LOAD_BAR_ELEM;      //the html element of the loading bar/spinner


function Node(type, title, location, mmdName, parent){
	this.type = type;
	this.title = title;
	this.abbrevTitle = title.substring(0, 40) + "...";
	this.location = location;
	this.mmdName = mmdName;
    this.children = [];
    
    if (parent !== null){
        this.parents = [parent];
        this.x = 250;
        this.y = parent.y + getRandomArbitrary(-2, 2);
    }
    else {
        this.parents = [];
        this.x = 100;
        this.y = pageMidHeight;          
    }
    this.rendered = false;
}

//rev your engines
MONA.initialize = function (){
	nodeColors = {};
	primaryNodes = {};
    secondaryNodes = {};
	nodeMetadata = {};
	nodePositions = {};
	typePositions = {};
    renderedNodesList = [];
    secondaryNodesList = [];
    nodeList = [];
    colorCount = 0;
	requestsMade = 0;
    
    unrenderedNodesHeap = new Heap(function(a, b) {
        return b.parents.length - a.parents.length;
    });
    
    GRAPH_ELEM = document.getElementById("graphArea");
    TYPE_ELEM = document.getElementById("typeArea");
    LOAD_BAR_ELEM = document.getElementById("loadingBar");
    
    var linesElement = document.getElementById("lineSVG"),
        miceElement = document.getElementById("mdcIce"),
        nodesLoading = document.createElement('div'),
        nodeMDLoading = document.createElement('div');
	    
    graphWidth = GRAPH_ELEM.getClientRects()[0].width;
	graphHeight = GRAPH_ELEM.getClientRects()[0].height;
	
	linesElement.width = graphWidth;
	linesElement.height = graphHeight;
    
    pageMidHeight = graphHeight/2;
    miceElement.style.top = pageMidHeight + "px";
    TYPE_ELEM.style.top = pageMidHeight + "px";
    
    deleteChildren(GRAPH_ELEM, TYPE_ELEM, linesElement, LOAD_BAR_ELEM);
    
	nodesLoading.innerHTML = "Loading Nodes...";
	GRAPH_ELEM.appendChild(nodesLoading);

    nodeMDLoading.innerHTML = "Loading Nodes Metadata...";
	LOAD_BAR_ELEM.appendChild(nodeMDLoading);
	
    waitForNewMMD();
};

//waits until the new metadata comes in before updating the nodes
function waitForNewMMD(){
    if (MDC_rawMMD === cachedMMD){
        setTimeout(waitForNewMMD, 100);
        return;
    }
    cachedMMD = MDC_rawMMD;
    deleteChildren(GRAPH_ELEM);
    getNodes();
}

//make requests for all the node metadata
function populateNodeMetadata(){
    
    deleteChildren(LOAD_BAR_ELEM);
    
	//for now don't try to load mmd if there is more than 30. we don't want to kill the service. also do nothing if there are no nodes
	if (Object.keys(primaryNodes).length > 30 || Object.keys(primaryNodes).length === 0) {
		return;
	}
    //make requests for all the first level nodes
	for (var nodeKey in primaryNodes) {
		if (primaryNodes[nodeKey].location !== undefined) {
    		MetadataLoader.getMetadata(primaryNodes[nodeKey].location, "storeNodeMD", false);
			requestsMade++;
		}
	}
    
    //start the loading bar
    var loadingDiv = document.createElement('div');
    var loadingText = document.createElement('p');
    loadingText.id="loadingText";
    
    var spinner = new Image(24,24);
    spinner.src = "img/spinner.gif";
    loadingDiv.appendChild(spinner);
    
    loadingText.innerHTML= "0 of " + requestsMade + " node metadata loaded";
    loadingDiv.appendChild(loadingText);
    
    LOAD_BAR_ELEM.appendChild(loadingDiv);
    
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
	for (var key in rawMetadata){
		console.log("got some metadata for " + rawMetadata[key].title);
		for (var location in primaryNodes){
            var rawNodeLoc = rawMetadata[key].location;
			if (location !== undefined && (location.indexOf(rawNodeLoc) > -1 || rawNodeLoc.indexOf(location) > -1)){
				nodeMetadata[location] = rawMetadata;
				nodeMDLoaded(location);
                getSecondaryNodes(rawMetadata, primaryNodes[location]);
			}
		}
	}
}

//when a single node's metadata is loaded update its colors
function nodeMDLoaded(nodeKey){
	var rgb = hexToRgb(nodeColors[primaryNodes[nodeKey].type]);
	var div = document.getElementById(nodeKey);
	div.style.color = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",1)";
}

//when all node metadata is loaded update image sizes and put the secondary nodes into the secondary nodes list
function allNodeMDLoaded(){
    LOAD_BAR_ELEM.removeChild(LOAD_BAR_ELEM.firstChild);
	updateImgSizes("acm_portal");
	updateImgSizes("acm_portal_author");
	updateAllLines();
    for (var nodeKey in secondaryNodes){
        secondaryNodesList.push(secondaryNodes[nodeKey]);
    }
}

//when we navigate add the old one to the history
function addToHistory(MDC_rawMetadata){
    var newNode;
    for (var mmdType in MDC_rawMetadata){
        var mmdObj = MDC_rawMetadata[mmdType];
        newNode = new Node(mmdType, mmdObj.title, mmdObj.location, mmdObj.meta_metadata_name, null);
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
        nodeText = newNode.abbrevTitle;
    else
        nodeText = newNode.title;
    
    var nodePara = document.createElement('p');
    nodePara.innerHTML = nodeText;
    nodePara.className = "nodeText";
    
    //images are preloaded so we make copies of them		
    var img = FlairMaster.getFlairImage(newNode.mmdName).cloneNode(true);
    img.setAttribute('height',T3_SIZE+'px');
    img.setAttribute('width',T3_SIZE+'px');

    div.appendChild(img);
    div.appendChild(nodePara);
    historyElement.insertBefore(div, historyElement.firstChild);
}

//make more important nodes bigger
function updateImgSizes(mmdType){
	var citationCountList = [];
	var foundOne = false;
	for (var nodeKey in nodeMetadata){
        var curNode = nodeMetadata[nodeKey];
		if (curNode[mmdType] !== undefined){
			foundOne = true;
			if (mmdType == "acm_portal" && curNode.acm_portal !== undefined && curNode.acm_portal.citations !== undefined){
				citationCountList.push(curNode.acm_portal.citations.length);
			}
			//currently ranks by total citations. up for debate if this is best
			else if (mmdType == "acm_portal_author" && curNode.acm_portal_author.publication_detail.citation_count !== undefined){
				citationCountList.push(parseInt(curNode.acm_portal_author.publication_detail.citation_count));
			}
			else { 
				citationCountList.push(0);
			}
		}
	}
	//if no nodes of mmdType exist, just return
	if (!foundOne) return;
	
    //get the medians 
    citationCountList = citationCountList.sort(sortNumber).reverse();
    console.log(citationCountList);
	var midMedian = median(citationCountList);
	var halfLength = Math.ceil(citationCountList.length / 2);    
	var leftSide = citationCountList.splice(0,halfLength);
	var rightSide = citationCountList;
	var topMedian = median(leftSide);
	var bottomMedian = median(rightSide);
		
	for (nodeKey in primaryNodes){
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
				img.setAttribute('height',T1_SIZE+'px');
				img.setAttribute('width',T1_SIZE+'px');
			}
			else if (citationCount < topMedian && citationCount >= midMedian){
				img.setAttribute('height',T2_SIZE+'px');
				img.setAttribute('width',T2_SIZE+'px');
			}
			else if (citationCount < midMedian && citationCount >= bottomMedian){
				img.setAttribute('height',T3_SIZE+'px');
				img.setAttribute('width',T3_SIZE+'px');
			}
			else {
				img.setAttribute('height',T3_SIZE+'px');
				img.setAttribute('width',T3_SIZE+'px');
			}
		}
	}
}

//extract what will be nodes from the focus's metadata
function getNodes(){
    simplDeserialize(MDC_rawMMD);
    for (var metadataType in MDC_rawMetadata){		
		for (var key in MDC_rawMetadata[metadataType]){
            //globaly store the title of the in-focus node
            if (key == "title"){
                focusTitle = MDC_rawMetadata[metadataType][key];
            }
            var newNode, curObj, firstMD;
			var currentField = MDC_rawMetadata[metadataType][key];
			if (currentField instanceof Array && currentField[0] instanceof Object){
                firstMD = currentField[0];
				if ("meta_metadata_name" in firstMD){
					if (firstMD.meta_metadata_name != "rich_document" && firstMD.meta_metadata_name != "image"){
                        key = getLabel(key);
						nodeColors[key] = COLOR_ARRAY[colorCount];
						colorCount++;
						for (var i = 0;  i < currentField.length; i++){
                            curObj = currentField[i];
							if ("title" in curObj){
                                newNode = new Node(key, curObj.title, curObj.location, curObj.meta_metadata_name, null);
                                primaryNodes[curObj.location] = newNode;
                            }
						}
					}
				}
				else {
					for (var key2 in currentField[0]){
                        firstMD = currentField[0][key2];
						if ("meta_metadata_name" in firstMD){
							if (firstMD.meta_metadata_name != "rich_document" && firstMD.meta_metadata_name != "image"){
								key = getLabel(key);
                                nodeColors[key] = COLOR_ARRAY[colorCount];
								colorCount++;				
								for (var j = 0;  j < currentField.length; j++){
                                    curObj = currentField[j][key2];
                                    if ("title" in curObj){
									   newNode = new Node(key, curObj.title, curObj.location, curObj.meta_metadata_name, null);
									   primaryNodes[curObj.location] = newNode;
                                    }
								}			
							}
						}
					}
				}
			}
			else if (currentField instanceof Object){
				if ("meta_metadata_name" in currentField && "location" in currentField){
					if (currentField.meta_metadata_name != "rich_document" && currentField.meta_metadata_name != "image"){
				        key = getLabel(key);
                        nodeColors[key] = COLOR_ARRAY[colorCount];
						colorCount++;
						newNode = new Node(key, currentField.title, currentField.location, currentField.meta_metadata_name, null);
						primaryNodes[currentField.location] = newNode;
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

function tooManyNodes(){
    if (Object.keys(secondaryNodes).length > 400) return true;
    else return false;
}

//extract what will be secondary nodes from an existing node's metadata
function getSecondaryNodes(nodeMMD, parent){
    simplDeserialize(nodeMMD);
    for (var metadataType in nodeMMD){
		for (var key in nodeMMD[metadataType]){
            var newNode, curObj, firstMD;
			var currentField = nodeMMD[metadataType][key];
			if (currentField instanceof Array && currentField[0] instanceof Object){
                firstMD = currentField[0];
				if ('meta_metadata_name' in firstMD){
					if (firstMD.meta_metadata_name != "rich_document" && firstMD.meta_metadata_name != "image"){
                        key = getLabel(key);
						for (var i = 0;  i < currentField.length; i++){
                            // we found a valid node!
                            curObj = currentField[i];
                            if (curObj.hasOwnProperty('title') && curObj.title !== focusTitle && !tooManyNodes()){
                                //if the node doesn't already exist create it. 
                                if (!(curObj.location in secondaryNodes) && !(curObj.location in primaryNodes)){
                                    newNode = new Node(key, curObj.title, curObj.location, curObj.meta_metadata_name, parent);
                                    secondaryNodes[curObj.location] = newNode;
                                    //update the parent nodes list of children
                                    parent.children.push(newNode);
                                }
                                //otherwise update the nodes parents
                                else if (curObj.location in secondaryNodes){
                                    secondaryNodes[currentField[i].location].parents.push(parent);
                                    parent.children.push(secondaryNodes[currentField[i].location]);
                                    unrenderedNodesHeap.updateItem(secondaryNodes[currentField[i].location]);
                                    drawLine(secondaryNodes[currentField[i].location]);
                                }
                            }

						}
					}
				}
				else {
					for (var key2 in currentField[0]){
                        firstMD = currentField[0][key2];
						if ("meta_metadata_name" in firstMD){
							if (firstMD.meta_metadata_name != "rich_document" && firstMD.meta_metadata_name != "image"){
								key = getLabel(key);				
								for (var j = 0;  j < currentField.length; j++){
                                    curObj = currentField[j][key2];
                                    if ("title" in curObj && curObj.title !== focusTitle){ 
                                        if (!(curObj.location in secondaryNodes) && !(curObj.location in primaryNodes) && !tooManyNodes()){
                                            newNode = new Node(key, curObj.title, curObj.location, curObj.meta_metadata_name, parent);
                                            secondaryNodes[curObj.location] = newNode;
                                            parent.children.push(newNode); 
                                        }
                                        else if (curObj.location in secondaryNodes){
                                            secondaryNodes[curObj.location].parents.push(parent);
                                            parent.children.push(secondaryNodes[curObj.location]);
                                            unrenderedNodesHeap.updateItem(secondaryNodes[curObj.location]);
                                            drawLine(secondaryNodes[curObj.location]);
                                        }
                                    }

                                }			
							}
						}
					}
				}
			}
			if (currentField instanceof Object){
				if ("meta_metadata_name" in currentField && "location" in currentField){
					if (currentField.meta_metadata_name != "rich_document" && currentField.meta_metadata_name != "image"){
				        key = getLabel(key);
                        if (currentField.title !== focusTitle && currentField.title != "See all colleagues of this author"){
                            if (!(currentField.location in secondaryNodes) && !(currentField.location in primaryNodes) && !tooManyNodes()){
                                newNode = new Node(key, currentField.title, currentField.location, currentField.meta_metadata_name, parent);
                                secondaryNodes[currentField.location] = newNode;
                                parent.children.push(newNode);
                            }
                            else if (currentField.location in secondaryNodes){
                                secondaryNodes[currentField.location].parents.push(parent);
                                parent.children.push(secondaryNodes[currentField.location]);
                                unrenderedNodesHeap.updateItem(secondaryNodes[currentField.location]);
                                drawLine(secondaryNodes[currentField.location]);
                            }
                        }
					}
				}
			}
		}
	}	
	drawSecondaryNodes();
}

function onNodeClick(location){
	document.getElementById("targetURL").value = location;
	showMetadata();
    addToHistory(MDC_rawMetadata);
	MONA.initialize();
}

function onNodeMouseover(nodeKey){
	if (primaryNodes.hasOwnProperty(nodeKey)) {
        var line = document.getElementById(primaryNodes[nodeKey].location+"Line");
        var rgb = hexToRgb(nodeColors[primaryNodes[nodeKey].type]);
        line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.7)";

        var nodeDiv = document.getElementById(nodeKey);    
        var pArray = nodeDiv.getElementsByTagName('p');
        var p = pArray[0];
        p.style.backgroundColor = nodeDiv.style.color;
        p.style.color = "white";
        p.innerHTML = primaryNodes[nodeKey].title;

        var lines = document.getElementsByClassName(primaryNodes[nodeKey].location+"Line");
        for (var i=0; i<lines.length; i++){
            rgb = rgbToRgbObj(lines[i].style.stroke);
            lines[i].style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.7)";
        }
        //if something changed update the lines
        if (nodePositions[nodeKey].height != nodeDiv.getBoundingClientRect().height){
            updateAllLines();
        }
    }
}

function onNodeMouseout(nodeKey){
	if (primaryNodes.hasOwnProperty(nodeKey)){
		var line = document.getElementById(primaryNodes[nodeKey].location+"Line");
		var rgb = hexToRgb(nodeColors[primaryNodes[nodeKey].type]);
		line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.2)";
	
		var nodeDiv = document.getElementById(nodeKey);        
        var pArray = nodeDiv.getElementsByTagName('p');
        var p = pArray[0];
        if(nodeKey.length > 30){
			p.innerHTML = primaryNodes[nodeKey].abbrevTitle;
		}
        p.style.color = p.style.backgroundColor;
        p.style.backgroundColor = "transparent";
        
        var lines = document.getElementsByClassName(primaryNodes[nodeKey].location+"Line");
        for (var i=0; i<lines.length; i++){
            rgb = rgbToRgbObj(lines[i].style.stroke);
            lines[i].style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.1)";
        }
        //if something changed update the lines
        if (nodePositions[nodeKey].height != nodeDiv.getBoundingClientRect().height){
            updateAllLines();
        }
	}
}

function onSecondaryNodeMouseover(nodeKey){
	if (secondaryNodes.hasOwnProperty(nodeKey)) {    
        var node = secondaryNodes[nodeKey];
        
        for (var i=0; i<node.parents.length; i++){
            var line = document.getElementById(node.parents[i].location+node.location+"Line");
            if (line !== null){
                var rgb = rgbToRgbObj(line.style.stroke);
                line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.7)";
            }  
        }
        
        var nodeDiv = document.getElementById(nodeKey);    
        var pArray = nodeDiv.getElementsByTagName('p');
        var p = pArray[0];
        p.style.backgroundColor = nodeDiv.style.color;
        p.style.color = "white";
        p.innerHTML = secondaryNodes[nodeKey].title;
        //if something changed update the lines
        if (nodePositions[nodeKey].height != nodeDiv.getBoundingClientRect().height){
            updateAllLines();
        }
    }
}

function onSecondaryNodeMouseout(nodeKey){
	if (secondaryNodes.hasOwnProperty(nodeKey)){
        var node = secondaryNodes[nodeKey];
        
        for (var i=0; i<node.parents.length; i++){
            var line = document.getElementById(node.parents[i].location+node.location+"Line");
            if (line !== null){
                var rgb = rgbToRgbObj(line.style.stroke);
                line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.2)";
            }
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
            updateAllLines();
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

function addVisual(node, nodeKey, nodeSet){
    node.visual = document.createElement('div');
           
    if (node.location !== undefined){
        node.visual.style.cursor = "pointer";
        node.visual.setAttribute('onclick','onNodeClick("'+nodeSet[nodeKey].location+'")');
    }
    node.visual.setAttribute('onmouseover','onSecondaryNodeMouseover("'+nodeKey+'")');
    node.visual.setAttribute('onmouseout','onSecondaryNodeMouseout("'+nodeKey+'")');
    node.visual.id = nodeKey;
    node.visual.style.webkitTransform = "translate("+node.x+"px, "+node.y+"px)";

    var nodeText = "";
    if(nodeKey.length > 30)
        nodeText = nodeSet[nodeKey].abbrevTitle;
    else
        nodeText = nodeKey;
    var nodePara = document.createElement('p');
    nodePara.innerHTML = nodeText;
    nodePara.className = "nodeText";

    for (var nodeType in nodeColors){
        if (nodeSet[nodeKey].type == nodeType){
            node.visual.className=nodeType;
            var rgb = hexToRgb(nodeColors[nodeType]);
            node.visual.style.color = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.5)";
        }
    }  
    //if color is not defined make it black
    if (node.visual.style.color === ""){
        node.visual.style.color = "rgba(" + 0 + "," + 0 + "," + 0 + ",.5)";
    }

    var img = FlairMaster.getFlairImage(nodeSet[nodeKey].mmdName).cloneNode(true);
    img.setAttribute('height',T2_SIZE+'px');
    img.setAttribute('width',T2_SIZE+'px');

    node.visual.appendChild(img);
    node.visual.appendChild(nodePara);
}

//create divs for first layer of nodes
function drawNodes(){
	for (var nodeKey in primaryNodes){
        var node = primaryNodes[nodeKey];
			
        addVisual(node, nodeKey, primaryNodes);

		GRAPH_ELEM.appendChild(node.visual);
        node.rendered = true;
		nodePositions[nodeKey] = node.visual.getBoundingClientRect();
        renderedNodesList.push(node);
	}
    doPhysical(20);
}

//create divs for second layer of nodes
function drawSecondaryNodes(){  
	for (var nodeKey in secondaryNodes){
        var node = secondaryNodes[nodeKey];
        if (node.visual === undefined){            
            addVisual(node, nodeKey, secondaryNodes);
            unrenderedNodesHeap.push(node);
        }
	}
    clearInterval(renderInterval);
    renderInterval = setInterval(renderNode, 2000);
}

function renderNode(){
    if (unrenderedNodesHeap.size() >0 && renderedNodesList.length < 50){    
        var node = unrenderedNodesHeap.pop();
        node.rendered = true;
        renderedNodesList.push(node);
        
        if (node.parents.length > 0){
            node.y = node.parents[0].y + getRandomArbitrary(-2,2);
            node.visual.style.webkitTransform = "translate("+node.x+"px, "+node.y+"px)";
        }
        
        GRAPH_ELEM.appendChild(node.visual);
        nodePositions[node.location] = node.visual.getBoundingClientRect();
        drawLine(node);
    }
    else {
        clearInterval(renderInterval);
    }
    doPhysical(NUM_STEPS);
}

function drawTypes(){
	for (var nodeType in nodeColors){
		var div = document.createElement('div');
		div.setAttribute('onmouseover','onTypeMouseover("'+nodeType+'")');
		div.setAttribute('onmouseout','onTypeMouseout("'+nodeType+'")');
		div.innerHTML = nodeType;
		div.className=nodeType;
		div.id=nodeType;
		div.style.color = nodeColors[nodeType];
		div.style.textAlign = "right";
		TYPE_ELEM.appendChild(div);
	}
	var children = TYPE_ELEM.children;
	for (var i = 0; i < children.length; i++) {
		var child = children[i];
		typePositions[child.id] = child.getBoundingClientRect();	
	}

}

function drawLines(){
	for (var nodeKey in primaryNodes){
		var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		line.setAttribute('class', primaryNodes[nodeKey].type+"Line");
		line.setAttribute('id', primaryNodes[nodeKey].location+"Line");
		line.setAttribute('x1', nodePositions[nodeKey].left);
		line.setAttribute('x2', typePositions[primaryNodes[nodeKey].type].right+2);
		line.setAttribute('y1', nodePositions[nodeKey].top+nodePositions[nodeKey].height/2);
		line.setAttribute('y2', typePositions[primaryNodes[nodeKey].type].top+10);
		var rgb = hexToRgb(nodeColors[primaryNodes[nodeKey].type]);
		line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.2)";
		line.setAttribute('stroke-width', 1);
        var linesElement = document.getElementById("lineSVG");
		linesElement.appendChild(line);
	}	
}

//draws lines for one newly rendered or updated node
function drawLine(node){
    if (node.rendered){
        drawRelativeLines(node, node.children, false);
        drawRelativeLines(node, node.parents, true);
    }
}

//draws either parent on child lines
function drawRelativeLines(node, relatives, isParents){
        var lineElement = document.getElementById("lineSVG");   
        for (var i in relatives){
            var relative = relatives[i];
            if (secondaryNodes[node.location] !== undefined && relative.rendered && document.getElementById(node.location+relative.location+"Line") === null){
                var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('class', node.location+"Line");
                //line ids are in the form parent.location+child.location+"Line"
                if (isParents){
                    line.setAttribute('id', relative.location+node.location+"Line");
                }
                else {
                    line.setAttribute('id', node.location+relative.location+"Line");
                }
                line.setAttribute('x1', nodePositions[relative.location].left);
                line.setAttribute('x2', nodePositions[node.location].left+2);
                line.setAttribute('y1', nodePositions[relative.location].top+nodePositions[relative.location].height/2);
                line.setAttribute('y2', nodePositions[node.location].top+nodePositions[node.location].height/2);
                var rgb = hexToRgb(nodeColors[relative.type]);
                line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.2)";
                line.setAttribute('stroke-width', 1);
                lineElement.appendChild(line);
            }
        }	
}
