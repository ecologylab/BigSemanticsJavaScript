 
/*global document, console, XMLHttpRequest, PrefixCollection, extractParams, getDomain, getSuffix, simplDeserialize, setTimeout*/

/******************************************************************************************
 * This contains everything needed to get MMD by url.
 * 
 * @author kade, andruid (original Java implementation)
 */

//the repo given to us by the service
var mmdRepo;

/**
* The map from meta-metadata name (currently simple name, but might be extended to fully
* qualified name in the future) to meta-metadata objects. This collection is filled during the
* loading process.
* 
*/
var repositoryByName = {};

/**
* Repository of documents with noAnchorNoQuery URL string as key.
*/
var documentRepositoryByUrlStripped = {};

/**
* Repository of documents with URL pattern as key.
*/
var documentRepositoryByPattern = {};

/**
* Repository of documents with domain as key.
*/
var documentRepositoryByDomain = {};

/**
* Repository by MIME type.
*/
var repositoryByMime = {};

/**
* Repository by suffix.
*/
var repositoryBySuffix = {};
                
var reselectMap = {};

/******************************************************************************************
 * Two objects for managing hierarchical collection of prefixes, automatically 
 * merging and removing entries, and providing a fast matching function.
 * 
 * @author kade, andruid (original Java implementation)
 */

var childPrefixMap = {};

var PrefixPhrase = function (parent, phrase){
    this.parent	= parent;
    this.phrase	= phrase;
    this.childPhraseMap = {};
    this.mappedObject = {};
};

PrefixPhrase.prototype.getPrefix = function(parent, prefixPhrase){
    var preexistingPrefix = this.childPhraseMap[prefixPhrase];
    var createNew = false;

    if (preexistingPrefix === undefined){
        preexistingPrefix = new PrefixPhrase(parent, prefixPhrase);
        this.childPhraseMap[prefixPhrase] = preexistingPrefix;
        createNew = true;
    }
    if (!createNew && this.isTerminal())
        return null;

    return preexistingPrefix;
};

PrefixPhrase.prototype.add = function(string, start, separator){
    var end	= string.length;
    var terminate = false;

    if (start == end)
        terminate =  true;
    else
    {		
        if (string[start] == separator)
            start++;
        if (start == end)
            terminate	= true;
    }
    if (terminate)
    {
        this.childPhraseMap = {};
        return this;
    }
    var nextSeparator = string.indexOf(separator, start);
    if (nextSeparator == -1)
        nextSeparator	= end;

    if (nextSeparator > -1)
    {
        var phraseString = string.substring(nextSeparator, start);
        // extra round of messing with synch, because we need to know if we
        // are creating a new Phrase
        var nextPrefixPhrase = this.getPrefix(this, phraseString);
        if (nextPrefixPhrase !== null)
        {
            return nextPrefixPhrase.add(string, nextSeparator, separator);
        }
        else
        {
            var newTerminal = this.childPhraseMap[phraseString];
            return newTerminal;
        }
    }
    else
    {
        return null;
    }
};

PrefixPhrase.prototype.getMatchingPrefix = function(input, start, seperator){
    if (this.isTerminal())
        return this;
    var seperatorIndex = input.indexOf(seperator, start);
    if(seperatorIndex>0)
    {
        var key = input.substring(start, seperatorIndex);
        var childPrefixPhrase = this.childPhraseMap[key];
        if (childPrefixPhrase !== undefined)
        {
            if (seperatorIndex < input.length) 
                return childPrefixPhrase.getMatchingPrefix(input, seperatorIndex+1, seperator); 
            else 
                return this;
        }
    }
    return null;
};

PrefixPhrase.prototype.isTerminal = function(){
    return Object.keys(this.childPhraseMap).length === 0;
};

//================

PrefixCollection.prototype = new PrefixPhrase();

PrefixCollection.prototype.constructor = PrefixCollection;

function PrefixCollection(separator, usePathFile) {
    this.separator = '/';
    this.usePathFile = false;
    for (var i in arguments){
        var arg = arguments[i];
        //for the char
        if (arg.length == 1){
            this.separator = arg;
        }
        //for the bool
        else if (typeof(arg) == Boolean){
            this.usePathFile = arg;
        }
    }
}

