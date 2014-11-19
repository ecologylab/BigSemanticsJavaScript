var FIRST_LEVEL_NODES = 10;
var OTHER_NODES = 30;

var NODE_RENDER_TIMER = 5;

var width = 0;
var height = 0;

var backgroundSVG = {};
var lineSVG = {};
var nodeSpace = {};

var grandpa = {};

var nodes = [];
var nodeCounter = 0;

var totalDistance = 0;

var nodeQueue = [];

function setup()
{
	
	
	nodeSpace = document.getElementById('nodeSpace');
	
	width = nodeSpace.getClientRects()[0].width;
	height = nodeSpace.getClientRects()[0].height;
	
	lineSVG = document.getElementById('lineSVG');
	lineSVG.width = width;
	lineSVG.height = height;
	
	grandpa = new Node();
	grandpa.color = "black";
	grandpa.placed = true;
	
	//grandpa.x = 250;//width / 2;
	grandpa.x = width / 2;
	
	grandpa.y = height /2;
	
	//grandpa.x  = Math.floor(Math.random() * (width - 40)) + 20;
	//grandpa.y = Math.floor(Math.random() * (height - 40)) + 20;
	
	nodes = DataDaddy.generateRandomData(FIRST_LEVEL_NODES, OTHER_NODES);
	
	nodes.unshift(grandpa);
	
	drawNodes();
};

function drawNodes()
{
	for(var n = 0; n < nodes.length; n++)
	{
		var node = nodes[n];
		
		
		drawNode(node);
	}
}

function showNodesCentered()
{	
	resetLines();
	
	for(var n = 1; n < nodes.length; n++)
	{
		var node = nodes[n];
		
		node.x  = grandpa.x;
		node.y = grandpa.y;
	}
	
	nodeCounter = 0;
	setTimeout(moveNextNode, NODE_RENDER_TIMER);
}


function showNodesLinkedRandom()
{	
	resetLines();
	
	for(var n = 1; n < nodes.length; n++)
	{
		var node = nodes[n];
		
		var canMove = true;
		var count = 0;
		
		do {
			
			canMove = true;
			node.x  = Math.floor(Math.random() * (width - 40)) + 20;
			node.y = Math.floor(Math.random() * (height - 40)) + 20;
			
			//node.visual.style.webkitTransform = "translate("+n.x+"px, "+n.y+"px)";
	/*
			for(var i = 0; i < node.parents.length; i++)
			{
				drawLine(node.x, node.y, node.parents[i].x, node.parents[i].y);
				
				var distance =  Math.sqrt( Math.pow((node.parents[i].x - node.x), 2) + Math.pow((node.parents[i].y - node.y), 2) );
				//console.log("line  : "+distance);
		
				var pDist = Math.sqrt( Math.pow((node.parents[i].x - node.x), 2) + Math.pow((node.parents[i].y - node.y), 2) );
					//console.log("pare  : "+pDist);
			}
		*/	
			for(var i = 0; i < node.parents.length; i++)
			{	
				if(node.parents[i].placed)
				{
						
					var pDist = Math.sqrt( Math.pow((node.parents[i].x - node.x), 2) + Math.pow((node.parents[i].y - node.y), 2) );
					//console.log("parent: "+pDist);
					if(pDist > TOUCH_DISTANCE)
					{						
						canMove = false;
					}
				}
			}
			if(count > 10000)
				break;
			count++;
		} while (canMove == false)
		
		node.placed = true;
		console.log("node: "+n);
		
	}
	
	nodeCounter = 0;
	setTimeout(moveNextNode, NODE_RENDER_TIMER);
}




function showNodesRandom()
{	
	resetLines();
	
	for(var n = 1; n < nodes.length; n++)
	{
		var node = nodes[n];
		
		node.x  = Math.floor(Math.random() * (width - 40)) + 20;
		node.y = Math.floor(Math.random() * (height - 40)) + 20;
	}
	
	nodeCounter = 0;
	setTimeout(moveNextNode, NODE_RENDER_TIMER);
}

