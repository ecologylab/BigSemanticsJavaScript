var Material = {};
Material.materialObjects = new Map();


Material.shade = function(material){
	material.html.style.zIndex = material.height.toString();
		var boxShadow = "0px " + (material.height).toString() + "px ";
		var shadowSpread = ((material.height/24) * 24 +2).toString() + "px ";
		var shadowBlur = (((material.height/24) + 1)).toString() + "px ";
		var intensity = .4 /*+ material.height/50*/;
		boxShadow = boxShadow + shadowSpread + shadowBlur + "rgba(0,0,0, " + intensity.toString() + ")" + ", 0px -1px 2px rgba(0,0,0,.1)";

		var transformAmount = material.height - material.baseHeight;
		if(transformAmount != 0){
			transformAmount = ((transformAmount/(24*2) +1));
			var transform = "scale(" + transformAmount.toString() + ", " + transformAmount.toString() + ")";
			material.html.style.transform = transform;
		}
		material.html.style.boxShadow = boxShadow;
}
Material.addMaterial = function(name, html, height){
	var material = {html: html, height: height, baseHeight: height, name: name};
	Material.shade(material);
	Material.materialObjects.put(name, material);

}