var NUMBER_OF_QUESTIONS_PER_COND = 4;

var TREE_DEPTH = 8;
var CHILDREN_MIN = 0;
var CHILDREN_MAX = 2;
var MIN_T_DELTA = 10;
var MAX_T_DELTA = 1000;


var COND_1 = OvercomplicatedGraphFlowViz;
var COND_2 = GEazy;

var VizRef = {

	startItUp: function()
	{
		VizRef.runs = VizRef.generateRandomRuns();
	},

	getARandomTree: function()
	{
		VizRef.idIndex = 0;
		var root = {
			id: VizRef.getNextID(),
			t: 0,
			children: VizRef.generateNodes(0, TREE_DEPTH-1)
		};

		while(VizRef.getDepth(root) < TREE_DEPTH)
		{
			VizRef.idIndex = 0;
			root = {
				id: VizRef.getNextID(),
				t: 0,
				children: VizRef.generateNodes(0, TREE_DEPTH-1)
			};
		}

		return root;
	}

	generateRandomRuns: function()
	{
		// run is a question instance
		// a run contains: viz condition, data set, question,
		//    later it will contain: correct bool, time to answer, question distance

		var dataSets = [];

		for(var i = 0; i < NUMBER_OF_QUESTIONS_PER_COND; i++)
		{
			// create a single root node
			// reset the global id helper
			VizRef.idIndex = 0;
			var root = {
				id: VizRef.getNextID(),
				t: 0,
				children: VizRef.generateNodes(0, TREE_DEPTH-1)
			};

			while(VizRef.getDepth(root) < TREE_DEPTH)
			{
				VizRef.idIndex = 0;
				root = {
					id: VizRef.getNextID(),
					t: 0,
					children: VizRef.generateNodes(0, TREE_DEPTH-1)
				};
			}

			dataSets.push(root);
		}

		// conditions could be one then the other or interweaved
		// conditions could have the same questions or different ones


	},

	generateNodes: function(currentT, maxDepth)
	{
		// list of root nodes
		var nodes = [];

		if(maxDepth > 0)
		{
			// how many children to create
			var childrenCount = VizRef.getRandomNumber(CHILDREN_MIN, CHILDREN_MAX);

			for(var i = 0; i < childrenCount; i++)
			{
				var newT = currentT + VizRef.getRandomNumber(MIN_T_DELTA, MAX_T_DELTA);
				var node = {
					id: VizRef.getNextID(),
					t: newT,
					children: VizRef.generateNodes(newT, maxDepth - 1)
				};

				nodes.push(node);
			}
		}

		// node = { t: random number 0 - 1000, children: [nodes array] }

		return nodes;
	},

	getDepth: function(node)
	{
		var maxChildDepth = 0;

		for(var i = 0; i < node.children.length; i++)
		{
			var childDepth = VizRef.getDepth(node.children[i]);
			if( childDepth > maxChildDepth)
				maxChildDepth = childDepth;
		}

		return maxChildDepth + 1;
	},

	getRandomNumber: function(bottom, top)
	{
		return Math.floor(Math.random() * ((top + 1) - bottom)) + bottom;
	},

	getNextID: function()
	{
		if(VizRef.idIndex <= 26)
		{
			return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[VizRef.idIndex++];
		}
		else
		{
			var id = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(VizRef.idIndex / 26)-1];
			id += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(VizRef.idIndex % 26)-1];
			VizRef.idIndex++;
			return id;
		}

		return 'err';
	}

};
