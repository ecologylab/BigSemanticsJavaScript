var simplTypeScope = {
	types: [
		{
			name: "cat",
			fields: [
				{
					name: "color",
					type: "string"
				},
				{
					name: "whiskers",
					type: "int"
				}
			]		
		}
	]
};


function getType(typeName, typeScope)
{
	for(var i in typeScope.types)
	{
		if(simplTypeScope.types[i].name == typeName)
			return simplTypeScope.types[i];
	}
}

var indexOfFunctions = [];

function addFunctionToTypeBeforeInit(typeName, func, name)
{
	indexOfFunctions[typeName] = {name:name, func:func};
}


var typeScope = [];

function initType(typeName, obj)
{
	// search typeScope for type
	var type = getType(typeName, simplTypeScope);
		
	if( !(type.name in typeScope) )
	{
		typeScope[type.name] = function (type, obj)
		{
			for(var i in type.fields)
			{
				this[type.fields[i].name] = obj[type.fields[i].name];
			}	
			
			if (type.name in indexOfFunctions)
			{
				this[indexOfFunctions[type.name].name] = indexOfFunctions[type.name].func;
			}
		};
		
		
	}

	var newObj = new typeScope[type.name](type, obj);
	return newObj;
}


var rawCat = { color: "steve", whiskers: 7, simpl_type: "cat" };

function meow()
{
	console.log("meow");
}

addFunctionToTypeBeforeInit("cat", meow, "meow");


function poonitType(typeName, obj)
{
	// search typeScope for type
	var type = getType(typeName, simplTypeScope);
	
	
	var newObj = {};
		
	for(var i in type.fields)
	{
		newObj[type.fields[i].name] = obj[type.fields[i].name];
	}	
			
	if (type.name in indexOfFunctions)
	{
		newObj[indexOfFunctions[type.name].name] = indexOfFunctions[type.name].func;
	}

	return newObj;
}