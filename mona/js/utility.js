/* source: http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb */
// might be faster to hash these
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
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
	for (i in array){
		if (array[i].hasOwnProperty('navigatesTo')) return true;
		
		for (j in array[i]['value']){
			if (array[i]['value'][j].hasOwnProperty('navigatesTo')) return true;
		}
	}
	return false;
}

function sortNumber(a,b) {
    return a - b;
}
