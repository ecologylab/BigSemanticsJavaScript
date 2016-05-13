/*
    Author: Zach Brown
    Description : Extract the microdata onjects from a html string. Code adapted from https://github.com/saary/node-microdata-parser/blob/master/index.js
                  to work in browser environment.
 */

function extractMetadataMicroSync(response , mmd , bigSemantics, options) {
    var microdata = MicroDataTools.parseMicroData(response.entity);
    var typeName = MicroDataTools.getTypeName(microdata[0]);
	mmd = BSUtils.unwrapMmd(mmd);
    // TODO fix jesus
    var metadata = {};
    metadata[mmd.name] = mapMicroToMMD(microdata[0],  mmd);
    return metadata;
}

function mapMicroToMMD( microdata , meta_metadata) {
    if ( !microdata) { return null; }

    var fields = getFields(meta_metadata);
    var metadata = {};
    microdata = preProcess(microdata);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if ( field.scalar ) {
            processScalarField(microdata , field, metadata);
            continue;
        }
        if (field.collection) {
            processCollectionField(microdata , field , metadata);
            continue;
        }
        if ( field.composite ) {
            processCompositeField(microdata, field, metadata);
           continue;
        }

        console.log("What the hell is it then?");
        throw "FUCK THIS";
    }
    return metadata;
}


function processScalarField(microdata , field, metadata) {
    if (field.microDataName in microdata) {
        metadata[field.name] = microdata[field.microDataName];
    }
}

function processCollectionField(microdata , field , metadata) {
    // So there should be a itemlist... ha... i've never seen it before
    // But lets check for it
    // I don't know how actually never seen one.
    // Assume no list just one :)
    var microDataList = getMicroDataList(microdata , field);
    var metaDataList = [];
    for ( var i = 0; i < microDataList.length; i++ ) {
        var microdataItem = microDataList[i];
        if ( field.child_type ) {
            var childMmd = field.child_mmd;
            metaDataList.push(mapMicroToMMD( microdataItem , childMmd));
        }
        else {
            // Assume its a scalar then :)
            metaDataList.push(microdataItem);
        }
    }
    // If we actually found something add it to the metadata
    if ( metaDataList.length != 0) {
        metadata[field.name] = metaDataList;
    }
}

function processCompositeField(microdata, field, metadata) {
    if ( !microdata[field.microDataName] ) {
        // That field doesn't exist in the microdata
        // move on to the next field
        return;
    }
    // Since its a composite there has to be a child type
    var childMmd = field.child_mmd;
    var value = microdata[field.microDataName];
    if ( typeof value ==='string' || value instanceof String) {
        // The value is just a simple string... sad
        // Assume that string is title of micordata
        value = { title: value };
    }
    metadata[field.name] = mapMicroToMMD( value, childMmd);
}

function getMicroDataList(microdata , field) {
    var list = [];
    if ( !field.microDataName) {
        return [];
    }
    if ( microdata[field.microDataName.trim()] ) {
        list.push(microdata[field.microDataName]);
    }
    return list;
}

// Fields in microdata can be compoounds i.e author creator
// Metadata fields might only map to one of the parts in the compound field name
// but should still be a hit
// So do some work to make that possible.
// TODO i actually kind of assume that the metadata will only map to one field name oops..
function preProcess(microdataItem) {
    var newMap = {};
    for ( var key in microdataItem ) {
        var keys = key.split(' ');
        for ( k in keys) {
            newMap[keys[k]] = microdataItem[key];
        }
    }
    return newMap;
}

// Takes a mmd object and returns a list of all fields
// that exist on that mmd
function getFields(mmd) {
    if ( !mmd) {
        return null;
    }
    var result  = [];
    var fields = mmd.kids;
    for ( var i =0; i < fields.length; i++) {
        var obj = {};
        var field = fields[i];
        // Field is a scalar
        if ( field.scalar ) {
            field = field.scalar;
            obj.scalar = true;
        }
        // Field is a composition
        if ( field.composite) {
            field = field.composite;
            obj['child_type'] = field.child_type;
            obj['child_mmd'] = field.type_mmd;
            obj.composite = true;
        }

        // Field is a collection
        if ( field.collection ) {
            field = field.collection;
            obj['child_type'] = field.child_type;
            obj['child_mmd'] = field.type_mmd;
            obj.collection = true;
        }

        obj['name'] = field.name;
        if ( field.schema_org_itemprop ) {
            obj['microDataName'] = field.schema_org_itemprop.trim();
        } else {
            obj['microDataName'] = field.name;
        }

        result.push(obj);
    }
    return result;
}