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
    return false
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
    return [];
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
      var ourElement = MinkComposer.rootComposeables[index-1].HTML.scrollHeight + MinkComposer.rootComposeables[index-1].y + 8;
      composeable.reposition(ourElement);
    }
  }else{
    var parent = composeable.parent;
    var baseHeight = parent.y;
    if(!composeable.hasSilbings()){
      var currentScrollheight = composeable.HTML.scrollHeight;

      composeable.reposition(baseHeight);

    }else{
      //right now hard coded for two siblings
      var siblingsHeight = 0;
      var siblings = composeable.getSiblings();
      for(var i = 0; i < siblings.length; i++){
        siblingsHeight = siblingsHeight + siblings[i].getHeight();

      }
      var newY = siblingsHeight;
      var totalHeight = siblingsHeight + composeable.getHeight();
      var baseHeightOfSiblings = siblings[0].y;
      composeable.parent.reposition((totalHeight/2) - (parent.getHeight()/2) + baseHeightOfSiblings);
      composeable.reposition(newY);

    }
  }


  MinkComposer.createSpaceForComposeable(composeable);
}

MinkComposer.centerViewOnComposeable = function(composeable){

}

MinkComposer.createSpaceForComposeable = function(composeable){
  // var parent = composeable.parent;
  // if(!composeable.isRoot()){
  //   var height = composeable.HTML.scrollHeight;
  //   var parentNewY = parent.y + (height/2) - (parent.HTML.scrollHeight/2)
  //   if(parentNewY < 0){
  //     parentNewY = parent.y;
  //   }
  //   parent.reposition(parentNewY)
  //   parent.childrenHeight = composeable.HTML.scrollHeight;
  //
  // }
  console.log("SPACING CARD")
}
