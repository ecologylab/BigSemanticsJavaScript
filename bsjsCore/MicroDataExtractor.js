/*
    Author: Zach Brown
    Description : Extract the microdata onjects from a html string. Code adapted from https://github.com/saary/node-microdata-parser/blob/master/index.js
                  to work in browser environment.
 */

// TODO Check for error cases

/* params:
 *         docString: html string
 *         cb: function(err , items)
 * successCase:
 *         cass cb with null , items( list of microdata objects, which may be nested. )
 */
function parseMicroData(docString , cb) {
    cb = cb || function() {};
    var parser = new DOMParser();
    var doc = parser.parseFromString(docString , "text/html");
    var items = [];
    var scopes = [];
    var getNextText = null;
    var tags = [];

    doc = doc.documentElement;
    function depthFirstTraversal(node) {
        openNode(node);

        processNode(node);

        if ( node.children)
            for (var i = 0; i < node.children.length; i++) {
                depthFirstTraversal(node.children[i]);
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
    cb(null , items);
}