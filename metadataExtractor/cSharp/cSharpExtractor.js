function extractMetadataWithCallback(mmd) {
	rawExtraction = true;
	
	var returnVal = {};
	   
	var extractedMetadata = extractMetadata(document, mmd);
	returnVal[extractedMetadata['mm_name']] = extractedMetadata;	
	
	var returnValueString = JSON.stringify(returnVal);
	    
	//Special use for callbacks into the C# application
	CallBack.MetadataExtracted(returnValueString);
}
