/** extractMetadataWithCallback
 * Extracts the metadata from the current document using the given
 * meta-metadata object and then calls a callback function.
 * 
 * This method is designed for use with an Awesomium WebView object.
 * 
 * @param mmd, the meta-metadata of the target document
 */
function extractMetadataWithCallback(mmd) {
	rawExtraction = true;
	
	var returnVal = {};
	   
	var extractedMetadata = extractMetadata(document, mmd);
	returnVal[extractedMetadata['mm_name']] = extractedMetadata;	
	
	var returnValueString = JSON.stringify(returnVal);
	    
	//Special use for callbacks into the C# application
	CallBack.MetadataExtracted(returnValueString);
}
