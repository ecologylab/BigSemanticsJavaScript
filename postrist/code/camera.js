function Camera() {
	this.x = 0;
	this.y = 0;
	this.zoom = 1.0;
	
	this.MAX_ZOOM = 4.0;
	this.MIN_ZOOM = 0.1;
	
}

Camera.prototype.setup = function() {
	var height = document.getElementById("compositionSpace").offsetHeight;
	var width = document.getElementById("compositionSpace").offsetWidth;
	
	this.x = width / 2;
	this.y = height / 2;
	
	if(DEBUGIES) {
		this.debugBuddy = document.getElementById("camera");
		this.debugBuddy.style.left = (this.x - 5) + 'px';
		this.debugBuddy.style.top = (this.y - 5) + 'px';
	}
}

Camera.prototype.zoomIn = function() {
	this.zoom *= 0.9;
	
	if(this.zoom < this.MIN_ZOOM)
		this.zoom = this.MIN_ZOOM;
		
	redrawComposition();
}

Camera.prototype.zoomOut = function() {
	this.zoom *= 1.1;
	
	if(this.zoom > this.MAX_ZOOM)
		this.zoom = this.MAX_ZOOM;
		
	redrawComposition();
}