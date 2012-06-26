function createMetadataDisplay(metadata) {
	console.log("creating metadata display");
	var container = document.createElement('div');
	container.className = "metadataContainer";
	
	var documentTitle = document.createElement('h4');
	container.appendChild(buildMetadataTable(metadata));
	
	return container;
}


function buildMetadataTable(metadata) {
	var table = document.createElement('table');
	
	for(var key in metadata) {
		var row = document.createElement('tr');
		var nameCol = document.createElement('td');
		var valueCol = document.createElement('td');
		
		if(metadata[key].scalar_type != null) {
			
			if(metadata[key].scalar_type == "String") {
				if(metadata[key].name != null)
					nameCol.innerHTML = metadata[key].name;//toDisplayCase(metadata[key].name);				
				
				valueCol.innerHTML = metadata[key].value;
			}
				
			else if(metadata[key].scalar_type == "ParsedURL") {
				var aTag = document.createElement('a');
					aTag.innerText = metadata[key].name;
					aTag.href = metadata[key].value;
					
				valueCol.appendChild(aTag);
			}			
		}
		else if(metadata[key].child_type != null){
			if(metadata[key].name != null)
				nameCol.innerHTML = metadata[key].name;//toDisplayCase(metadata[key].name);	
			
			var childList = metadata[key].value[metadata[key].child_type]
			
			for(i in childList)
				valueCol.appendChild(buildMetadataTable(childList[i]));
			
		}
		
		row.appendChild(nameCol);
		row.appendChild(valueCol);
		table.appendChild(row)
	}
	
	return table;
}






function toDisplayCase(string) {
	var strings = string.split('_');
	console.log(strings);
	var display = "";
	for( var s in strings) {
		display += strings[s].charAt(0).toUpperCase() + strings[s].slice(1) + " ";
	}
	console.log(display);
	return display;
}