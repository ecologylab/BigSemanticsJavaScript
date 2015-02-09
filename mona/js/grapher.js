/*global window, doc, document, Image, setInterval, clearInterval, Vector, getRandomArbitrary, setTimeout, doPhysical, graphWidth:true, graphHeight:true, primaryNodes:true, secondaryNodes:true, renderedNodesList:true, secondaryNodesList:true, nodeList:true, nodePositions:true, typePositions*/

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

var ATTRACTION_FORCE = 2;
var REPULSE_FORCE = -10;
var TOUCH_DISTANCE = 60;
var Y_TOUCH_DISTANCE = 30;
var X_OVERLAP = 200;

//adjust these to stretch entire graph accross x/y axis
var X_REPULSE_FACTOR = 4;
var Y_REPULSE_FACTOR = 1;
var X_ATTRACT_FACTOR = 0.25;
var Y_ATTRACT_FACTOR = 1;

var nodeCounter = 0;
var centroid;
var CENT_RADIUS = 350;
var CENT_DIST_SQ = Math.pow(CENT_RADIUS, 2);
var PRIMARY_CENT_DIST = Math.pow((CENT_RADIUS+20),2);
var SECONDARY_CENT_DIST = Math.pow((CENT_RADIUS+40),2);
var SECONDARY_CENT_DIST_ACTUAL = Math.sqrt(SECONDARY_CENT_DIST);

function setCentroid(){
    centroid = {
        x : -200,
        y : graphHeight/2
    };
    drawCircle(CENT_RADIUS+50);
}

function drawCircle(radius){
    //draw it
    var circle = document.createElement('div');
    circle.style.position = "absolute";
    var centerDivY = centroid.y - radius;
    circle.style.top = centerDivY + "px";
    circle.style.left = (300-radius) + "px";
    circle.style.border = "3px solid red";
    circle.style.width = (2*radius) + "px";
    circle.style.height = (2*radius) + "px";
    circle.style.borderRadius = radius + "px";
    //document.body.appendChild(circle);
}

function centroidDistance(node){
    return Math.pow((centroid.x - node.x), 2) + Math.pow((centroid.y - node.y), 2);
}

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
    
    for(n = 0; n < renderedNodesList.length; n++){
        node = renderedNodesList[n];
        
        if (!node.rendered) continue;
    
        var n, node, p, pDist, yDist, pSpeed, pX, pY, power, actualCentDist;
		node.vector = new Vector([0,0,0]);

        //if node is primary pull it toward the centroid
        var centDist = centroidDistance(node);
        //we use PRIMARY_CENT_DIST (square the radius plus 20 to avoid having to square root so much
        if (primaryNodes.hasOwnProperty(node.location) && centDist > PRIMARY_CENT_DIST){
            actualCentDist = Math.sqrt(centDist);
            pX = (centroid.x - node.x) / actualCentDist;
            pY = (centroid.y - node.y) / actualCentDist;

            power = Math.abs(renderedNodesList.length - n);

            pSpeed = (actualCentDist / (graphWidth*2)) * ATTRACTION_FORCE * power; 

            pX *= pSpeed;
            pY *= pSpeed;

            node.vector = node.vector.add(new Vector([pX, pY, 0]));
        }
        //pull slightly towards category while rendering primary nodes
        if (primaryNodes.hasOwnProperty(node.location) && renderedNodesList.length == Object.keys(primaryNodes).length){
            var catPos = typePositions[node.type]; 
            pY = (catPos.top - node.y); 
            pSpeed = (pY / (graphWidth)) * ATTRACTION_FORCE; 
            pY *= Math.abs(pSpeed)/4;
            
            node.vector = node.vector.add(new Vector([0, pY, 0]));    
        }
        
	    //don't let secondary nodes get too close to centroid
        if (secondaryNodes.hasOwnProperty(node.location) && centDist < SECONDARY_CENT_DIST){
            actualCentDist = Math.sqrt(centDist);
            pX = (centroid.x - node.x) / actualCentDist;
            pY = (centroid.y - node.y) / actualCentDist;

            pSpeed =  ((SECONDARY_CENT_DIST_ACTUAL - actualCentDist) / SECONDARY_CENT_DIST_ACTUAL) * REPULSE_FORCE * 2; 

            pX *= pSpeed * X_REPULSE_FACTOR;
            pY *= pSpeed * Y_REPULSE_FACTOR;
            
            node.vector = node.vector.add(new Vector([pX, pY, 0]));
        }
        
        // calculate attractive forces		
		for(p = 0; p < node.parents.length; p++){
			var parent = node.parents[p];
            if (!parent.rendered) continue;
            
			pDist = Math.sqrt( Math.pow((parent.x - node.x), 2) + Math.pow((parent.y - node.y), 2) );
			
			if(pDist > TOUCH_DISTANCE){
				pX = (parent.x - node.x) / pDist;
				pY = (parent.y - node.y) / pDist;
				
				power = Math.abs(renderedNodesList.length - n);
				
                //the more you multiply graph width by, the more of the space nodes take up
				pSpeed = (pDist / (graphWidth)) * ATTRACTION_FORCE * power; 
				
				pX *= pSpeed * X_ATTRACT_FACTOR;
				pY *= pSpeed * Y_ATTRACT_FACTOR;
				
				node.vector = node.vector.add(new Vector([pX, pY, 0]));
			}        
		}
                
        // add in repulsive forces
		var repulsionVector = new Vector([0,0,0]);
        
		for(p = 0; p <renderedNodesList.length; p++){		
			if(n != p){
				var other = renderedNodesList[p];
                if (!other.rendered) continue;
				pDist = Math.sqrt( Math.pow((other.x - node.x), 2) + Math.pow((other.y - node.y), 2) );
				yDist = Math.abs(other.y - node.y);

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
			
                    pX *= pSpeed * X_REPULSE_FACTOR;
                    pY *= pSpeed * Y_REPULSE_FACTOR;
					
					repulsionVector = repulsionVector.add(new Vector([pX, pY, 0]));
				}
                //if they are too close on the y move them
                else if(yDist < Y_TOUCH_DISTANCE && Math.abs(other.x - node.x) < X_OVERLAP){
                    pY = (other.y - node.y) / pDist;
					pSpeed =  ((Y_TOUCH_DISTANCE - yDist) / Y_TOUCH_DISTANCE) * REPULSE_FORCE; 
					pY *= pSpeed;
					repulsionVector = repulsionVector.add(new Vector([0, pY, 0]));
				}
			}
		}
				
		node.vector = node.vector.add(repulsionVector);
	
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

        //if node is too close to the centroid move it
        centDist = centroidDistance(node);
        if (centDist < CENT_DIST_SQ){
            //how much we need to move the node so that it will be out of the centroid
            var xDisplace = Math.sqrt(CENT_DIST_SQ - Math.pow((node.y - centroid.y),2)) + centroid.x - node.x; 
            node.x = node.x + xDisplace;
        }
        
        moveNode(node);
    }
}

