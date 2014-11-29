/*global window, doc, Image, fixWhiteSpace, rgbToRgbObj, getLabel, simplDeserialize, waitForNewMMD, MDC_rawMMD, getNodes, allNodeMDLoaded, document, setTimeout, MetadataLoader, console, hexToRgb, FlairMaster, sortNumber, median, MDC_rawMetadata, showMetadata, setInterval, clearInterval, Vector, getRandomArbitrary, doPhysical, graphWidth:true, graphHeight:true, primaryNodes:true, secondaryNodes:true, renderedNodesList:true, secondaryNodesList:true, nodeList:true, nodePositions:true, drawSecondaryNodes, updateAllLines, unrenderedNodesList:true*/


var MONA = {},
    cachedMMD = "",
    cachedNodeMetadata = {},
    focusTitle = "",
    nodeColors = {},
    nodeMetadata = {},
    typePositions = {},
    colorCount = 0,
    requestsMade = 0,
    tier4size = 15,
    tier3size = 20, 
    tier2size = 25, //also the base size
    tier1size = 30,
    NUM_STEPS = 50,
    colorArray = ["#009933", "#006699", "#CC9900", "#CC0000", "#CC00CC"],
    historyNodes = [],
    renderInterval;


function Node(type, title, location, mmdName, parent){
	this.type = type;
	this.title = title;
	this.abbrevTitle = title.substring(0, 40) + "...";
	this.location = location;
	this.mmdName = mmdName;
    this.children = [];
    
    if (parent !== null){
        this.parents = [parent];
        this.x = 300;
        this.y = parent.y + getRandomArbitrary(-2,2);
    }
    else {
        this.parents = [];
        this.x = 100;
        this.y = 100;          
    }
    this.rendered = false;
}

//rev your engines
MONA.initialize = function (){
	cachedNodeMetadata = {};
	nodeColors = {};
	primaryNodes = {};
    secondaryNodes = {};
	nodeMetadata = {};
	nodePositions = {};
	typePositions = {};
    renderedNodesList = [];
    unrenderedNodesList = [];
    secondaryNodesList = [];
    nodeList = [];
	colorCount = 0;
	requestsMade = 0;
    
	var graphElement = document.getElementById("graphArea"),
        typeElement = document.getElementById("typeArea"),
        linesElement = document.getElementById("lineSVG"),
        loadingElement = document.getElementById("loadingBar"),
        nodesLoading = document.createElement('div'),
        nodeMDLoading = document.createElement('div');
	
    graphWidth = graphElement.getClientRects()[0].width;
	graphHeight = graphElement.getClientRects()[0].height;
	
	linesElement.width = graphWidth;
	linesElement.height = graphHeight;
    
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
	//for now don't try to load mmd if there is more than 30. we don't want to kill the service
	if (Object.keys(primaryNodes).length > 30) {
		return;
	}
    //if there are no nodes display nothing
    if (Object.keys(primaryNodes).length === 0) {
        var loadingElementClear = document.getElementById("loadingBar");
        while (loadingElementClear.firstChild){
            loadingElementClear.removeChild(loadingElementClear.firstChild);
        }
        return;
	}
	for (var nodeKey in primaryNodes) {
		if (primaryNodes[nodeKey].location !== undefined) {
    		MetadataLoader.getMetadata(primaryNodes[nodeKey].location, "storeNodeMD", false);
			requestsMade++;
		}
	}
    
    //start the loading bar
    var loadingElement = document.getElementById("loadingBar");
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
		for (var nodeKey in primaryNodes){
			//kinda sloppy way to handle redirects
			if (primaryNodes[nodeKey].location !== undefined && (primaryNodes[nodeKey].location.indexOf(rawMetadata[key].location) > -1 || rawMetadata[key].location.indexOf(primaryNodes[nodeKey].location) > -1)){
				//show node as loaded
				nodeMetadata[nodeKey] = rawMetadata;
				nodeMDLoaded(nodeKey);
                getSecondaryNodes(rawMetadata, primaryNodes[nodeKey]);
			}
		}
	}
}