PrefixCollection.prototype.add = function(url){
    var host = getHost(url);		
    // domainPrefix is a child of this, the root (with no parent)
    var hostPrefix = this.getPrefix(null, host);

    // children of hostPrefix
    var pathStringToParse = this.usePathFile ? url : pathDirectoryString(url);
    return (hostPrefix !== null) ? hostPrefix.add(pathStringToParse, 0, this.separator) : childPrefixMap[host];
};

PrefixCollection.prototype.getMatchingPrefix = function(url){
    var host = getHost(url);		
    // domainPrefix is a child of this, the root (with no parent)
    var hostPrefix = this.childPhraseMap[host];

    // children of hostPrefix
    var path = getURLPath(url);
    return (hostPrefix === undefined) ? null : hostPrefix.getMatchingPrefix(path, 1, this.separator);	// skip over starting '/'
};

/**
* Collection of URL prefixes.
*/
var urlPrefixCollection = new PrefixCollection('/');

/******************************************************************************************/


//LEEEEETS GET IT STARTED IN HEEEEERE
initRepo();

function StrippedUrlEntry(metaMetadata, selector){
    this.metaMetadata = metaMetadata;
    this.selector = selector;
}

function RepositoryPatternEntry(pattern, metaMetadata, selector, isPatternFragment){
    this.pattern = pattern;
    this.metaMetadata = metaMetadata;
    this.selector = selector;
    this.isPatternFragment = isPatternFragment;
}

//enum
var MMSelectorType = {
	LOCATION : 0, 
    DOMAIN : 1, 
    SUFFIX_OR_MIME : 2, 
    DEFAULT : 3
};

/*
function testURLS(){
    var nullCount = 0;
    for (var i in testList){
        var mmd = getDocumentMM(testList[i], "tagName");
        if (mmd == repositoryByName.rich_document){
            nullCount++;
        }
    }
    console.log(nullCount);
    console.log(testList.length);
}
*/
                
/**
 * Load post inheritence repository
 */
function initRepo(){

	var serviceURL = "//api.ecologylab.net/BigSemanticsService/mmdrepository.jsonp";

	//make a request to the service for the mmd for the url
	var request = new XMLHttpRequest();
	request.open("GET", serviceURL, true);
	request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	
	request.onreadystatechange = function()
	{
		if(request.readyState == 4) {	
			if (request.status == 200) {
				var ans = request.responseText;
				//cludge ahead to remove null callback
                mmdRepo = JSON.parse(ans.substring(5, ans.length-2));
                initRepositoryByName();
                initializeLocationBasedMaps();
                initializeSuffixAndMimeBasedMaps();
            } else {
				//console.log("Error! XMLHttpRequest failed.");
			}
		}	

	};
	request.send();
}

function initRepositoryByName(){
    simplDeserialize(mmdRepo.meta_metadata_repository.repository_by_name);
    for (var i in mmdRepo.meta_metadata_repository.repository_by_name){
        var mmd = mmdRepo.meta_metadata_repository.repository_by_name[i];
        if (mmd.name)
            repositoryByName[mmd.name] = mmd;
        else
            break;
    }
}

function addReselectEntry(selector, mmd){
    reselectMap[selector] = mmd;
}

/**
* Get MetaMetadata. First, try matching by url_base. If this fails, including if the attribute is
* null, then try by url_prefix. If this fails, including if the attribute is null, then try by
* url_pattern (regular expression).
* 
* @param url
* @return MMD object
*/
function getDocumentMM(url) {
    if (!mmdRepo){
        return undefined;
    }
    
    var result;
    
    var noAnchorNoQueryPageString = trimAnchorQueryPageString(url);
    var strippedUrlEntries = documentRepositoryByUrlStripped[noAnchorNoQueryPageString];

   
    if (strippedUrlEntries){
      for (var i in strippedUrlEntries){
        var strippedUrlEntry = strippedUrlEntries[i];
        if (checkForParams(strippedUrlEntry.selector, url)){
          result = strippedUrlEntry.metaMetadata;
          break;
        }
      }
    }

    if (!result)
    {
      var matchingPrefix = urlPrefixCollection.getMatchingPrefix(url);
      if (matchingPrefix !== null)
      {
        result = matchingPrefix.mappedObject;
      }
    }
 
    if (!result)
    {
      var domain = getDomain(url);
      if (domain)
      {
        //  
        var entries = documentRepositoryByPattern[domain];
        
        if (entries){
          for (var e in entries){
            var entry = entries[e];
            
            try {  
                var regexMatchPart = new RegExp(entry.pattern); 
                var regexMatchWhole = new RegExp("^" + entry.pattern + "$"); 
                var matched = entry.isPatternFragment ? regexMatchPart.test(url) : regexMatchWhole.test(url);

                if (matched && checkForParams(entry.selector, url))
                {
                  result = entry.metaMetadata;
                  break;
                }
            }
            catch(error) {
                console.log("invalid regex");
            }
          }
        }
         
        if (!result)
        {
          result = documentRepositoryByDomain[domain];
          if (result)
            console.log("Matched by domain = " + domain + "\t" + result);
        }
        
      }
      
    }

    if (!result)
    {
        var suffix = getSuffix(url);

        if (suffix !== null)
          result = repositoryBySuffix[suffix];
    }
 
    //default to rich_document
    if (!result){
        //console.log("couldn't find for " + url);
        result = repositoryByName.rich_document;
    }
        
    return result;
  }

