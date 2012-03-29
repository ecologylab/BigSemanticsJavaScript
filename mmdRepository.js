function getDocumentMMD(url) {
	var result = null;
    if (url != null) {
		//String noAnchorNoQueryPageString = uri.GetLeftPart(UriPartial.Path);
        //result = documentRepositoryByUrlStripped.TryGetValue(noAnchorNoQueryPageString);

		if (result == null) {
			var domain = uri.Domain;
            if (domain != null) {
            	var entries = [];
                //_documentRepositoryByPattern.TryGetValue(domain, out entries);

                if (entries != null) {
                	foreach (RepositoryPatternEntry entry in entries) {
                    	Match matcher = entry.Pattern.Match(uri.ToString());
                        if (matcher.Success) {
                        	result = entry.MetaMetadata;
                            break;
                        }
                    }
                }
            }
		}

		if (result == null) {
       		String suffix = uri.Suffix;

           	if (suffix != null)
            	result = GetMMBySuffix(suffix);
        }
        if (result == null)
      	{
        	String domain = uri.Domain;
        	_documentRepositoryByDomain.TryGetValue(domain, out result);

        	if (result != null)
            	Console.WriteLine("Matched by domain = " + domain + "\t" + result);
    	}

    	if (result == null)
        	result = GetMMByName(tagName);
	}
    return result;		
}