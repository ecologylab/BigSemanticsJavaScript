var GRIDIRON_SPACING = 160;
var GRIDIRON_DEVIATION = 0.6;

function createGridIron() {
	var compSpace = document.getElementById("compositionSpace");
	
	var height = document.getElementById("compositionSpace").offsetHeight;
	var width = document.getElementById("compositionSpace").offsetWidth;
	
	var gridIron = document.createElement('div');
		gridIron.id = "gridiron";
		
	// create beams
	var centerX = width / 2;
	for(var i = 0; i < centerX / GRIDIRON_SPACING; i++) {
		if(i == 0) {
			var beam = document.createElement('div');
				beam.className = "beam";
				beam.style.left = centerX + 'px';
				
			gridIron.appendChild(beam);
		}
		else {
			var leftBeam = document.createElement('div');
				leftBeam.className = "beam";
				leftBeam.style.left = (centerX - (i * GRIDIRON_SPACING)) + 'px';
			
			var rightBeam = document.createElement('div');
				rightBeam.className = "beam";
				rightBeam.style.left = (centerX + (i * GRIDIRON_SPACING)) + 'px';
				
			gridIron.appendChild(leftBeam);
			gridIron.appendChild(rightBeam);
		}
	}
	
	console.log(height);
	
	// create braces
	var centerY = height / 2;
	
	console.log(centerY);
	for(var i = 0; i < centerY / GRIDIRON_SPACING; i++) {
		if(i == 0) {
			var brace = document.createElement('div');
				brace.className = "brace";
				brace.style.top = centerY + 'px';
				
			gridIron.appendChild(brace);
		}
		else {
			var topBrace = document.createElement('div');
				topBrace.className = "brace";
				topBrace.style.top = (centerY - (i * GRIDIRON_SPACING)) + 'px';
			
			var bottomBrace = document.createElement('div');
				bottomBrace.className = "brace";
				bottomBrace.style.top = (centerY + (i * GRIDIRON_SPACING)) + 'px';
				
			gridIron.appendChild(topBrace);
			gridIron.appendChild(bottomBrace);
		}
	}
	
	return gridIron;
}
