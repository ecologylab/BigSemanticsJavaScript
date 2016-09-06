var bsService = new BSAutoSwitch(["elkanacmmmdgbnhdjopfdeafchmhecbf", "hjkedpbldlakhmdijnagklamhmgcikha", "eganfccpbldleckkpfomlgcbadhmjnlf", "gdgmmfgjalcpnakohgcfflgccamjoipd"]); 

var SemanticSultan = {

	DEBUG: false,

	documentMap: null,

	mmdMap: null,	

	waiting: null,

	BS_TIMEOUT: 3000, // time to wait until we try a request again

	MAX_WAITING: 1,

	init: function()
	{
		this.documentMap = new Map();
		this.mmdMap = new Map();

		this.waiting = new Map();
	},

	update: function()
	{
		// check the current waiting queue		
		//if(SemanticSultan.DEBUG) console.log("SemanticSultan: Pending requests: " + SemanticSultan.waiting.size);

		for (var value of SemanticSultan.waiting.values())
		{
			if(value.time + SemanticSultan.BS_TIMEOUT < Util.getCurrentUTCMilliTime())
			{
				// send another request 
				if(value.type == "metadata")
					SemanticSultan.getMetadata(value.key);

				else if(value.type == "mmd")
					SemanticSultan.getMMD(value.key);
			}
		}

		// check for missing metadata or MMD
		for (var value of SemanticSultan.documentMap.values())
		{
			if(SemanticSultan.waiting.size >= SemanticSultan.MAX_WAITING)
				break;

			if(value)
			{
				if(value.metadata == null)
				{
					// metadata needed
					SemanticSultan.getMetadata(value.location);
				}
			}
			else
				if(this.DEBUG) console.error("SemanticSultan: Null entry in documentMap.");
		}
		

		for (var [key, value] of SemanticSultan.mmdMap)
		{
			if(SemanticSultan.waiting.size >= SemanticSultan.MAX_WAITING)
				break;

			if(value == null)
			{
				// mmd needed
				SemanticSultan.getMMD(key);				
			}
		}

		SemanticSultan.updateDebugInfo();
	},

	addDocument: function(newDoc)
	{
		if(newDoc.location && newDoc.location != "")
		{
			if(this.documentMap.has(newDoc.location))
			{
				if(this.documentMap.get(newDoc.location).metadata == null)
				{	
					// TODO - do something smart about comparing the metadata and maybe updating the existing object - Nic L 8/1/16
					this.putDocumentInMap(newDoc);
				}
				else
					if(this.DEBUG) console.log("SemanticSultan: Attempted to add a document which is already in the map.");
			}
			else
			{
				this.putDocumentInMap(newDoc);		
			}

			// check document to see if it needs metadata
			var doc = this.documentMap.get(newDoc.location)

			if(doc.metadata != null  && doc.metadata != "")
			{
				// if the metadata is already loaded, add the mmd to the mmdMap so we know that we need it
				this.addMMD(doc.metadata.mm_name, null);
			}
		}
		else
		{
			if(this.DEBUG) console.error("SemanticSultan: Attempted to add an invalid document to the map <location missing>.");
		}
	},

	putDocumentInMap: function(newDoc)
	{
		if(this.documentMap.has(newDoc.location) && newDoc.metadata != null)
		{
			console.log(newDoc.metadata);
			this.documentMap.get(newDoc.location).metadata = newDoc.metadata;
			this.documentMap.get(newDoc.location).origin = newDoc.origin;
			this.documentMap.get(newDoc.location).extractionTime = newDoc.extractionTime;

			// the doc has been updated, need to message server with the new clipping semantic info
			//this.updateStoredSemanticsFor(newDoc.location);
		}	
		else
		{
			this.documentMap.set(newDoc.location, newDoc);
		}

		if(newDoc != null && newDoc.metadata != null)
		{
			this.waiting.delete(newDoc.location);
			this.possiblyCompletePendingSemanticDisplays();
		}
	},

	// BigSemantics wrapper functions
	getMetadata: function(location)
	{
		if(this.DEBUG) console.log("SemanticSultan: Requesting metadata for: "+location);

		if(this.waiting.has(location))
		{
			if(this.DEBUG) console.log("SemanticSultan: Already waiting for metadata for: "+location);

			// if its been too long, then send a new request
			if(this.waiting.get(location).time + this.BS_TIMEOUT < Util.getCurrentUTCMilliTime())
			{
				// send another request and update the time
				this.requestMetadata(location);
			}
		}
		else
		{
			this.requestMetadata(location);
		}
	},

	requestMetadata: function(location)
	{
		this.addWaiting(location, "metadata");

		// send request
		bsService.onReady(function(){
			bsService.loadMetadata(location, {}, function(err, md_and_mmd)
			{
				if (err)
				{
					if(SemanticSultan.DEBUG) console.error(err); 
					return;
				}

				if(SemanticSultan.DEBUG) console.log("SemanticSultan: loadMetadata result from " + bsService.bsImpl.constructor.name + ": ", md_and_mmd);

				var metadata = BSUtils.unwrap(md_and_mmd.metadata);

				var newDoc = {
						location: 		location,
						metadata: 		metadata,			
						origin: 		bsService.bsImpl.constructor.name//,
						//extractionTime: Util.getCurrentUTCMilliTime(),
						//id: 			Util.makeID()
				};

				var mmd = md_and_mmd.mmd;

				SemanticSultan.addDocument(newDoc);

				SemanticSultan.addMMD(mmd.name, mmd);
			});
		});
	},

	addMMD: function(mm_name, mmd)
	{
		if(this.mmdMap.has(mm_name))
		{
			if(this.DEBUG) console.log("SemanticSultan: Attempted to add a MMD which is already in the map.");
			// TODO - do something smart about comparing the MMD and maybe just use the most recent - Nic L 8/4/16
			//console.log(mmd);
			if(mmd != null)
			{
				this.putMMDInMap(mm_name, mmd);
			}
		}
		else
		{
			this.putMMDInMap(mm_name, mmd);
		}
	},

	putMMDInMap: function(mm_name, mmd)
	{
		this.mmdMap.set(mm_name, mmd);

		if(mmd != null)
		{
			this.waiting.delete(mm_name);
			this.possiblyCompletePendingSemanticDisplays();
		}
	},

	// BigSemantics wrapper functions
	getMMD: function(mm_name)
	{
		if(this.DEBUG) console.log("SemanticSultan: Requesting MMD for: "+mm_name);

		console.log(this.waiting.size);

		if(this.waiting.has(mm_name))
		{
			if(this.DEBUG) console.log("SemanticSultan: Already waiting for MMD for: "+mm_name);

			// if its been too long, then send a new request
			if(this.waiting.get(mm_name).time + this.BS_TIMEOUT < Util.getCurrentUTCMilliTime())
			{
				// send another request and update the time
				this.requestMMD(mm_name);
			}
		}
		else
		{
			this.requestMMD(mm_name);
		}
	},

	requestMMD: function(mm_name)
	{
		this.addWaiting(mm_name, "mmd");

		// send request
		bsService.onReady(function(){
			bsService.loadMmd(mm_name, {}, function(err, wrappedMMD)
			{
				if (err)
				{
					console.error(err); 
					return;
				}

				var mmd = BSUtils.unwrapMmd(wrappedMMD)

				if(SemanticSultan.DEBUG) console.log("SemanticSultan: loadMMD result from " + bsService.bsImpl.constructor.name + ": ", mmd);

				SemanticSultan.addMMD(mmd.name, mmd);
			});
		});
	},

	addWaiting: function(key, type)
	{
		if(this.waiting.has(key))
		{
			if(this.DEBUG) console.log("SemanticSultan: Was already waiting for: "+key);
		}

		this.waiting.set(key, {
			key: key,
			type: type//,
			//time: Util.getCurrentUTCMilliTime()
		});
	},

	getImmediately: function(targetDoc)
	{
		var doc = this.documentMap.get(targetDoc.location);

		// check if it needs the metadata, get it
		if(doc == null)
		{
			// if the doc is just missing, then add it and get it
			this.addDocument(targetDoc);
			this.requestMetadata(targetDoc.location);
			return false;
		}
		else if(doc.metadata == null)
		{
			// if the doc container is there but needs metadata
			this.requestMetadata(doc.location);
			return false;
		}
		else if(doc.metadata != null)
		{
			// check if mmd is there
			var mmd = this.mmdMap.get(doc.metadata.mm_name);
			if(mmd == null)
			{
				this.requestMMD(doc.metadata.mm_name);
				return false;
			}
		}

		// all the metadata and mmd is there, wow!
		return true;
	},

	showInfoForElements: function(elements)
	{
		document.getElementById("semanticsContainer").killChildren();

		var displaysString = this.createInfoDisplays(elements);

		this.elementsToOpen = elements;

		document.getElementById("semanticsContainer").innerHTML = displaysString;
		setTimeout(SemanticSultan.openSemantics, 60);
		//SemanticSultan.openInfos();
	},

	openSemantics: function()
	{
		for(var i = 0; i < SemanticSultan.elementsToOpen.length; i++)
		{
			UIGuy.showThing("semanticDisplay_"+SemanticSultan.elementsToOpen[i]._id, "height", 600);
		}
	},

	closeSemantics: function()
	{
		var openInfos = document.getElementsByClassName("semantic-display");

		for(var i = 0; i < openInfos.length; i++)
		{
			UIGuy.hideThing(openInfos[i].id, "height");
		}
	},

	createInfoDisplays: function(elements)
	{
		var displays = "";
		for(var i = 0; i < elements.length; i++)
		{
			var displayHTML = "<div id='semanticDisplay_"+elements[i]._id+"' class='semantic-display'>"

			if(elements[i].clipping.semantics == null)
			{
				elements[i].clipping.semantics = new Semantics();
			}

			if(!elements[i].clipping.semantics.visual || elements[i].clipping.semantics.loaded == false)
			{
				elements[i].clipping.semantics.buildVisual();
			}

			displayHTML += elements[i].clipping.semantics.visual;

			displayHTML +=" </div>";

			displays += displayHTML;
		}
		return displays;
	},

	updateDebugInfo: function()
	{
		var gotMetadatas = 0,
			pendingMetadatas = 0,
			gotMMDs = 0,
			pendingMMDs = 0;

		for (var value of SemanticSultan.documentMap.values())
		{
			if(value)
			{
				if(value.metadata != null)
					gotMetadatas++;
				else
					pendingMetadatas++;
			}
			else
				if(this.DEBUG) console.error("SemanticSultan: Null entry in documentMap.");
		}

		for (var value of SemanticSultan.mmdMap.values())
		{
			if(value)
			{
				gotMMDs++;
					
			}
			else
				pendingMMDs++;
		}

		var infoString = "Metadata: " + gotMetadatas;

		if(pendingMetadatas > 0)
		{
			infoString += " (" + pendingMetadatas + ")";
		}

		infoString += " | MMD: " + gotMMDs;

		if(pendingMMDs > 0)
		{
			infoString += " (" + pendingMMDs + ")";
		}

		document.getElementById("semanticSultanInfoContainer").innerHTML = infoString;
	},

	possiblyCompletePendingSemanticDisplays: function()
	{
        renderSemantics(docToRender);
        
        /*
		var displays = document.getElementsByClassName("ecologylab-metadataContainer");

		for(var i = 0; i < displays.length; i++)
		{
			// check for loading ones
			if(displays[i].firstChild.className == null || displays[i].firstChild.className != "ecologylab-metadataTableDiv")
			{
				var sourceID = displays[i].id.slice(9);

				var semantics = Session.mache.getSemanticsWithId(sourceID);

				if(semantics)
				{
					var source = semantics.getSourceById(sourceID);
					if(source)
					{
						displays[i].innerHTML = semantics.buildMetadataDisplayForSource(source);
					}
				}
			}
		}
        */
	},

	updateSemanticsFor: function(location)
	{
		for (var element of Session.mache.elements.values()) 
		{
		    if(element.containsLocation(location))
		    {
		    	element.sendUpdatedClipping();
		    }
		}
	},

	selectTab: function(event)
	{
		// get semantic id

		var tabDiv = event.target;

		while(tabDiv.className.indexOf("semantic-tab") == -1)
		{
			tabDiv = tabDiv.parentElement;

			if(tabDiv == null)
				return;
		}
		var sourceID = tabDiv.id.slice(12);	

		// hide all tabs and displays
		// select the correct tab and container
		var tabHeaders = document.getElementsByClassName("semantic-tab");
		for(var i = 0; i < tabHeaders.length; i++)
		{
			tabHeaders[i].className = "semantic-tab";

			if(tabHeaders[i].id == "semanticTab_" + sourceID)
				tabHeaders[i].className += " semantic-tab-selected";
		}

		var displays = document.getElementsByClassName("semantic-tab-container");
		for(var i = 0; i < displays.length; i++)
		{
			if(displays[i].id == "SEMANTIC_" + sourceID)
			{
				displays[i].style.display = "block";
				displays[i].style.visibility = "visible";
			}
			else
			{
				displays[i].style.display = "none";
				displays[i].style.visibility = "hidden";
			}
		}

		// update the primaryLocation - actually maybe not, should all users have the same primary metadata? - Nic L 8/19/16
		var semantics = Session.mache.getSemanticsWithId(sourceID);

		if(semantics)
		{
			//semantics.setSourceAsPrimary(sourceID);
			//semantics.updateOnServer();
		}
	},

	removeSource: function(event)
	{
		alert("are you sure you want to delete this source?");
	},
};