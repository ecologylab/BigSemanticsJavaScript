var docToRender = null;

function onBodyLoad()
{
    docToRender = {  
        location: "",
        metadata: null,
        mmd: null
    };

    SemanticSultan.init();
    //document.getElementById("rendererPlaceholder").innerHTML = "<h1>waddup</h1>";  
};

function renderMetadata()
{
    var targetURL = document.getElementById("targetURL").value;
    document.getElementById("rendererInner").innerHTML = "Loading metadata and mmd for: " + targetURL;
    
    if(docToRender.location != targetURL)
    {
        docToRender = {  
            location: targetURL,
            metadata: null,
            mmd: null
        };
    }
    
    if(SemanticSultan.getImmediately(docToRender))
    {
        renderSemantics();
    }
};

function nodeToString(node)
{
    var tmpNode = document.createElement("div");
    tmpNode.appendChild( node.cloneNode(true ) );
    var str = tmpNode.innerHTML;
    tmpNode = node = null; // prevent memory leaks in IE
    return str;
};

function renderSemantics()
{
    if(docToRender.metadata != null)
    {
        var mmd = SemanticSultan.mmdMap.get(docToRender.metadata.mm_name);

        if( mmd != null)
        {
            document.getElementById("rendererInner").innerHTML = "Ready to display metadata";

            var metadataFields = ViewModeler.createMetadata(true, mmd, docToRender.metadata, docToRender.location);

            var tabbyHTML = TabbyCat.buildMetadataDisplay(metadataFields, TABBY_STYLE.styles);
            document.getElementById("rendererInner").innerHTML = tabbyHTML;

            //var mice = MICE.buildMetadataTable(null, false, true, metadataFields, FIRST_LEVEL_FIELDS, DEFAULT_MICE_STYLE);
            //document.getElementById("rendererInner").innerHTML = nodeToString(mice);
        }
    }
};