function showNodesAverage()
{	
	resetLines();
	
	resetNodes();
	
	for(var n = 0; n < nodes.length; n++)
	{
		var node = nodes[n];
		
		if(node.getPlacedParents().length == 0)
		{
			node.x  = Math.floor(Math.random() * (width - 40)) + 20;
			node.y = Math.floor(Math.random() * (height - 40)) + 20;
		}
		else
		{
			var x = 0;
			var y = 0;
			
			var ps = node.getPlacedParents();
			
			for(var i = 0; i < ps.length; i++)
			{
				x += ps[i].x;
				y += pss[i].y;
			}
			
			x /= ps.length;
			y /= ps.length;
			
			node.x = x;
			node.y = y;
		}
		node.placed = true;
	}
	
	nodeCounter = 0;
	setTimeout(moveNextNode, NODE_RENDER_TIMER);
}

function stepAverage()
{
	resetLines();
	
	for(var n = 0; n < nodes.length; n++)
	{
		var node = nodes[n];
		
		if(node.parents.length == 0)
		{
			
		}
		else
		{
			var x = 0;
			var y = 0;
			
			var ps = node.parents;
			
			for(var i = 0; i < ps.length; i++)
			{
				x += ps[i].x;
				y += ps[i].y;
			}
			
			x /= ps.length;
			y /= ps.length;
			
			node.x = x;
			node.y = y;
		}
		node.placed = true;
	}
	
	nodeCounter = 0;
	setTimeout(moveNextNode, NODE_RENDER_TIMER);
}

var MAX_STEP = 0;
var STEP_COUNT = 0;
var physicalInterval;

function doPhysical(n)
{
	MAX_STEP = n;
	STEP_COUNT = 0;
	
	//while(STEP_COUNT < MAX_STEP)
	//	stepPhyscial();
	
	physicalInterval = setInterval(stepPhyscial, NODE_RENDER_TIMER);
}

var BEAUTY = 20;
var UGLY = -50;
var TOUCH_DISTANCE = 120;