//when a single node's metadata is loaded update its colors
function nodeMDLoaded(nodeKey){
	//update color
	var rgb = hexToRgb(nodeColors[primaryNodes[nodeKey].type]);
	var div = document.getElementById(nodeKey);
	div.style.color = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",1)";
	
	//if incoming metadata is of a different type than we expected update the image
	//FIXME not sure if it works
	if (!nodeMetadata[nodeKey].hasOwnProperty(primaryNodes[nodeKey].mmdName)){
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
	var loadingElement = document.getElementById("loadingBar");
    loadingElement.removeChild(loadingElement.firstChild);
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
        newNode = new Node(mmdType, MDC_rawMetadata[mmdType].title, MDC_rawMetadata[mmdType].location, MDC_rawMetadata[mmdType].meta_metadata_name, null);
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
                                primaryNodes[currentField[i].location] = newNode;
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
									   primaryNodes[currentField[j][key2].location] = newNode;
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
                                
                                //if the node doesn't already exist create it. 
                                if (!secondaryNodes.hasOwnProperty(currentField[i].location) && !primaryNodes.hasOwnProperty(currentField[i].location)){
                                    newNode = new Node(key, currentField[i].title, currentField[i].location, currentField[i].meta_metadata_name, parent);
                                    secondaryNodes[currentField[i].location] = newNode;
                                    //update the parent nodes list of children
                                    parent.children.push(newNode);
                                }
            
                                //otherwise update the nodes parents
                                else if (secondaryNodes.hasOwnProperty(currentField[i].location)){
                                    secondaryNodes[currentField[i].location].parents.push(parent);
                                    parent.children.push(secondaryNodes[currentField[i].location]);
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
                                        if (!secondaryNodes.hasOwnProperty(currentField[j][key2].location) && !primaryNodes.hasOwnProperty(currentField[j][key2].location) && Object.keys(secondaryNodes).length < 400){
                                            newNode = new Node(key, currentField[j][key2].title, currentField[j][key2].location, currentField[j][key2].meta_metadata_name, parent);
                                            secondaryNodes[currentField[j][key2].location] = newNode;
                                            parent.children.push(newNode); 
                                        }
                                        else if (secondaryNodes.hasOwnProperty(currentField[j][key2].location)){
                                            secondaryNodes[currentField[j][key2].location].parents.push(parent);
                                            parent.children.push(secondaryNodes[currentField[j][key2].location]); 
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
                        if (currentField.title !== focusTitle && currentField.title != "See all colleagues of this author"){
                            if (!secondaryNodes.hasOwnProperty(currentField.location) && !primaryNodes.hasOwnProperty(currentField.location) && Object.keys(secondaryNodes).length < 400){
                                newNode = new Node(key, currentField.title, currentField.location, currentField.meta_metadata_name, parent);
                                secondaryNodes[currentField.location] = newNode;
                                parent.children.push(newNode);
                            }
                            else if (secondaryNodes.hasOwnProperty(currentField.location)){
                                secondaryNodes[currentField.location].parents.push(parent);
                                parent.children.push(secondaryNodes[currentField.location]);
                            }
                        }
					}
				}
			}
		}
	}
	
	drawSecondaryNodes();
    //drawSecondaryLines(parent);
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

//create divs for first layer of nodes
function drawNodes(){
	for (var nodeKey in primaryNodes){
		var graphElement = document.getElementById("graphArea");
			
        var node = primaryNodes[nodeKey];
        
        node.visual = document.createElement('div');
        //n.visual.className = 'node';
        node.visual.style.webkitTransform = "translate("+node.x+"px, "+node.y+"px)";
        
		if (node.location !== undefined){//visualize this
			node.visual.style.cursor = "pointer";
			node.visual.setAttribute('onclick','onNodeClick("'+primaryNodes[nodeKey].location+'")');
		}
		node.visual.setAttribute('onmouseover','onNodeMouseover("'+nodeKey+'")');
		node.visual.setAttribute('onmouseout','onNodeMouseout("'+nodeKey+'")');
		node.visual.id = nodeKey;
		
		var nodeText = "";
		if(nodeKey.length > 30)
			nodeText = primaryNodes[nodeKey].abbrevTitle;
		else
			nodeText = nodeKey;
		var nodePara = document.createElement('p');
		nodePara.innerHTML = nodeText;
		nodePara.className = "nodeText";
		
		for (var nodeType in nodeColors)
			if (primaryNodes[nodeKey].type == nodeType){
				node.visual.className=nodeType;
				var rgb = hexToRgb(nodeColors[nodeType]);
				node.visual.style.color = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.5)";
			}
		
		//images are preloaded so we make copies of them		
		var img = FlairMaster.getFlairImage(primaryNodes[nodeKey].mmdName).cloneNode(true);
		img.setAttribute('height',tier2size+'px');
		img.setAttribute('width',tier2size+'px');
		
		node.visual.appendChild(img);
		node.visual.appendChild(nodePara);
		graphElement.appendChild(node.visual);
        node.rendered = true;
		nodePositions[nodeKey] = node.visual.getBoundingClientRect();
        renderedNodesList.push(node);
	}
    doPhysical(20);
}

