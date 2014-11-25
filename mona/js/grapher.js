/*global window, doc, document, Image, setInterval, clearInterval, Vector, getRandomArbitrary, setTimeout, doPhysical, graphWidth:true, graphHeight:true, primaryNodes:true, secondaryNodes:true, renderedNodesList:true, secondaryNodesList:true, nodeList:true, nodePositions:true*/

/* ================================================================== Let's render it! */

var MAX_STEP = 0;
var STEP_COUNT = 0;
var physicalInterval;
var addNodeInterval;
var NODE_RENDER_TIMER = 100;

function doPhysical(n){
    MAX_STEP = n;
    STEP_COUNT = 0;
    clearInterval(physicalInterval);
    physicalInterval = setInterval(stepPhysical, NODE_RENDER_TIMER);
}

var ATTRACTION_FORCE = 10;
var REPULSE_FORCE = -1;
var TOUCH_DISTANCE = 100;
var Y_TOUCH_DISTANCE = 40;

var nodeCounter = 0;

function stepPhysical(x){
	
	if(STEP_COUNT >= MAX_STEP){
		clearInterval(physicalInterval);
        updateAllLines();
        setTimeout(updateAllLines, 100);
        setTimeout(updateAllLines, 200);
        setTimeout(updateAllLines, 300);
        setTimeout(updateAllLines, 400);
    }
		
	STEP_COUNT++;
  
    var n, node, p, pDist, pSpeed, pX, pY;
	// calculate attractive forces
	for(n = 0; n < renderedNodesList.length; n++){
		node = renderedNodesList[n];
		node.vector = new Vector([0,0,0]);
		
		for(p = 0; p < node.parents.length; p++){
			var parent = node.parents[p];
			pDist = Math.sqrt( Math.pow((parent.x - node.x), 2) + Math.pow((parent.y - node.y), 2) );
			
			if(pDist > TOUCH_DISTANCE){
				pX = (parent.x - node.x) / pDist;
				pY = (parent.y - node.y) / pDist;
				
				var power = Math.sqrt(Math.pow(renderedNodesList.length - n, 2));
				
				pSpeed = (pDist / graphWidth) * ATTRACTION_FORCE * power; 
				
				pX *= pSpeed;
				pY *= pSpeed;
				
				node.vector = node.vector.add(new Vector([pX, pY, 0]));
			}        
		}
        
        //if node is primary pull it left and to the center
        if (primaryNodes.hasOwnProperty(node.location)){
            pY = (node.y - graphHeight/2) / 10;
            pSpeed = (pY / graphWidth) * ATTRACTION_FORCE;
            pY *= pSpeed;

            node.vector = node.vector.add(new Vector([-100, pY, 0]));
        }
	}	
	
	// add in repulsive forces
	for(n = 0; n < renderedNodesList.length; n++){
		node = renderedNodesList[n];
		
		var repulsionVector = new Vector([0,0,0]);
        
        //if a node is there is a constant push right
        if (node.x < 100 && secondaryNodes.hasOwnProperty(node.location)){
            repulsionVector = repulsionVector.add(new Vector([30, 0, 0]));
        }
            
		for(p = 0; p <renderedNodesList.length; p++){
			
			if(n != p){
				var other = renderedNodesList[p];
				pDist = Math.sqrt( Math.pow((other.x - node.x), 2) + Math.pow((other.y - node.y), 2) );
				
				if(pDist < TOUCH_DISTANCE){
                    if(pDist < 1)
						pDist = 1;
					
                    pX = (other.x - node.x) / pDist;
					pY = (other.y - node.y) / pDist;
					
                    if(other.x - node.x === 0){
                        pX = getRandomArbitrary(-0.3,0);
                    }
                    if(other.y - node.y === 0){ 
                        pY = getRandomArbitrary(-0.3,0);
                    }
                    
					pSpeed =  ((TOUCH_DISTANCE - pDist) / TOUCH_DISTANCE) * REPULSE_FORCE; 
			
                    pX *= pSpeed;
					pY *= pSpeed;
					
					repulsionVector = repulsionVector.add(new Vector([pX, pY, 0]));
				}
                //if they are too close on the y move them
                else if(Math.abs(other.y - node.y) < Y_TOUCH_DISTANCE  && Math.abs(other.x - node.x) < TOUCH_DISTANCE){					
					pY = (other.y - node.y);
					pSpeed =  ((TOUCH_DISTANCE - pY) / Y_TOUCH_DISTANCE) * REPULSE_FORCE; 
					pY *= pSpeed;
					repulsionVector = repulsionVector.add(new Vector([0, pY, 0]));
				}
			}
		}
				
		node.vector = node.vector.add(repulsionVector);
	}
	
	
	//step through 1 tick
	for(n = 0; n < renderedNodesList.length; n++){
		node = renderedNodesList[n];
		
		if(!isNaN(node.vector.items[0])){
			node.x += node.vector.items[0];
		}
		
		if(!isNaN(node.vector.items[1])){
			node.y += node.vector.items[1];
		}	   
        
        //if a node is secondary we dont want it all the way left
        if (node.x < 30 && secondaryNodes.hasOwnProperty(node.location))
            node.x = 30;
        else if(node.x < 10)
            node.x = 10;
		else if(node.x > graphWidth-50)
			node.x = graphWidth-50;
			
		if(node.y < 50)
			node.y = 100;
		else if(node.y > graphHeight-50)
			node.y = graphHeight-100;
        
    }
	
	nodeCounter = 0;
	moveNextNode();
}

