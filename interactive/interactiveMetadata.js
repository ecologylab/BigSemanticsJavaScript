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
		
		if(metadata[key].name != null)
			nameCol.innerHTML = toDisplayCase(metadata[key].name);
		
		if(typeof(metadata[key].value) == "object") {
			valueCol.appendChild(buildMetadataTable(metadata[key].value));
		}
		else {
			valueCol.innerHTML = metadata[key].value;
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