//identical to rendereringTask, except that viewModelMap is a hashmap (see hashmap.js) that stores the viewModels of
//search results from Google Scholar and other sources. Probably only neccesary this's peculiar way of stripping
//search results out from their parent metadata, but if you pass one in it'll keep some hella swank mappings
//of UUID's to viewModels
function MinkRenderingTask(url, isRoot, clipping, container, extractor, renderer, viewModelMap)
{
  if (url != null)
  {
    this.url = url.toLowerCase();
  }
  
  this.container = container;
  this.clipping = clipping;
  
  this.metadata = null;  
  this.mmd = null;
  
  this.isRoot = isRoot;
  this.handler = this.metadataToModel;

  this.renderer = renderer;
  this.extractor = extractor;
  this.viewModelMap = viewModelMap;
}



MinkRenderingTask.prototype.metadataToModel = function(task, options){

  
	if(task.clipping && task.clipping.viewModel){
		
		var linkedFields = this.makeLinkedFieldList(task.fields, false);
		task.linkedFields = linkedFields;
	
		this.renderer(task);
		return task;

	}
	else{
		var metadataFields =
    	ViewModeler.createMetadata(task.isRoot, task.mmd,
                                    task.metadata, task.url);
	    // Is there any visable metadata?
		if (ViewModeler.hasVisibleMetadata(metadataFields))
		{			
			// If so, then build the HTML table	
			var styleMmdType = (task.expandedItem && task.expandedItem.mmdType && 
				task.expandedItem.mmdType.indexOf("twitter") != -1)? "twitter" : task.mmd.name; 
			var miceStyles = InterfaceStyle.getMiceStyleDictionary(styleMmdType);         //Adds the metadata type as an attribute to the first field in the MD
			//Adds the metadata type as an attribute to the first field in the MD
			metadataFields[0].parentMDType = task.mmd.name;
			task.fields = metadataFields;
			task.style = {styles: miceStyles};

			if(!task.options && options){		
				task.options = options;
			}

			var linkedFields = this.makeLinkedFieldList(task.fields, true);
			task.linkedFields = linkedFields;

			this.renderer(task);
			return task;
	    }
	    else{
	    	return null;
	    }
	}

    
}

MinkRenderingTask.prototype.makeLinkedFieldList = function(metadataFields, mapsParam){
	
	var list = [];
	
	for (var i = 0; i < metadataFields.length; i++){
		var metadataField = metadataFields[i];
		var addToMaps = false;
		if(this.viewModelMap){
			addToMaps = true;
		}	
		addToMaps = mapsParam && addToMaps;
		this.recursiveSearchForLinked(metadataField, list, true, addToMaps);
		
	}
		
		
		
	
	console.log(list);
	return list;
	
}

MinkRenderingTask.prototype.recursiveSearchForLinked = function(metadataField, list, isRoot, addToMaps, metadata){

	if(metadataField.child_type != null){
		
		//hard-ish coded case. should be expanded to include all md where pol\ymorphic thing = SR
		if(this.isSearchResultsCollection(metadataField)){
			var collectionLinks = {};
			collectionLinks.links = [];
			collectionLinks.name = metadataField.name;
			if(collectionLinks.field_as_count){
				compLinks.count = metadataField.field_as_count.value;
			}

			for (var i = 0; i < metadataField.value.length; i++){
				try{
					collectionLinks.links.push(this.getDestinationPageLink(metadataField.value[i], addToMaps, metadata));
				}catch(err){
					var wasteTime = 2;
				}
			}
			list.push(collectionLinks);
			return;
			
		}
		else if(metadataField.child_type != 'video' && metadataField.child_type != 'image' && metadataField.child_type != 'audio'){		
			var collectionLinks = {};
			collectionLinks.links = [];
			collectionLinks.name = metadataField.name;
			if(collectionLinks.field_as_count){
				compLinks.count = metadataField.field_as_count.value;
			}

			for (var j = 0; j < metadataField.value.length; j++){
				var childField = metadataField.value[j];
				if(childField.value.length > 0){
					if(childField.value[0].navigatesTo != null){
						collectionLinks.links.push(childField.value[0].navigatesTo);
					}else{
						if(this.recursiveIsLinked(childField) && (isRoot == true)){

							collectionLinks.links.push(childField.value[0].navigatesTo);

						}						
					}
				}
		
				
			}
			if(collectionLinks.links.length > 0){
				list.push(collectionLinks);
			
				}
			}
		}
		//composite
		else{
			var compLinks = {};
			compLinks.links = [];
			compLinks.name = metadataField.name;
			if(metadataField.field_as_count){
				compLinks.count = metadataField.field_as_count.value;
			}
			if(metadataField.value[0]){
				if(metadataField.value[0].navigatesTo != null){
					compLinks.links.push(metadataField.value[0].navigatesTo);
					list.push(compLinks);
				}else{
					for(var l = 0; l < metadataField.value.length; l++){
						if(typeof(metadataField.value[l]) === "object"){
							this.recursiveSearchForLinked(metadataField.value[l], list, addToMaps);
							if(this.recursiveIsLinked(metadataField.value[l]) && isRoot){
								
							}
						}

					}
				}
			}
		
		}
		
}

MinkRenderingTask.prototype.getDestinationPageLink = function(field, addToMaps, metadata){
	
	var kids = field.value.value;
		
	
	for (var i = 0; i < field.value.length; i++){
		if(field.value[i].name == 'destination_page'){
			try{
				var url = "mink::" + field.value[i].value[0].navigatesTo;
				url = url.toLowerCase();

				//hard-code for google scholar for right now
				if(addToMaps){
					this.viewModelMap.put(url, field);
				}
				return url;
			}catch(e){
				var url = this.uuidthing();
				if(addToMaps){
					this.viewModelMap.put(url, field);
				}			
				return url;

			}
			

		}
	}
	var url = this.uuidthing();
	if(addToMaps){
		this.viewModelMap.put(url, field);

	}
	return url;	
	
}

MinkRenderingTask.prototype.recursiveIsLinked = function(metadataField){
	
	if(metadataField.child_type != 'video' && metadataField.child_type != 'image' && metadataField.child_type != 'audio'){		
		
		var collectionLinks = {};
		collectionLinks.links = [];
		collectionLinks.name = metadataField.name;
		for (var j = 0; j < metadataField.value.length; j++){
			var childField = metadataField.value[j];
			if(typeof(childField.value) == "object"){
				if(childField.value.length > 0){
						if(childField.value[0].navigatesTo != null){
							return true;
						}else{
							return MinkRenderingTask.prototype.recursiveIsLinked(childField);
						}
					}
				}
				
			}
	
			
		
		
	}
	//composite
	else{
		var compLinks = {};
		compLinks.links = [];
		compLinks.name = metadataField.name;

		if(metadataField.value[0].navigatesTo != null){
			return true;
		}else{
			for(var l = 0; l < metadataField.value.length; l++){
				if(typeof(metadataField.value[l]) === "object")
					return MinkRenderingTask.prototype.recursiveIsLinked(metadataField.value[l]);

			}
		}
	}
	
	return false;

}


MinkRenderingTask.prototype.isSearchResultsCollection = function (field){
	try{
		if(field.value[0].composite_type=='SR'){
			return true;
		}else{
			return false;
		}
	}catch(err){
		return false;
	}

}