//create divs for second layer of nodes
function drawSecondaryNodes(){
    
	for (var nodeKey in secondaryNodes){
        if (document.getElementById(nodeKey) === null){
            var graphElement = document.getElementById("graphArea");
            
            var node = secondaryNodes[nodeKey];
            
            node.visual = document.createElement('div');
            
            if (node.location !== undefined){//visualize this
                node.visual.style.cursor = "pointer";
                node.visual.setAttribute('onclick','onNodeClick("'+secondaryNodes[nodeKey].location+'")');
            }
            node.visual.setAttribute('onmouseover','onSecondaryNodeMouseover("'+nodeKey+'")');
            node.visual.setAttribute('onmouseout','onSecondaryNodeMouseout("'+nodeKey+'")');
            node.visual.id = nodeKey;
            node.visual.style.webkitTransform = "translate("+node.x+"px, "+node.y+"px)";

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
            unrenderedNodesList.push(node);
        }
	}
    clearInterval(renderInterval);
    renderInterval = setInterval(renderNode, 2000);
}

function renderNode(){
    if (unrenderedNodesList.length >0 && renderedNodesList.length < 50){    
        var graphElement = document.getElementById("graphArea");
        var node = unrenderedNodesList.pop();
        node.rendered = true;
        renderedNodesList.push(node);
        
        if (node.parents.length > 0){
            node.y = node.parents[0].y + getRandomArbitrary(-2,2);
            node.visual.style.webkitTransform = "translate("+node.x+"px, "+node.y+"px)";
        }
        
        graphElement.appendChild(node.visual);
        nodePositions[node.location] = node.visual.getBoundingClientRect();
        drawLine(node);
    }
    else {
        clearInterval(renderInterval);
    }
    doPhysical(NUM_STEPS);
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
	for (var nodeKey in primaryNodes){
		var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		line.setAttribute('class', primaryNodes[nodeKey].type+"Line");
		line.setAttribute('id', primaryNodes[nodeKey].location+"Line");
		line.setAttribute('x1', nodePositions[nodeKey].left);
		line.setAttribute('x2', typePositions[primaryNodes[nodeKey].type].right+2);
		line.setAttribute('y1', nodePositions[nodeKey].top+nodePositions[nodeKey].height/2);
		line.setAttribute('y2', typePositions[primaryNodes[nodeKey].type].top+10);
		var rgb = hexToRgb(nodeColors[primaryNodes[nodeKey].type]);
		line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.1)";
		line.setAttribute('stroke-width', 1);
		typeElement.appendChild(line);
	}	
}

//draws lines for children of one primary node
function drawSecondaryLines(parent){
	var lineElement = document.getElementById("lineSVG");
	
    for (var i in parent.children){
        var node = parent.children[i];
        if (secondaryNodes[node.location] !== undefined){
            var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', parent.location+"Line");
            line.setAttribute('id', parent.location+node.location+"Line");
            line.setAttribute('x1', nodePositions[node.location].left);
            line.setAttribute('x2', nodePositions[parent.location].left+2);
            line.setAttribute('y1', nodePositions[node.location].top+nodePositions[node.location].height/2);
            line.setAttribute('y2', nodePositions[parent.location].top+nodePositions[parent.location].height/2);
            var rgb = hexToRgb(nodeColors[node.type]);
            line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.1)";
            line.setAttribute('stroke-width', 1);
            lineElement.appendChild(line);
        }
	}	

}

//draws lines for one newly rendered node
function drawLine(node){
	var lineElement = document.getElementById("lineSVG");
	
    var i, line, rgb;
    for (i in node.children){
        var child = node.children[i];
        if (secondaryNodes[node.location] !== undefined && child.rendered){
            line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', node.location+"Line");
            line.setAttribute('id', node.location+child.location+"Line");
            line.setAttribute('x1', nodePositions[child.location].left);
            line.setAttribute('x2', nodePositions[node.location].left+2);
            line.setAttribute('y1', nodePositions[child.location].top+nodePositions[child.location].height/2);
            line.setAttribute('y2', nodePositions[node.location].top+nodePositions[node.location].height/2);
            rgb = hexToRgb(nodeColors[child.type]);
            line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.1)";
            line.setAttribute('stroke-width', 1);
            lineElement.appendChild(line);
        }
	}	

    for (i in node.parents){
        var parent = node.parents[i];
        if (secondaryNodes[node.location] !== undefined){
            line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', parent.location+"Line");
            line.setAttribute('id', parent.location+node.location+"Line");
            line.setAttribute('x1', nodePositions[node.location].left);
            line.setAttribute('x2', nodePositions[parent.location].left+2);
            line.setAttribute('y1', nodePositions[node.location].top+nodePositions[node.location].height/2);
            line.setAttribute('y2', nodePositions[parent.location].top+nodePositions[parent.location].height/2);
            rgb = hexToRgb(nodeColors[node.type]);
            line.style.stroke = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",.1)";
            line.setAttribute('stroke-width', 1);
            lineElement.appendChild(line);
        }
	}
    
}
