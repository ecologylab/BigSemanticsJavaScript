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
	
	var child;
	var k; //string of stuff for kids
	
	for (var i = 0; i < kids.length; i++)
	{
		var field = kids[i];
		//console.log(field.scalar);
		
		// render scalar types
		if(field.scalar != null)
		{
			field = field.scalar;
			//console.log(field);
			
			var mmdField = document.createElement('div');
				mmdField.className = "mmdField";
				//dont need prettifytext but if its not there undefinds show up
				mmdField.innerText = prettifyText(field["name"]); 
				
			var mmdFieldType = document.createElement('span');
				mmdFieldType.className = "mmdFieldType";
			
				mmdFieldType.innerText = " : " + prettifyText(field["scalar_type"]);
				
			mmdField.appendChild(mmdFieldType);
				
			slideOutVisual.appendChild(mmdField);
		}
		/*
		
		child = kids[i]['scalar'];
		k += "<p>kids[" + i + "]: " + "</p>";
		try {
			console.log(child['name']);
			k += "<p>name: " + child['name'] + "</p>" ;
		} catch(e) {
			console.log('qwer');
		}
		try {
			console.log(child['scalar']);
			k += "<p>scalar type: " + (typeof child['scalar']) + "</p>";
		} catch(e){
			console.log('asdf');
		}
		//k += "<br>";
		*/
	}
	
	//var str = printout(mmd);
	//var str;
	
	//str = "<p><b>type: " + mmd["name"] + "</b></p>";
	//str += "kids: " + mmd['kids'] + " ";
	//str += "<p>kids: </p>" + k;

	
	//var t = document.createTextNode(str);
	//m.appendChild(t);
	
	
	// make it display pretty
	
	// dynamically build html to render the mmd
	
	// iterate through the mmd to find all the fields
	
	// style it cool and legible
	
	//slideOutVisual.innerHTML = str + k;
	
}

function prettifyText(str)
{
	// replaces '_' with spaces
	str = str.replace('_', " ");
	
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

