//Given mmd, representing the mmd of this page.

var currentMMDField;
//var xpathResult = document.evaluate( xpathExpression, contextNode, namespaceResolver, resultType, result );  
//More info at: https://developer.mozilla.org/en/Introduction_to_using_XPath_in_JavaScript
//Mozilla has better documentation, but we're using chromium.
//Not to worry, we're working with standards here. Both browsers implement the XPath defined in
// http://www.w3.org/TR/2004/NOTE-DOM-Level-3-XPath-20040226/DOM3-XPath.html

var defVars = {};

function extractMetadata(mmd) {
    simplDeserialize(mmd);
    mmd = mmd.meta_metadata;

    if (mmd.hasOwnProperty('def_var')) {
        for (var i = mmd.def_var.length - 1; i >= 0; i--) {
            var thisvar = mmd.def_var[i];
//            console.log("Setting def_var: " + thisvar.name);
            if (thisvar.hasOwnProperty('type')) {
                if(thisvar.type == "node") {
                    var result = getNodeWithXPath(document, thisvar.xpath);
                    if(result) {
                        defVars[thisvar.name] = result;
//                        console.log("def_var Value: ");
//                        console.info(result);
                    }   
                }
            }
        }
    }

    var metadata = recursivelyExtractMetadata(mmd, document, null, null);
    console.info(metadata);
    metadata['location'] = window.location.href;
    if (mmd.hasOwnProperty('mm_name'))
        metadata['mm_name'] = mmd.mm_name;
    var returnVal = {};
    var metadataTag = mmd.hasOwnProperty('type') ? mmd.type : mmd.name;
    returnVal[metadataTag] = metadata;

    //return returnVal;
    var returnValueString = JSON.stringify(returnVal);
    //Special use for callbacks into the C# application
    CallBack.MetadataExtracted(returnValueString);
}

function recursivelyExtractMetadata(mmd, contextNode, metadata, fieldParserContext) {
    if (metadata == undefined || metadata == null)
        metadata = { }; // Output, should happen only the first time.

    if (mmd.kids == null || mmd.kids.length == 0) {
//        console.log("\t\tMMD has no kids: " + mmd.name);
        return null; // Nothing to do here.
    }

    if (contextNode == undefined || contextNode == null)
        contextNode = document;

    for (var mmdFieldIndex = 0; mmdFieldIndex < mmd.kids.length; mmdFieldIndex++) {
        var mmdField = mmd.kids[mmdFieldIndex];
        currentMMDField = mmdField;
//        console.log("Iterating to Next mmdField");
//        console.log(mmdField);

        var defVarNode;
        if (mmdField.scalar != null) {
//            console.log("recursivelyExtractMetadata(): Setting scalar: " + mmdField.scalar.name);
            if (mmdField.scalar.hasOwnProperty('context_node')) {
                defVarNode = defVars[mmdField.scalar.context_node];
                if (defVarNode)
                    contextNode = defVarNode;
            }
            extractScalar(mmdField.scalar, contextNode, metadata, fieldParserContext);
        }

        if (mmdField.collection != null) {
//            console.log("recursivelyExtractMetadata(): Setting Collection: " + mmdField.collection.name);
            if (mmdField.collection.hasOwnProperty('context_node')) {
                defVarNode = defVars[mmdField.collection.context_node];
                if (defVarNode)
                    contextNode = defVarNode;
            }
            extractCollection(mmdField.collection, contextNode, metadata, fieldParserContext);
        }

        if (mmdField.composite != null) {
//            console.log("recursivelyExtractMetadata(): Setting Composite: " + mmdField.composite.name);
            if (mmdField.composite.hasOwnProperty('context_node')) {
                defVarNode = defVars[mmdField.composite.context_node];
                if (defVarNode)
                    contextNode = defVarNode;
            }
            extractComposite(mmdField.composite, contextNode, metadata, fieldParserContext);
        }

//        console.log("Recursive extraction result: ");
//        console.info(metadata);
    }

//    console.log("Returning Metadata: ");
//    console.info(metadata);
    return metadata;
}

