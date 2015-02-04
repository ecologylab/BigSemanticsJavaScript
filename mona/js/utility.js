/*global MDC_rawMMD, MDC_rawMetadata, console*/

/* source: http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb */
// might be faster to hash these
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : {
        r: 0,
        g: 0,
        b: 0
    };
}

// ex; rgba(0, 0, 0, 0.2)
function rgbToRgbObj(string) {
    var rgb = string.substring(5, string.length-6).replace(/ /g, '').split(',');
    return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2]
    };
}

/* source: http://caseyjustus.com/finding-the-median-of-an-array-with-javascript */
function median(values) {
 
    var half = Math.floor(values.length/2);
 
    if(values.length % 2)
        return values[half];
    else
        return (values[half-1] + values[half]) / 2.0;
}

function nestedHasNavTo (array){
	for (var i in array){
		if (array[i].hasOwnProperty('navigatesTo')) 
            return true;
		
		for (var j in array[i].value){
			if (array[i].value[j].hasOwnProperty('navigatesTo')) 
                return true;
		}
	}
	return false;
}

function sortNumber(a,b) {
    return a - b;
}

function getLabel(key){
    for (var i in MDC_rawMMD.kids){
        var kid = MDC_rawMMD.kids[i];
        for (var type in kid){
            if (key == kid[type].name){
                if (kid[type].label !== undefined){
                    return kid[type].label.replace(/_/g," ");
                }
                else{ 
                    return key.replace(/_/g," ");
                }
            }
        }
    }
    return key.replace(/_/g," ");
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

//give a list of html elements, delete all their children
function deleteChildren() {
    for (var i = 0; i < arguments.length; i++) {
        var element = arguments[i];
        while (element.firstChild){
            element.removeChild(element.firstChild);
        }
    }
}

//Vector =============================================

function Vector(items){
	this.items = items;
}

Vector.prototype.add = function(other){
	var result = [];
    for(var i = 0; i < this.items.length; i++) {
        result.push( this.items[i] + other.items[i]);
    }
    
    return new Vector(result);
};