function getDocumentMMbyMime(mimeStr){
	if (repositoryByMime.hasOwnProperty(mimeStr)){
		return repositoryByMime[mimeStr];
	}
	else {
		return null;
	}
}

/**
* Initializes HashMaps for MetaMetadata selectors by URL or pattern. Uses the ClippableDocument
* and Document base classes to ensure that maps are only filled with appropriate matching
* MetaMetadata.
*/
function initializeLocationBasedMaps(){
    for (var name in repositoryByName){

        var metaMetadata = repositoryByName[name];
        
        var repositoryByUrlStripped = {};
        var repositoryByPattern = {};

        repositoryByUrlStripped = documentRepositoryByUrlStripped;
        repositoryByPattern = documentRepositoryByPattern;

        // We need to check if something is there already
        // if something is there, then we need to check to see if it has its cf pref set
        // if not, then if I am null then I win
        var selectors = metaMetadata.selectors;

        for (var i in selectors){
            var selector = selectors[i];        
            var reselectMetaMetadataName = selector.reselectMetaMetadataName;
    
            if (reselectMetaMetadataName !== undefined){
                var reselectMetaMetadata = repositoryByName[reselectMetaMetadataName];
                if (reselectMetaMetadata !== undefined){
                    reselectMetaMetadata.addReselectEntry(selector, metaMetadata);
                }
                continue;
            }
            

            var strippedPurl = selector.url_stripped;
            
            if (strippedPurl !== undefined) {
                var noAnchorNoQueryPageString = trimAnchorQueryPageString(strippedPurl);
                var strippedUrlEntries = repositoryByUrlStripped[noAnchorNoQueryPageString];
                
                if (strippedUrlEntries === undefined){
                    strippedUrlEntries = [];
                    repositoryByUrlStripped[noAnchorNoQueryPageString] = strippedUrlEntries;
                }
                
                strippedUrlEntries.push(new StrippedUrlEntry(metaMetadata, selector));
                
                metaMetadata.mmSelectorType = MMSelectorType.LOCATION;
            }
            else {
              var urlPathTree = selector.url_path_tree;
              if (urlPathTree !== undefined){
                var pp = urlPrefixCollection.add(urlPathTree);
                pp.mappedObject = metaMetadata;
                metaMetadata.mmSelectorType = MMSelectorType.LOCATION;
              }
               
              else
              {
                // use .pattern() for comparison
                var domain = selector.domain;
                var isPatternFragment = false;
                var urlPattern = selector.url_regex;
                if (urlPattern === undefined || urlPattern.length <= 0)
                {
                  urlPattern = selector.url_regex_fragment;
                  isPatternFragment = true;
                }
                if (domain !== undefined)
                {
                  if (urlPattern !== undefined)
                  {
                    var bucket = repositoryByPattern[domain];
                    if (bucket === undefined)
                    {
                      bucket = [];
                      repositoryByPattern[domain] = bucket;
                    }
                    bucket.push(new RepositoryPatternEntry(urlPattern, metaMetadata, selector, isPatternFragment));
                    metaMetadata.mmSelectorType = MMSelectorType.LOCATION;
                  } 
                  else
                  {
                    // domain only -- no pattern
                    documentRepositoryByDomain[domain] = metaMetadata;
                    metaMetadata.mmSelectorType = MMSelectorType.DOMAIN;
                  }
                }
                  
                else if (urlPattern !== undefined)
                {
                  console.log("<selector with url_regex=\"" + urlPattern + "\" but domain is not specified :(");
                }
              
              }  
            }
        }
    }
}