function stepPhyscial()
{
	//console.log(STEP_COUNT);
	
	if(STEP_COUNT == MAX_STEP)
		clearInterval(physicalInterval);
		
	STEP_COUNT++;
	
	resetLines();
	
	// calculate attractive forces
	for(var n = 0; n < nodes.length; n++)
	{
		var node = nodes[n];
		node.vector = new Vector([0,0,0]);
		
		for(var p = 0; p < node.parents.length; p++)
		{
			var parent = node.parents[p];
			var pDist = Math.sqrt( Math.pow((parent.x - node.x), 2) + Math.pow((parent.y - node.y), 2) );
			
			if(pDist > TOUCH_DISTANCE-0)
			{
				var pX = (parent.x - node.x) / pDist;
				var pY = (parent.y - node.y) / pDist;
				
				var power = Math.sqrt(Math.pow(nodes.length - n, 2));
				
				var pSpeed = (pDist / width) * BEAUTY * power; 
				
				pX *= pSpeed;
				pY *= pSpeed;
				
				node.vector = node.vector.add(new Vector([pX, pY, 0]));
			}
		}
	}	
	
	// add in replusive forces
	
	for(var n = 0; n < nodes.length; n++)
	{
		var node = nodes[n];
		
		var replusionVector = new Vector([0,0,0]);
		
		for(var p = 0; p <nodes.length; p++)
		{
			
			if(n != p)
			{
				var other = nodes[p];
				var pDist = Math.sqrt( Math.pow((other.x - node.x), 2) + Math.pow((other.y - node.y), 2) );
				
				if(pDist < TOUCH_DISTANCE)
				{
					var pX = (other.x - node.x) / pDist;
					var pY = (other.y - node.y) / pDist;
					
					var pSpeed =  ((TOUCH_DISTANCE - pDist) / TOUCH_DISTANCE) * UGLY; 
									
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
	
	
	for(var n = 1; n < nodes.length; n++)
	{
		var node = nodes[n];
		
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


function doLink(n)
{
	MAX_STEP = n;
	STEP_COUNT = 0;
	
	//while(STEP_COUNT < MAX_STEP)
	//	stepPhyscial();
	
	physicalInterval = setInterval(stepLink, NODE_RENDER_TIMER);
}
function stepLink()
{
	//console.log(STEP_COUNT);
	
	if(STEP_COUNT == MAX_STEP)
		clearInterval(physicalInterval);
		
	STEP_COUNT++;
	
	resetLines();
	
	
	// add in replusive forces
	for(var n = 0; n < nodes.length; n++)
	{
		var node = nodes[n];
		node.vector = new Vector([0,0,0]);
		var replusionVector = new Vector([0,0,0]);
		
		for(var p = 0; p <nodes.length; p++)
		{
			
			if(n != p)
			{
				var other = nodes[p];
				var pDist = Math.sqrt( Math.pow((other.x - node.x), 2) + Math.pow((other.y - node.y), 2) );
				
				if(pDist < TOUCH_DISTANCE)
				{
					if(pDist < 1)
						pDist = 1;
						
					var pX = (other.x - node.x) / pDist;
					var pY = (other.y - node.y) / pDist;
					
					var pSpeed =  ((TOUCH_DISTANCE - pDist) / TOUCH_DISTANCE) * UGLY; 
									
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
	
	
	for(var n = 1; n < nodes.length; n++)
	{
		var node = nodes[n];
		var newX = node.x + node.vector.items[0];
		var newY = node.y + node.vector.items[1];
		
		
		var canMove = true;
		
		for(var p = 0; p < node.parents.length; p++)
		{
			var other = node.parents[p];
			var pDist = Math.sqrt( Math.pow((other.x - newX), 2) + Math.pow((other.y - newY), 2) );
			if(pDist > TOUCH_DISTANCE)
			{
				canMove = false;
				continue;
			}	
		}
		
		if(!canMove)
			continue;
		
		
		console.log(node.vector.items[0]);
		
		
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

function drawNode(n)
{
	n.visual = document.createElement('div');
	n.visual.className = 'node';
	n.visual.textContent = n.parents.length;
	n.visual.style.background = n.color;
	n.visual.style.webkitTransform = "translate("+n.x+"px, "+n.y+"px)";
	
	nodeSpace.appendChild(n.visual);
}

function moveNode(n)
{
	//console.log("moving node: "+n.parents.length);
	n.visual.style.webkitTransform = "translate("+n.x+"px, "+n.y+"px)";
	
	for(var i = 0; i < n.parents.length; i++)
	{
		drawLine(n.x, n.y, n.parents[i].x, n.parents[i].y);
	}
}

function moveNextNode()
{
	//console.log("moving next node");
	moveNode(nodes[nodeCounter]);
	nodeCounter++;	
	
	if(nodeCounter < nodes.length)
	{	
		//setTimeout(moveNextNode, NODE_RENDER_TIMER);
		moveNextNode();
	}
}

function drawLine(x1, y1, x2, y2)
{
	var distance =  Math.sqrt( Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2) );
	//console.log("line  : "+distance);
	totalDistance += distance;
		 
    var aLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
	    aLine.setAttribute('x1', x1);
	    aLine.setAttribute('y1', y1);
	    aLine.setAttribute('x2', x2);
	    aLine.setAttribute('y2', y2);
	    aLine.setAttribute('stroke', 'rgb(160,160,160)');
	    aLine.setAttribute('stroke-width', 1);
  
    lineSVG.appendChild(aLine);
}

function resetLines()
{
	totalDistance = 0;
	while (lineSVG.hasChildNodes())
	{
	    lineSVG.removeChild(lineSVG.lastChild);
	}
}

function resetNodes()
{
	for(var n = 0; n < nodes.length; n++)
	{
		var node = nodes[n];
		node.placed = false;
	}
}
