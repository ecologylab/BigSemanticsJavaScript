
var MicroDataTools = {};

//store mmd of types here after we have asked service for it to avoid redundant calls
MicroDataTools.cachedMmd = {};

// Convert schema name into metadata wrapper name
MicroDataTools.getTypeName = function(microdata) {
    if (!microdata) {
        // TODO There is probbally something smarter to do here
        return undefined;
    }
    var type = microdata.type;
    type = type.substr(type.lastIndexOf('/') + 1);
    var result = '';
    for( var i =0; i < type.length; i++ ) {
        if ( type[i] == type[i].toUpperCase() && i != 0 ) {
            // The next character is uppercase and it is not the first letter
            // so add underscore
            result+= '_';
        }
        result+=type[i];
    }
    result = result.toLowerCase();
    return result;
};

MicroDataTools.useMicroDataToImproveMMD = function( response , mmd, bigSemantics, callback ) {
    var obj = MicroDataTools.getMicroDataAndMMD(response.entity , bigSemantics , function(err , obj) {
		var bestMMD = mmd;
        if ( err ) {
            console.log("useMicroDataToImproveMMD call to getMicroDataAndMMd failed");
        }
        if (obj) {
            bestMMD = pickBestMMD(mmd, obj.mmd);
        }
        callback(null , bestMMD);
    });
};

MicroDataTools.getMicroData = function(page) {
    return MicroDataTools.parseMicroData(page);
};

MicroDataTools.getMicroDataAndMMD = function(page , bigSemantics, callback) {
    var microdata = MicroDataTools.parseMicroData(page);
    if ( microdata.length == 0 ) {
        // There was no microdata for that page
        callback( null , null);
    }
    else {
        var typeName = MicroDataTools.getTypeName(microdata[0]);

		if (MicroDataTools.cachedMmd[typeName]){
			callback(null, {mmd: MicroDataTools.cachedMmd[typeName], microdata: microdata});
		}
		else if (event){
			//here an event is occurring, so we assume extraction needs to be done synchronously.
			//if we don't already have mmd for type we skip microdata and log
			console.log("attempted to extract synchronously, but didn't have mmd cached for type: " + typeName);
			//send to the logging service if we can
			if (bigSemantics.logger) {
				var eventObj = {
					dnd_type_error: {
						current_page: document.URL,
						targt_page: page.URL,
						type: typeName
					}
				}
				bigSemantics.logger(eventObj);
			}
	        callback( null , null);
		}
		else {		//entering async land
			bigSemantics.loadMmd(typeName, null, function (err, mmd) {
				if (err) {
					console.log("bigSemantics loadMMD failed");
					callback(err, null);
					return;
				}
				mmd = BSUtils.unwrapMmd(mmd);
				MicroDataTools.cachedMmd[typeName] = mmd;
				callback(null, {mmd: mmd, microdata: microdata});
			});
		}
    }
};

MicroDataTools.parseMicroData = function(page) {

    var doc;
    if ( ! ( page instanceof Document )  ) {
        console.log("Document needs to be turned into a dom object");
        var parser = new DOMParser();
        doc = parser.parseFromString(page , "text/html");
    } else {
        doc = page;
    }
    var items = [];
    var scopes = [];
    var getNextText = null;
    var tags = [];

    doc = doc.documentElement;
    function depthFirstTraversal(node) {
        openNode(node);
        processNode(node);
        if ( node.children) {
            for (var i = 0; i < node.children.length; i++) {
                depthFirstTraversal(node.children[i]);
            }
        }
        closeNode(node);
    }

    function openNode(node) {
        var attribs = node.attributes;
        var scope = scopes.length && scopes[scopes.length - 1];
        if (attribs && attribs.hasOwnProperty('itemscope')) {
            // create a new scope
            if (attribs.itemprop && scopes.length) {
                // chain the scopes
                scope = scope[attribs.itemprop.nodeValue] = {};
            }
            else {
                scope = {};
            }
            scopes.push(scope);
            tags.push('SCOPE');
        }
        else {
            tags.push(false);
        }

        if (scope) {
            if (attribs.itemtype) {
                scope.type = attribs.itemtype.nodeValue;
            }
            if (attribs.itemprop && !attribs.hasOwnProperty('itemscope')) {
                if (attribs.content) {
                    scope[attribs.itemprop.nodeValue] = attribs.content.nodeValue;
                }
                else {
                    tags.pop();
                    tags.push('TEXT');
                    scope[attribs.itemprop.nodeValue] = '';
                    getNextText = attribs.itemprop.nodeValue;
                }
            }
        }
    }

    function processNode(node) {
        if (getNextText) {
            var text ='';
            if ( node.nodeName== 'IMG' )
                text = node.src;
            else
                text = node.textContent;
            text = text.replace(/^\s+|\s+$/g, "");
            var v = scopes[scopes.length-1][getNextText];
            if ( !v)
                scopes[scopes.length - 1][getNextText] = text;
            else
                scopes[scopes.length - 1][getNextText] += text;
        }
    }

    function closeNode(node) {
        var tag = tags.pop();
        if(tag === 'SCOPE') {
            var item = scopes.pop();
            if (!scopes.length) {
                items.push(item);
            }
        }
        else if (tag === 'TEXT') {
            getNextText = false;
        }
    }
    depthFirstTraversal(doc);
    return items;
};