var MinkComposer = {};
MinkComposer.composeableMap = new Map()
MinkComposer.rootComposeables = [];
function Composeable(HTML, id, parentID){
  this.HTML = HTML;
  //pixel x,y via java convention (origin is in top left and 1,1 would be the bottom right)
  this.x = 0;
  this.y = 0;
  this.root;
  this.id = id;
  //list from most recent to root
  this.ancestors= [];
  this.childComposables = [];
  if(parentID){
    var parent = MinkComposer.composeableMap.get(parentID)
    this.parent = parent;

  }else{
    MinkComposer.rootComposeables.push(this)
  }
  if(parent){
    parent.childComposables.push(this);
    var immediateSuccesor = parent;
    while(immediateSuccesor){
      this.ancestors.push(immediateSuccesor);
      this.root = immediateSuccesor;

      immediateSuccesor = immediateSuccesor.parent;
    }
  }else{
    this.parent = null;
    this.root = null;
  }

  this.container = $(HTML).closest('.minkColumn');
  this.childrenHeight = 0;
  MinkComposer.composeableMap.put(this.id, this);
}

Composeable.prototype.isRoot = function(){
  if(!this.parent){
    return true;
  }else{
    return false;
  }
}
Composeable.prototype.getHeight = function(){
  return this.HTML.scrollHeight;
}
Composeable.prototype.hasSilbings = function(){
  if(this.isRoot()){
    if(MinkComposer.rootComposeables.length > 1){
      return true;
    }else{
      return false

    }
  }else{
    if(this.parent.childComposables.length > 1){
      return true;
    }else{
      return false;
    }
  }
}
Composeable.prototype.getSiblings = function(){
  if(this.isRoot()){
    var children = MinkComposer.rootComposeables;
    var newChildren = [];
    for (var i = 0; i < children.length; i++){
      if(this.id != children[i].id){
        newChildren.push(children[i]);
      }

    }
    return newChildren;
  }else{
    var children = this.parent.childComposables;
    var newChildren = [];
    for (var i = 0; i < children.length; i++){
      if(this.id != children[i].id){
        newChildren.push(children[i]);
      }

    }
    return newChildren;

  }
}
Composeable.prototype.reposition = function(y){
  this.y = y;
  this.HTML.style.top = (y.toString() + "px");
}

MinkComposer.composeEventHandler = function(event){
  var container = event.detail.container;
  var compID = $(container).closest('.minkCardContainer')[0].id;
  var composeable = MinkComposer.composeableMap.get(compID);
  if (event.detail.type == 'makespace'){
    window.setTimeout(function(){
      MinkComposer.createSpaceForComposeable(composeable);

    }, 1)
  }
}

MinkComposer.insertComposeable = function(composeable){
  if(composeable.isRoot()){
    var index = MinkComposer.rootComposeables.indexOf(composeable);
    if(index == 0){
      composeable.reposition(0);
    }else{
      var ourElement = MinkComposer.rootComposeables[index-1].HTML.scrollHeight + MinkComposer.rootComposeables[index-1].y;
      composeable.reposition(ourElement);
    }
  }else{
    var parent = composeable.parent;
    var baseHeight = parent.y;
    if(!composeable.hasSilbings()){
      var currentScrollheight = composeable.HTML.scrollHeight;

      composeable.reposition(baseHeight);
      parent.childrenHeight = composeable.HTML.scrollHeight;

    }else{
      //right now hard coded for two siblings
      var siblingsHeight = 0;
      var siblings = composeable.getSiblings();
      for(var i = 0; i < siblings.length; i++){
        siblingsHeight = siblingsHeight + siblings[i].getHeight();

      }
      var newY = siblingsHeight + siblings[0].y;
      composeable.reposition(newY);

      composeable.parent.reposition(parent.y + (composeable.getHeight()/2));
      MinkComposer.createSpaceBelow(parent, composeable.getHeight());

    }
  }


}

MinkComposer.createSpaceBelow = function(composeable, amount){
  if(composeable.hasSilbings()){

    var siblingsIncludingComp;
    if(composeable.isRoot()){
      siblingsIncludingComp = MinkComposer.rootComposeables;

    }else{
      siblingsIncludingComp = composeable.parent.childComposables;

    }

    var index = siblingsIncludingComp.indexOf(composeable);


    for (var i = index+1; i < siblingsIncludingComp.length; i++){
      var sibling = siblingsIncludingComp[i];
      sibling.reposition(sibling.y + amount);

    }

  }

}

MinkComposer.centerViewOnComposeable = function(composeable){

}

MinkComposer.createSpaceForComposeable = function(composeable, amount){
  //tells the other mink cards around an expanded parent to fuck off


}