function extractScalar(mmdScalarField, contextNode, metadata, fieldParserContext) {
    var xpathString = mmdScalarField.xpath;
    var fieldParserKey = mmdScalarField.field_parser_key;

    var stringValue = null;
    
    if (xpathString != null && xpathString.length > 0 && contextNode != null && fieldParserKey == null) {
        stringValue = getScalarWithXPath(contextNode, xpathString);
    } else if (fieldParserKey != null) {
        stringValue = getFieldParserValueByKey(fieldParserContext, fieldParserKey);
    }

    if (stringValue) {
        stringValue = stringValue.replace(new RegExp('\n', 'g'), "");
        stringValue = stringValue.trim();
        if (mmdScalarField.filter != null)
        {
            var regex = mmdScalarField.filter.regex;
            var replace = mmdScalarField.filter.replace;
            if (replace != undefined && replace != null) // We must replace all newlines if the replacement is not a empty character
            {
                stringValue = stringValue.replace(new RegExp(regex, 'g'), replace);
            }
            else
            {
                var grps = stringValue.match(new RegExp(regex));
                if (grps != null && grps.length > 0)
                    stringValue = grps[grps.length - 1];
            }
        }
    
        if (mmdScalarField.tag != null && mmdScalarField.tag != mmdScalarField.name)
            metadata[mmdScalarField.tag] = stringValue;
        else
            metadata[mmdScalarField.name] = stringValue;
    }
}

function extractCollection(mmdCollectionField, contextNode, metadata, fieldParserContext) {
    if (contextNode == null)
        return false;
//    console.log("extractCollection(): " + mmdCollectionField.name);

//    console.log("DEBUG: calling field parser helper");
    var fieldParserHelper = extractFieldParserHelperObject(mmdCollectionField, contextNode, fieldParserContext, 'collection');
    if (fieldParserHelper == null)
        return false;
//    console.log("fieldParserHelper obtained: " + fieldParserHelper);

    // nodeList is a XPathResult type, access items with snapshotItem(index)
    // var nodeList = getNodeListWithXPath(contextNode, mmdCollectionField.xpath);
    var nodeList = fieldParserHelper.nodeList;
    var fieldParserContextList = fieldParserHelper.fieldParserContextList;
    var size = fieldParserHelper.size;

    if (mmdCollectionField.parse_as_hypertext == true || mmdCollectionField.child_type == "hypertext_para") {
        // Special field, for now. Parser needs to change it's ways to handle hypertext
        parseNodeListAsHypertext(mmdCollectionField, nodeList, metadata);
        return true; // This collection is special. No further normal processing required.
    }

    var elements = [];
    for (var i = 0; i < size; ++i) {
//        console.log("\tCollection Result Index: " + i);
        var thisNode = (nodeList == undefined || nodeList == null) ? null : nodeList.snapshotItem(i);
        var thisFieldParserContext = (fieldParserContextList == undefined || fieldParserContextList == null) ? null : fieldParserContextList[i];
        if (mmdCollectionField.childScalarType) { // collection of scalars
            var value = null;
            if (thisFieldParserContext)
                value = getFieldParserValueByKey(thisFieldParserContext, '$0'); // $0 is the default key for regex_split
            else
                value = thisNode.textContent;
            if (value)
                elements.push(value);
        } else { // collection of elements
            var kids = mmdCollectionField.kids;
            if (kids == undefined || kids == null || kids.length == 0) {
//                console.log("Oops, collection fields do not exist.");
            }
            else {
                var element = { };
                element = recursivelyExtractMetadata(mmdCollectionField.kids[0].composite, thisNode, element, thisFieldParserContext);
                if (!isEmpty(element))
                    elements.push(element);
            }
        }
    }

//    for (var resultIndex = 0; resultIndex < size; resultIndex++) {
//        console.log("\tCollection Result Index: " + i);
//        // recursive call.
//        var recursiveContext = nodeList.snapshotItem(resultIndex);
//        var resultFieldParserContext = (fieldParserContextList == undefined || fieldParserContextList == null) ? null : fieldParserContextList[resultIndex];
//        var metadataCollectionItem = { };
//        for (var fieldIndex = 0; fieldIndex < collectionFields.length; fieldIndex++) {
//            var recursiveField = collectionFields[fieldIndex];
//            console.log("\tCollection Recursive Call: ");
//            console.log(recursiveField);
//
//            if (recursiveField.scalar != null)
//                extractScalar(recursiveField.scalar, recursiveContext, metadataCollectionItem, resultFieldParserContext);
//            else if (recursiveField.collection != null)
//                extractCollection(recursiveField.collection, recursiveContext, metadataCollectionItem, resultFieldParserContext);
//            else if (recursiveField.composite != null) {
//                extractComposite(recursiveField.composite, recursiveContext, metadataCollectionItem, resultFieldParserContext);
//                if (metadataCollectionItem) {
//                    metadataCollectionItem = metadataCollectionItem[recursiveField.composite.name];
//                }
//            }    
//
//            console.log("Metadata Collection Item: ");
//            console.info(metadataCollectionItem);
//        }
//        elements.push(metadataCollectionItem);
//    }

    if (elements.length > 0) 
    {
        var extractedCollection = {};
//        console.log("Metadata Collection: ");
//        console.info(elements);
        extractedCollection[mmdCollectionField.child_type] = elements;
        metadata[mmdCollectionField.name] = extractedCollection;
    } else {
//        console.info("empty collection, not adding the object");
    }

    return true;
}

