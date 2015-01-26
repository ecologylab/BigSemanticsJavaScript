function createPrettyPrint(obj)
{	
	var div = document.createElement('div');
		div.id = "prettyDisplay";
		
	if(isSimplTypeScope(obj))
	{				
		var scope = clone(obj["simpl_types_scope"]);
		simplGraphExpand(scope);
		
		// scope name
		var name = document.createElement('h3');
			name.innerText = scope["name"];
			div.appendChild(name);
		
		// classes
		
		var classesLabel = document.createElement('label');
			classesLabel.innerText = "Classes";
			div.appendChild(classesLabel);
		
		var classes = scope["class_descriptor"];
		for(var i = 0; i < classes.length; i++)
		{
			div.appendChild(createClassPrint(classes[i]));
		}
	}
	
	return div;
}

function createClassPrint(classDescriptor)
{
	var div = document.createElement('div');
		div.className = "classDisplay";
	
	var name = document.createElement('span');
		name.className = "className";
		name.innerText = classDescriptor["name"];
		div.appendChild(name);
	
	var tag = document.createElement('span');
		tag.className = "tagName";
		tag.innerText = classDescriptor["tag_name"];
		div.appendChild(tag);
		
	// fields
		
	var fieldsLabel = document.createElement('p');
		fieldsLabel.className = "label";
		fieldsLabel.innerText = "Fields";
		div.appendChild(fieldsLabel);
	
	var fields = classDescriptor["field_descriptor"];
	
	for(var i = 0; i < fields.length; i++)
	{
		div.appendChild(createFieldPrint(fields[i]));
	}		
	return div;
}

function createFieldPrint(fieldDescriptor)
{
	var div = document.createElement('div');
		div.className = "fieldDisplay";
	
	var name = document.createElement('span');
		name.className = "fieldName";
		name.innerText = fieldDescriptor["name"];
		div.appendChild(name);
	
	var tag = document.createElement('span');
		tag.className = "tagName";
		tag.innerText = fieldDescriptor["tag_name"];
		div.appendChild(tag);
		
	var type = document.createElement('span');
		type.className = "fieldType";
		type.innerText = fieldDescriptor["field_type"];
		div.appendChild(type);
		
	if(fieldDescriptor["element_class_descriptor"])
	{
		type.innerText += " - " + fieldDescriptor["element_class_descriptor"]["name"];
	}
	else if(fieldDescriptor["scalar_type"] != fieldDescriptor["field_type"])
	{
		type.innerText += " - " + fieldDescriptor["scalar_type"];
	}
		
	return div;
}