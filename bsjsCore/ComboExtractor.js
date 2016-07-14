// TODO Check for error cases
function extractMetadataCombo(response, mmd, bigSemantics, options, callback) {
    //var extractedMeta = extractMetadataSyncCombo(response , mmd , bigSemantics,options , callback);
    //callback(null , extractedMeta);

	mmd = BSUtils.unwrapMmd(mmd);
	
    extractMetadata(response, mmd, bigSemantics, options, function(err, metadataNormal) {
        var metadataMicro  = extractMetadataMicroSync(response , mmd , bigSemantics, options);
        metadataNormal = metadataNormal[mmd.name];
        metadataMicro  = metadataMicro[mmd.name];

        var metadata = metadataNormal;
        if (metadataMicro){
            metadata = mergeMetadata( metadataNormal , metadataMicro , mmd);
        }

        var result = {};
        result[mmd.name] = metadata;
        callback ( null , result);
    });
}

function pickBestMMD( mmd1 , mmd2) {
    // if mmd1 is child of mmd2 then pick mmd1
    if ( isChild( mmd1 , mmd2.name )) {
        return mmd1;
    }

    // if mmd 2 is child of mmd1 then pick mmd2
    if ( isChild( mmd2 , mmd1.name )) {
        return mmd2;
    }

    // if nobody be nobody child then whaT??
    console.log("Not parent child relation detected between microdata mmd and wrapper mmd");
    return mmd1;

    function isChild(mmd , parentName ) {
        var superObj = mmd.super_field;
        while( superObj ) {
            if ( superObj.name == parentName ) {
                return true;
            }
            superObj = superObj.super_field;
        }
        // Went all the way to base class so its not a child
        return false;
    }
}

function mergeMetadata( metadata1 , metadata2 , mmd , repoMan) {
    var metadata = {};

    traverseMMD(metadata1 , metadata2 , metadata , mmd);
	
	//cludgy cludge to clean up
	if (!metadata.mm_name && !metadata.meta_metadata_name){
		metadata.mm_name = metadata1.mm_name || metadata1.meta_metadata_name || metadata2.mm_name || metadata2.meta_metadata_name;
	}
	
    return metadata;

    function traverseMMD(metadata1 , metadata2 , metadata , mmd) {
        var fields = getFields(mmd);
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            if ( field.scalar ) {
                mergeScalarField(metadata1 , metadata2, field, metadata);
                continue;
            }
            if (field.collection) {
                mergeCollectionField(metadata1 , metadata2, field , metadata);
                continue;
            }
            if ( field.composite ) {
                mergeCompositeField(metadata1 , metadata2, field, metadata);
                continue;
            }
            console.log("What the hell is it then?");
            throw "FUCK THIS";
        }
    }
    function mergeScalarField(metadata1 , metadata2, field, metadata) {
        var fieldName = field.name;
        var valueFromMetadata1 = metadata1[fieldName];
        var valueFromMetadata2 = metadata2[fieldName];

        if ( fieldName in metadata1 && fieldName in metadata2) {
            // TODO Hmm what to do....
            // For now just give it metadat1 value
            metadata[fieldName] = valueFromMetadata1;
            return;
        }

        if ( fieldName in metadata1 ) {
            metadata[fieldName] = valueFromMetadata1;
            return;
        }

        if ( fieldName in metadata2 ) {
            metadata[fieldName] = valueFromMetadata2;
            return;
        }
    }
    function mergeCollectionField(metadata1 , metadata2, field, metadata) {
        var fieldName = field.name;
        var listFromMetadata1 = metadata1[fieldName];
        var listFromMetadata2 = metadata2[fieldName];
        if ( fieldName in metadata1 && fieldName in metadata2) {
            // TODO Hmm what to do.... actually for a collection its pretty fubared. I mean I guess add them? lol
            // For now just give it metadat1 value
            metadata[fieldName] = listFromMetadata1;
            return;
        }
        if ( fieldName in metadata1 ) {
            metadata[fieldName] = listFromMetadata1;
            return;
        }
        if ( fieldName in metadata2 ) {
            metadata[fieldName] = listFromMetadata2;
            return;
        }
    }
    function mergeCompositeField(metadata1 , metadata2, field, metadata) {
        var fieldName = field.name;
        var valueFromMetadata1 = metadata1[fieldName];
        var valueFromMetadata2 = metadata2[fieldName];

        if ( fieldName in metadata1 && fieldName in metadata2) {
            // TODO Hmm what to do.... MERGE THEM OF COURSE !!!! :)
            // For now just give it metadat1 value
            var newMMD = repoMan.loadMmdSync( field.child_type );
            metadata[fieldName] = {};
            traverseMMD( metadata1[fieldName] , metadata2[fieldName] , metdata[fieldName]);
            return;
        }
        if ( fieldName in metadata1 ) {
            metadata[fieldName] = valueFromMetadata1;
            return;
        }

        if ( fieldName in metadata2 ) {
            metadata[fieldName] = valueFromMetadata2;
            return;
        }
    }
}
