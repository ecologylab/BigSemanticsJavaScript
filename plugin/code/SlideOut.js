/**
 * Creates the slide-out to display information about the meta-metadata, metadata, and clippings available on the page.
 */
function buildSlideOut(document)
{
	// create new div
	slideOutVisual = document.createElement("div");
	
	// assign propertyies and default styling
	slideOutVisual.className = "slide";
	
	// add new div to the page
	document.body.appendChild(slideOutVisual);
}


/**
 * Display the given meta-metadata in the slideout so that user can see it
 * @param mmd, meta-metadata json object
 */
function renderMMD(mmd)
{
	//var m = document.createElement("p");
	
	var typeHeader = document.createElement('h1');
		typeHeader.className = "mmdTypeTitle";
		typeHeader.innerText = prettifyText(mmd["name"]);
		
	slideOutVisual.appendChild(typeHeader);
	
	var kids = mmd['kids'];
	
	// dynamically build html to render the mmd
	for (var i = 0; i < kids.length; i++)
	{	
		// iterate through the mmd to find all the fields
		var field = kids[i];
		
		// render scalar types
		if(field.scalar != null)
		{
			field = field.scalar;
			
			if (prettifyText(field["name"]) === undefined) continue;
			
			var mmdField = document.createElement('div');
				mmdField.className = "mmdField";
				mmdField.innerText = prettifyText(field["name"]) + " : "; 
				
			console.log(prettifyText(field["name"]));
			
			var mmdFieldType = document.createElement('span');
				mmdFieldType.className = "mmdFieldType";
				mmdFieldType.innerText = prettifyText(field["scalar_type"]);
			
			mmdField.appendChild(mmdFieldType);
			slideOutVisual.appendChild(mmdField);
			
			if (field["xpaths"] != null)
			{
				var fieldx = field["xpaths"];
				console.log(fieldx);

				for (var j = 0; j < fieldx.length; j++) {
					var mmdXPath = document.createElement('div');
						mmdXPath.className = "mmdXPath";
						mmdXPath.innerText = fieldx[j];
						
						var nodes = document.evaluate(field[j], document, null, XPathResult.ANY_TYPE, null);
						console.log(nodes);
						//var result = nodes.iterateNext();
						//console.log(result);
						var result = nodes.iterateNext();
						
						while (result != null)
						{
							console.log('asdf');
							//console.log(result.childNodes[0].nodeValue);
							console.log(result.textContent);
							//result = result.iterateNext();
						}
						
					slideOutVisual.appendChild(mmdXPath);
				}
		
			}
			
		}
		
		if(field.composite != null) 
		{
			field = field.composite;	
			
			if (prettifyText(field["name"]) === undefined) continue;
			
			var mmdField = document.createElement('div');
				mmdField.className = "mmdField";
				mmdField.innerText = prettifyText(field["name"]) + " : ";
				
			console.log(prettifyText(field["name"]));	
				
			var mmdFieldType = document.createElement('span');
				mmdFieldType.className = "mmdFieldType";
				mmdFieldType.innerText = prettifyText(field["type"]);
			
			mmdField.appendChild(mmdFieldType);
			slideOutVisual.appendChild(mmdField);
			
			if (field["xpaths"] != null)
			{
				var fieldx = field["xpaths"];
				console.log(fieldx);

				for (var j = 0; j < fieldx.length; j++) {
					var mmdXPath = document.createElement('div');
						mmdXPath.className = "mmdXPath";
						mmdXPath.innerText = fieldx[j];
						
					slideOutVisual.appendChild(mmdXPath);
				}
		
			}
			
		}
		
		if(field.collection != null)
		{
			field = field.collection;
			
			if (prettifyText(field["name"]) === undefined) continue;
			
			var mmdField = document.createElement('div');
				mmdField.className = "mmdField";
				mmdField.innerText = prettifyText(field["name"]) + " : ";
			
			console.log(prettifyText(field["name"]));
			
			if (field['child_scalar_type'] != null)
			{
				var mmdFieldType = document.createElement('span');
					mmdFieldType.className = "mmdFieldType";
					mmdFieldType.innerText = prettifyText(field["child_scalar_type"]);
			} else {
				var mmdFieldType = document.createElement('span');
					mmdFieldType.className = "mmdFieldType";
					mmdFieldType.innerText = prettifyText(field["child_type"]);
			}
			
			mmdField.appendChild(mmdFieldType);
			slideOutVisual.appendChild(mmdField);
			
			if (field["xpaths"] != null)
			{
				var fieldx = field["xpaths"];
				console.log(fieldx);

				for (var j = 0; j < fieldx.length; j++) {
					var mmdXPath = document.createElement('div');
						mmdXPath.className = "mmdXPath";
						mmdXPath.innerText = fieldx[j];
						
					slideOutVisual.appendChild(mmdXPath);
				}
		
			}
			
		}

	}
	
	// make it display pretty
	
	// style it cool and legible
	
}


function xpath(path) {
	var data = document.evaluate(path,document,null,XPathResult.ANY_TYPE,null);
	return data;
}

function prettifyText(str)
{
	// replaces '_' with spaces
	try 
	{
		str = str.replace('_', " ");
	} catch (e) { }
	
	
	return str;
}


/**
 * Toogles the Slide-Out, by sliding it in or out of view
 */ 
function toggleSlideOut()
{
	if(slideOutVisual == null)
		buildSlideOut();

	// check to see if the slide-out is open
	if (parseInt(slideOutVisual.style.width) > 0)
	{
		//go in if slideout is out
		goIn();
	}
	else
	{
		// else, make slideout come out
		goOut();
	}	
}

/**
 * slides the slideout out
 */
function goOut() 
{
	slideOutVisual.style.width = SLIDEOUT_WIDTH + "px";
	slideOutVisual.style.boxShadow = "6px 0 16px 5px #888";
}

/**
 * slides the slideout back in
 */
function goIn()
{
	slideOutVisual.style.width = 0 + "px";
	slideOutVisual.style.boxShadow = "none";
}

