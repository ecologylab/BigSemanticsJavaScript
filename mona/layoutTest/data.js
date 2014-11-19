function Node()
{
	this.x = 0;
	this.y = 0;
	this.color = DataDaddy.getRandomColor();
	
	this.parents = [];
	this.children = [];
};

Node.prototype.addParent = function(p)
{
	if(this.parents.indexOf(p) == -1)
	{
		this.parents.push(p);
		p.children.push(this);
	}
};

Node.prototype.getPlacedParents = function()
{
	var placed = [];
	
	for(var i = 0; i < this.parents; i++)
	{
		if(this.parents[i].placed)
		{
			placed.push(this.parents[i]);
		}
	}
	
	return placed;
};


function Vector(items)
{
	this.items = items;
}

Vector.prototype.add = function(other)
{
	var result = [];
    for(var i = 0; i < this.items.length; i++) {
        result.push( this.items[i] + other.items[i])
    }
    
    return new Vector(result);
};


var DataDaddy = {};

// number of parents =	1	2	3	4
DataDaddy.babyRatios = [70, 95, 100, 100];

DataDaddy.generateRandomData = function(n, m)
{
	this.nodes = [];
	
	// generate 1st level nodes
	for(var i = 0; i < n; i++)
	{
		var node = new Node();
		node.addParent(grandpa);
		node.first = true;
		this.nodes.push(node);	
	}
	
	// generate next level nodes
	for(var i = 0; i < m; i++)
	{
		var node = new Node();
		node.first = false;
		
		var parents = DataDaddy.getRandomParnets();
		
		for(var p = 0; p < parents.length; p++)
		{
			//console.log(p);
			node.addParent(parents[p]);
		}		
		
		this.nodes.push(node);
	}
	return this.nodes;
};

DataDaddy.getRandomParnets = function()
{
	var parents = [];
	var numParents = 0;
	
	var n = Math.floor(Math.random() * 100);
	for(var k = 0; k < DataDaddy.babyRatios.length; k++)
	{
		if(DataDaddy.babyRatios[k] > n )
		{
			numParents = k+1;
			break;
		}
	}
	//console.log(numParents);
		
	for(var j = 0; j < numParents; j++)
	{
		var p = Math.floor(Math.random() * this.nodes.length);
		
		parents.push(this.nodes[p]);
	}
	//console.log(parents.length);
	return parents;
};

DataDaddy.getRandomColor = function()
{
	var r = Math.floor(Math.random() * 255);
	var g = Math.floor(Math.random() * 255);
	var b = Math.floor(Math.random() * 255);
	
	return "rgb("+r+", "+g+", "+b+")";
}
