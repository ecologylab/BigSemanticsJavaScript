function minkPile(id, cards, root, html, parent, url, parentCard){
	this.id = id;
	this.cards = cards;
	this.collapsed = false;
	this.rootHTML = root;
	this.HTML = html;
	this.parentPile= parent;
	this.visible = true;
	this.kids = [];
	this.column = 1;
	this.urlIndex = 0;
	this.url = url;
	this.parentCard = parentCard;
	var cparent = this.parentPile;
	while(cparent){
		this.column++;
		cparent = cparent.parentPile;
	}
	
}