function moveNode(n){
    if (n !== undefined){
        n.visual.style.webkitTransform = "translate("+n.x+"px, "+n.y+"px)";
        updateNodeLines(n);
    }
}

function moveNextNode(){
	moveNode(renderedNodesList[nodeCounter]);
	nodeCounter++;	
	
	if(nodeCounter < renderedNodesList.length){	
		moveNextNode();
	}
}

//maybe make more efficient by only updating changed ones
function updateAllLines(){
	for (var nodeKey in primaryNodes){
        var doc = document.documentElement;
		var topOffset = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
        
        //update line ends
		var div = document.getElementById(nodeKey);
		nodePositions[nodeKey] = div.getBoundingClientRect();
		var line = document.getElementById(primaryNodes[nodeKey].location+"Line");
		line.setAttribute('x1', nodePositions[nodeKey].left);
		line.setAttribute('y1', nodePositions[nodeKey].top+nodePositions[nodeKey].height/2 + topOffset);
        
        for (var i in primaryNodes[nodeKey].children){
            var child = primaryNodes[nodeKey].children[i];
            var childKey = child.location;
            //update line ends
            var div2 = document.getElementById(childKey);
            if (div2 !== null){
                nodePositions[childKey] = div2.getBoundingClientRect();
                var line2 = {};
                if (secondaryNodes[childKey] !== undefined){
                    line2 = document.getElementById(primaryNodes[nodeKey].location+secondaryNodes[childKey].location+"Line");
                }
                else if (primaryNodes[childKey] !== undefined){
                    line2 = document.getElementById(primaryNodes[nodeKey].location+primaryNodes[childKey].location+"Line");
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

function updateNodeLines(node){
    var doc = document.documentElement;
    var topOffset = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
    nodePositions[node.location] = node.visual.getBoundingClientRect();

    var div, line;
    
    if (primaryNodes.hasOwnProperty(node.location)){
        line = document.getElementById(node.location+"Line");
        line.setAttribute('x1', nodePositions[node.location].left);
        line.setAttribute('y1', nodePositions[node.location].top+nodePositions[node.location].height/2 + topOffset);
    }
    
    for (var i in node.children){
        var child = node.children[i];
        var childKey = child.location;
        //update line ends
        div = document.getElementById(childKey);
        if (div !== null){
            nodePositions[childKey] = div.getBoundingClientRect();
            line = {};
            if (secondaryNodes[childKey] !== undefined){
                line = document.getElementById(node.location+child.location+"Line");
            }
            else if (primaryNodes[childKey] !== undefined){
                line = document.getElementById(node.location+primaryNodes[childKey].location+"Line");
            }
            if (line !== null){
                line.setAttribute('x1', nodePositions[childKey].left);
                line.setAttribute('x2', nodePositions[node.location].left+2);
                line.setAttribute('y1', nodePositions[childKey].top + nodePositions[childKey].height/2 + topOffset);
                line.setAttribute('y2', nodePositions[node.location].top + nodePositions[node.location].height/2 + topOffset);
            }
        }
    }
    for (var p in node.parents){
        var parent = node.parents[p];
        var parentKey = parent.location;
        //update line ends
        div = document.getElementById(parentKey);
        if (div !== null){
            nodePositions[parentKey] = div.getBoundingClientRect();
            line = {};
            if (primaryNodes[parentKey] !== undefined){
                line = document.getElementById(parent.location+node.location+"Line");
            }
            else if (secondaryNodes[parentKey] !== undefined){
                line = document.getElementById(node.location+secondaryNodes[parentKey].location+"Line");
            }
            if (line !== null){
                line.setAttribute('x1', nodePositions[parentKey].left);
                line.setAttribute('x2', nodePositions[node.location].left+2);
                line.setAttribute('y1', nodePositions[parentKey].top + nodePositions[parentKey].height/2 + topOffset);
                line.setAttribute('y2', nodePositions[node.location].top + nodePositions[node.location].height/2 + topOffset);
            }
        }
    }
}