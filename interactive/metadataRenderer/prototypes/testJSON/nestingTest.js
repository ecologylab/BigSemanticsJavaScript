childA = {
	"title": {
		"name": "Title",
		"scalar_type": "String",
		"style": "metadata_h1",
		"value": "Child A"
	}	
};

childB = {
	"title": {
		"name": "Title",
		"scalar_type": "String",
		"style": "metadata_h1",
		"value": "Child B"
	},
	"children": {
		"name": "Children",
		"child_type": "child",
		"value": {
			"child": [
				childA
			]
		}
	}
};


childC = {
	"title": {
		"name": "Title",
		"scalar_type": "String",
		"style": "metadata_h1",
		"value": "Child C"
	},
	"children": {
		"name": "Children",
		"child_type": "child",
		"value": {
			"child": [
				childA,
				childB
			]
		}
	}
};

childD = {
	"title": {
		"name": "Title",
		"scalar_type": "String",
		"style": "metadata_h1",
		"value": "Child D"
	},
	"children": {
		"name": "Children",
		"child_type": "child",
		"value": {
			"child": [
				childA,
				childB,
				childC
			]
		}
	}
};

childE = {
	"title": {
		"name": "Title",
		"scalar_type": "String",
		"style": "metadata_h1",
		"value": "Child E"
	},
	"children": {
		"name": "Children",
		"child_type": "child",
		"value": {
			"child": [
				childA,
				childB,
				childC,
				childD
			]
		}
	}
};


testParent = {
	"title": {
		"name": "Title",
		"scalar_type": "String",
		"style": "metadata_h1",
		"value": "Parent"
	},
	"children": {
		"name": "Children",
		"child_type": "child",
		"value": {
			"child": [
				childC,
				childD,
				childE
			]
		}
	}
};

childB.children.value.child.push(testParent);