function extractComposite(mmdCompositeField, contextNode, metadata, fieldParserContext)
{
    if (contextNode == null)
        return false;
//    console.log("extractComposite(): " + mmdCompositeField.name);

//    console.log("DEBUG: calling field parser helper");
    var fieldParserHelper = extractFieldParserHelperObject(mmdCompositeField, contextNode, fieldParserContext, 'composite');
    if (fieldParserHelper == null)
        return false;
//    console.log("fieldParserHelper obtained: " + fieldParserHelper);

    // Apply xpath of composite node if it exists
    // if (mmdCompositeField.xpath != null)
    //    newContextNode = getNodeWithXPath(contextNode, mmdCompositeField.xpath);
    var thisNode = fieldParserHelper.node;
    var thisFieldParserContext = fieldParserHelper.fieldParserContext;

    if (mmdCompositeField.parse_as_hypertext == true || mmdCompositeField.type == "hypertext_para") {
        var paraNode = getNodeWithXPath(contextNode, mmdCompositeField.xpath);
        var parsedPara = parseHypertextParaFromNode(paraNode);
        metadata[mmdCompositeField.name] = parsedPara;
        return true;
    }
    
//    console.log("Composite Recursive call: ");
//    console.info(mmdCompositeField);

    var compositeMetadata = { };
    compositeMetadata = recursivelyExtractMetadata(mmdCompositeField, thisNode, compositeMetadata, thisFieldParserContext);

    if (!isEmpty(compositeMetadata)) {
        if (mmdCompositeField.hasOwnProperty('mm_name'))
            compositeMetadata['mm_name'] = mmdCompositeField.mm_name;
//        console.log("Composite Recursive Result ---------- : ");
//        console.info(compositeMetadata);
        metadata[mmdCompositeField.name] = compositeMetadata;
    } else {
//        console.log("Composite Extraction is empty");
    }

    return true;
}

function extractFieldParserHelperObject(mmdNestedField, contextNode, fieldParserContext, fieldType) {
    var fieldParserHelper = { };
    
    // get xpath, context node, field parser defintion & key: basic information for following
    var xpathString = mmdNestedField['xpath'];
    var fieldParserElement = mmdNestedField['field_parser'];
    var fieldParserKey = mmdNestedField['field_parser_key'];
    
    if (mmdNestedField.meta_metadata != null) {
//        console.log("This is a meta_metadata: " + mmdNestedField);
        fieldParserHelper.node = contextNode;
        return fieldParserHelper;
    }

    if (xpathString != null && contextNode != null) {
        if (fieldType == 'composite') {
            fieldParserHelper.node = getNodeWithXPath(contextNode, xpathString);
            fieldParserHelper.size = 1;
        } else if (fieldType == 'collection') {
            fieldParserHelper.nodeList = getNodeListWithXPath(contextNode, xpathString);
            fieldParserHelper.size = fieldParserHelper.nodeList.snapshotLength;
        }
    }

    if (fieldParserElement != null) {
        var fieldParser = getFieldParserFactory()[fieldParserElement.name];
        if (fieldParser != null) {
            if (fieldType == 'composite') { // composite field
                var valueString = null;
                if (fieldParserKey != null && fieldParserKey.length > 0)
                    valueString = getFieldParserValueByKey(fieldParserContext, fieldParserKey);
                else if (fieldParserHelper.node != null)
                    valueString = fieldParserHelper.node.getTextContent();
                if (valueString != null && valueString.length > 0)
                    fieldParserHelper.fieldParserContext = fieldParser.getKeyValuePairResult(fieldParserElement, valueString.trim());
            } else if (fieldType == 'collection') { // collection field
                if (mmdNestedField.child_scalar_type == null && fieldParserElement.for_each_element == 'True') { // collection of elements
                    fieldParserHelper.fieldParserContextList = [];
                    for (var i = 0; i < fieldParserHelper.size; ++i) {
                        var node = fieldParserHelper.nodeList.snapshotItem(i);
                        valueString = node.textContent;
                        if (valueString != null && valueString.length > 0) {
                            var aContext = fieldParser.getKeyValuePairResult(fieldParserElement, valueString.trim());
                            fieldParserHelper.fieldParserContextList.push(aContext);
                        }
                    }
                } else { // collection of scalars
                    valueString = null;
                    if (fieldParserKey != null && fieldParserKey.length > 0)
                        valueString = getFieldParserValueByKey(fieldParserContext, fieldParserKey);
                    else if (fieldParserHelper.nodeList != null && fieldParserHelper.size >= 1)
                        valueString = fieldParserHelper.nodeList.snapshotItem(0).textContent;
                    if (valueString != null && valueString.length > 0)
                        fieldParserHelper.fieldParserContextList = fieldParser.getCollectionResult(fieldParserElement, valueString.trim());
                }
            }
        }
    }

    if (fieldParserHelper.node == null && fieldParserHelper.nodeList == null && fieldParserHelper.fieldParserContext == null && fieldParserHelper.fieldParserContextList == null)
        return null;
    return fieldParserHelper;
}