/**
* This initalizes the map based on mime type and suffix.
*/
function initializeSuffixAndMimeBasedMaps(){
    if (!repositoryByName)
      return;
    
    for (var name in repositoryByName)
    {
		var metaMetadata = repositoryByName[name];
		for (var s in metaMetadata.selectors){
            var selector = metaMetadata.selectors[s];  
			var suffixes = selector.suffixes;
			if (suffixes)
			{
				for (var i in suffixes)
				{
					var suffix = suffixes[i];
					if (!repositoryBySuffix.hasOwnProperty(suffix))
					{
						repositoryBySuffix[suffix] = metaMetadata;
						metaMetadata.mmSelectorType = MMSelectorType.SUFFIX_OR_MIME;
					}
				}
			}

			var mimeTypes = selector.mime_types;
			if (mimeTypes)
			{
				for (var j in mimeTypes)
				{
					var mimeType = mimeTypes[j];
					if (!repositoryByMime.hasOwnProperty(mimeType))
					{
						repositoryByMime[mimeType] = metaMetadata;
						metaMetadata.mmSelectorType = MMSelectorType.SUFFIX_OR_MIME;
					}
				}
			}
		}
    }
}

/******************************************************************************************
 * A number of utility functions for operation on urls
 */

//takes a url and remove query and anchor
function trimAnchorQueryPageString(url){
    return url.split("?")[0];
}

function checkForParams(selector, url){
    var params = selector.params;
    if (params !== undefined){
        var urlParams = extractParams(url, true);
        
        for (var i in params){
            var curParam = params[i];
            var paramName = curParam.name;
            var paramValue = curParam.value;
            var paramValueIsNot = curParam.value_is_not;
            var actualValue = urlParams[paramName];
            if (actualValue === undefined){
                actualValue = "";
            }

            if (paramValue !== undefined && paramValue.length > 0)
            {
                //not sure if allow_empty_value is right. couldn't find example
                var allowEmptyAndIsEmpty = curParam.allow_empty_value && actualValue.length === 0;
                if (!allowEmptyAndIsEmpty && paramValue != actualValue){
                    return false;
                }
            }

            if (paramValueIsNot !== undefined && paramValueIsNot.length > 0){
                if (paramValueIsNot == actualValue){
                    return false;
                }
            }
        }
    }
    return true;
}

function getHost(url){
    var urlObj = document.createElement("a");
    urlObj.href = url;
    return urlObj.hostname;
}

//gets the domain
function getDomain(url){
    // source: http://stackoverflow.com/questions/8498592/extract-root-domain-name-from-string
    var matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    var separate = matches[1].split('.');
    if (separate.length === 2)
         return matches[1];
    //if there are subdomains remove them
    else {
        //a little sloppy. this is to handle things like tate.org.uk
        while (separate.length > 2 && separate[1] != "org" && separate[1] != "com" && separate[1] != "edu" && separate[1] != "gov"){
            separate.shift();
        }
        return separate.join('.');
    }
}

function getURLPath(url){
    var urlObj = document.createElement("a");
    urlObj.href = url;
    return urlObj.pathname;
}

/**
 * @return The suffix of the filename, in whatever case is found in the input string.
 */
function getSuffix(url){
    var path = getURLPath(url);
    var result;
    if (path)
    {
        var lc = path.toLowerCase();
        var afterDot = lc.lastIndexOf('.') + 1;
        var lastSlash = lc.lastIndexOf('/');
        result = ((afterDot === 0) || (afterDot < lastSlash)) ? "" : lc.substring(afterDot);
    }
    return result;
}

/**
 * 
 * @return The directory of this, without protocol and host.
 */
function pathDirectoryString(url){
    var path = getURLPath(url);

    var lastSlash = path.lastIndexOf("/");
    var lastDot = path.lastIndexOf(".");
    if (lastDot > lastSlash)
        path = path.substring(0, lastSlash);

    return path;
}

function extractParams(url){
    var urlObj = document.createElement("a");
    urlObj.href = url;
    var params = {};
    
    // source: http://stackoverflow.com/questions/979975/how-to-get-the-value-from-url-parameter
    var paramsStr = urlObj.search.substring(1).split('&');
    
    for (var i = 0; i < paramsStr.length; i++) {
        var nv = paramsStr[i].split('=');
        if (!nv[0]) continue;
        params[nv[0]] = nv[1] || true;
    }
    
    return params;
}