function moveNode(n){
    if (n !== undefined){
        n.visual.style.webkitTransform = "translate("+n.x+"px, "+n.y+"px)";
        var z = graphWidth - n.x;
        n.visual.style.zIndex = Math.round(z);
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
        if (!primaryNodes[nodeKey].rendered) continue;
        
        var doc = document.documentElement;
		var topOffset = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
        var leftOffset = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
        
        //update line ends
		var div = document.getElementById(nodeKey);
		nodePositions[nodeKey] = div.getBoundingClientRect();
		var line = document.getElementById(primaryNodes[nodeKey].location+"Line");
		line.setAttribute('x1', nodePositions[nodeKey].left + leftOffset);
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
                    line2.setAttribute('x1', nodePositions[childKey].left + leftOffset);
                    line2.setAttribute('x2', nodePositions[nodeKey].left + 2 + leftOffset);
                    line2.setAttribute('y1', nodePositions[childKey].top + nodePositions[childKey].height/2 + topOffset);
                    line2.setAttribute('y2', nodePositions[nodeKey].top + nodePositions[nodeKey].height/2 + topOffset);
                }
            }
        }
	}
}

function updateNodeLines(node){
    if (!node.rendered) return;
    
    var doc = document.documentElement;
    var topOffset = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
    var leftOffset = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);

    nodePositions[node.location] = node.visual.getBoundingClientRect();

    var div, line;
    
    if (primaryNodes.hasOwnProperty(node.location)){
        line = document.getElementById(node.location+"Line");
        if (line !== null){
            line.setAttribute('x1', nodePositions[node.location].left + leftOffset);
            line.setAttribute('y1', nodePositions[node.location].top+nodePositions[node.location].height/2 + topOffset);
        }
    }
    
    for (var i in node.children){
        var child = node.children[i];
        if (!child.rendered) continue;
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
                line.setAttribute('x1', nodePositions[childKey].left + leftOffset);
                line.setAttribute('x2', nodePositions[node.location].left + 2 + leftOffset);
                line.setAttribute('y1', nodePositions[childKey].top + nodePositions[childKey].height/2 + topOffset);
                line.setAttribute('y2', nodePositions[node.location].top + nodePositions[node.location].height/2 + topOffset);
            }
        }
    }
    for (var p in node.parents){
        var parent = node.parents[p];
        if (!parent.rendered) continue;
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
                line.setAttribute('x1', nodePositions[parentKey].left + leftOffset);
                line.setAttribute('x2', nodePositions[node.location].left + 2 + leftOffset);
                line.setAttribute('y1', nodePositions[parentKey].top + nodePositions[parentKey].height/2 + topOffset);
                line.setAttribute('y2', nodePositions[node.location].top + nodePositions[node.location].height/2 + topOffset);
            }
        }
    }
}