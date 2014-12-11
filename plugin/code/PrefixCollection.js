/*global document*/

/**
 * An optimized data structure for managing a hierarchical collection of prefixes, automatically 
 * merging and removing entries, and providing a fast matching function.
 * 
 * @author andruid, kade
 */

var childPrefixMap = {};

function getHost(url){
    var urlObj = document.createElement("a");
    urlObj.href = url;
    return urlObj.hostname;
}

//furthur testing of this needed. Not sure about subdomains
function getDomain(url){
    // source: http://stackoverflow.com/questions/8498592/extract-root-domain-name-from-string
    var matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    var separate = matches[1].split('.');
    if (separate.length === 2)
         return matches[1];
    //there is a subdomain remove it
    else {
        separate.shift();
        return separate.join('.');

    }
}

function getPath(url){
    var urlObj = document.createElement("a");
    urlObj.href = url;
    return urlObj.pathname;
}

/**
 * @return The suffix of the filename, in whatever case is found in the input string.
 */
function getSuffix(url){
    var path = getPath(url);
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
    var path = getPath(url);

    var lastSlash = path.lastIndexOf("/");
    var lastDot = path.lastIndexOf(".");
    if (lastDot > lastSlash)
        path = path.substring(0, lastSlash);

    return path;
}

//currently not doing anything with empty param parameter. TODO
function extractParams(url, keepEmptyParams){
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



//===================================================

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

//===================================================

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
    var path = getPath(url);
    return (hostPrefix === undefined) ? null : hostPrefix.getMatchingPrefix(path, 1, this.separator);	// skip over starting '/'
};