function getFieldParserValueByKey(fieldParserContext, fieldParserKey) {
    var pos = fieldParserKey.indexOf('|');
    if (pos < 0)
        return fieldParserContext[fieldParserKey];
    var keys = fieldParserKey.split('|');
    for (var key in keys)
        if (fieldParserContext.hasOwnProperty(key))
            return fieldParserContext[key];
    return null;
}

function parseNodeListAsHypertext(mmdCollectionField, paras, metadata) {

//    console.log("Found hypertext nodes: ");
//    console.info(paras);

    var parsedParas = [];

    for (var resultIndex = 0; resultIndex < paras.snapshotLength; resultIndex++) {

        var hypertextNode = paras.snapshotItem(resultIndex);
        //console.log("Current Paragraph parsed: ");
        //console.info(hypertextNode);
        //console.log("Number of childNodes : " + hypertextNode.childNodes.length);

        var paraContainer = {};
        paraContainer[mmdCollectionField.child_type] = parseHypertextParaFromNode(hypertextNode);

        
        //console.info(hypertextPara);
        parsedParas.push(paraContainer);
    }
//    console.info(parsedParas);

    metadata[mmdCollectionField.name] = parsedParas;
}

function parseHypertextParaFromNode(hypertextNode) {

    //internal functions
    function getLinkRun(node) {
        var link_run = {};
        link_run["text"] = node.textContent;
        link_run["location"] = node.href;
        link_run["title"] = node.title; //Wiki specific !
        return link_run;
    }
    function getTextRun(node, formattedRun) {
        var text_run = formattedRun == null ? {} : formattedRun;
        text_run.text = node.textContent;
        return text_run;
    }

    var hypertextPara = {};
    runs = [];
    hypertextPara["runs"] = runs;

    for (var nodeNum = 0; nodeNum < hypertextNode.childNodes.length; nodeNum++) {
        var curNode = hypertextNode.childNodes[nodeNum];
        var nodeName = curNode.nodeName;
        //console.info(curNode);
        var resNode = {};
        if (nodeName == "#text" || nodeName == "SPAN") {
            //console.log("Text: " + curNode.textContent);
            resNode["text_run"] = getTextRun(curNode);

        }
        else if (nodeName == "A") {
            //No further parsing just pull values out.
            resNode["link_run"] = getLinkRun(curNode);
        }
        else if (nodeName == "B") {
            formattedRun = {};
            var styleInfo = { };

            styleInfo["bold"] = true;
            formattedRun["style_info"] = styleInfo;
            if (curNode.childElementCount == 0) {
                resNode["text_run"] = getTextRun(curNode, formattedRun);
                //console.log("Simple bold : " + curNode.text);
            }
            else {
//                console.log("Bold link ?");
                //console.log("NestedBold: ");
                //console.info(curNode);
            }
        }
        else if (nodeName == "I") {
            formattedRun = {};
            var styleInfo = { };
            styleInfo["italics"] = true;
            formattedRun["style_info"] = styleInfo;
            resNode["text_run"] = getTextRun(curNode, formattedRun);
        }
        else {
//            console.log("IgnoredNode: ");
//            console.info(curNode);
        }
        if (!isEmpty(resNode))
            runs.push(resNode);
    }
    return hypertextPara;
}

// Util functions, to make the above functions a little prettier

function isEmpty(obj) {
    for (var propName in obj)
        if (obj.hasOwnProperty(propName))
            return false;
    return true;
}

/**
* All scalars can be considered strings. Type holds no value in javascript (yet).
*/
function getScalarWithXPath(contextNode, xpath)
{
    return document.evaluate(xpath, contextNode, null, XPathResult.STRING_TYPE, null).stringValue;
}

/**
* Uses getNodeListWithXPath, but verifies and returns only the first value.
*/
function getNodeWithXPath(contextNode, xpath)
{
    var nodelist = getNodeListWithXPath(contextNode, xpath);
    if (nodelist.snapshotLength == 0)
        return null;
    else
        return nodelist.snapshotItem(0);
    
}

function getNodeListWithXPath(contextNode, xpath) {
    return document.evaluate(xpath, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

}

