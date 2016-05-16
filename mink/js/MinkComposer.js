var MinkComposer = {};

MinkComposer.newComposeableSpace = function(){

    var newSpace = {};
    newSpace.composeableMap = new Map();
    newSpace.rootComposeables = [];
    newSpace.columns = [];
    MinkComposer.currentSpace = newSpace;
    return newSpace;
}
MinkComposer.hideCurrentSpace = function(){
  for (var i = 0; i < MinkComposer.currentSpace.columns.length; i++){
    MinkComposer.currentSpace.columns[0].HTML.style.display = "none";
  }
}
MinkComposer.switchSpaceTo = function(space){
  var columnHolder = $("#minkColumns");
  MinkComposer.currentSpace = space;
    for(var i = 0; i < space.columns.length; i++){
      columnHolder.append(space.columns[i].HTML);
    }
}
function Column(number, HTML){
  this.number = number
  this.HTML = HTML;
  this.composeables = [];
  MinkComposer.currentSpace.columns.push(this)
  this.floatingComposeables = [];
}

Column.prototype.addComposeable = function(composeable){
  this.composeables.push(composeable);
  this.composeables.sort(function(a, b){
    return a.y - b.y;
  });

}
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
    var parent = MinkComposer.currentSpace.composeableMap.get(parentID)
    this.parent = parent;

  }else{
    MinkComposer.currentSpace.rootComposeables.push(this)
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
  this.column = this.getColumn();
  this.pileIdToRemovedChildrenMap = new Map();
  this.incidentallyRemovedKids = [];
  this.container = $(HTML).closest('.minkColumn')[0];
  this.x = this.container.getAttribute('column');
  MinkComposer.currentSpace.columns[this.x].addComposeable(this);
  this.childrenHeight = 0;
  MinkComposer.currentSpace.composeableMap.put(this.id, this);
  Material.addMaterial(this.id, $(this.HTML).find('.minkContainer')[0], 1)
  this.filteredOut = false;

}
/*
  Unlike "real" composeables, which have some materiality and can force
  other objects out of their way, FloatingComposeables are anchored relative to a composeable,
  but they don't direct traffic on their own
*/
function FloatingComposeable(HTML){
  this.HTML = HTML;
  var that = this;

  setTimeout(function(){
    var pile = $(that.HTML).closest('.minkPile');
    var anchorHTML = pile.find('.minkCardContainer');
    if(anchorHTML.length > 0){


      anchorHTML = anchorHTML[0];
      var composeable = MinkComposer.currentSpace.composeableMap.get(anchorHTML.getAttribute('id'));


      //pixel x,y via java convention (origin is in top left and 1,1 would be the bottom right)
      that.y = 0;
      that.id = generateUUID();
      that.anchor = composeable;
      that.column = that.anchor.column;
      that.column.floatingComposeables.push(that);
      that.reanchor();
    }
  },350)






}
FloatingComposeable.prototype.positionAt = function(y){
    this.y = y;
    this.HTML.style.top = (y.toString() + "px");

}
FloatingComposeable.prototype.snapToAnchor = function(){
  var newY = this.anchor.getHeight() + this.anchor.y;
  this.positionAt(newY)
}
FloatingComposeable.prototype.reanchor = function(){
  //find lowest sibling of anchor
  var sibs = this.anchor.getSiblings()
  if(sibs.length > 0){
    var newAnchor = sibs[(sibs.length - 1)];
    if(newAnchor.y > this.anchor.y){
      this.anchor = newAnchor;

    }
    this.snapToAnchor();
  }else{
    this.snapToAnchor();
  }


}

MinkComposer.filterOutComposeable = function(composeable){
  try{
    if(!composeable.filteredOut){
    composeable.filteredOut = true;
    MinkComposer.removeRecursively(composeable);

    }
  }catch(err){

  }

}
MinkComposer.filterInComposeable = function(composeable){
  try{
    if(composeable.filteredOut){
      composeable.filteredOut = false;
      MinkComposer.restoreRecursively(composeable);
    }
  }
  catch(err){

  }

}

Composeable.prototype.isLeaf = function(){
  if(this.childComposables.length > 0){
    return false;
  }else{
    return true;
  }
}


Composeable.prototype.lowestChild = function(){
  var lowest = {y: -1};
  if(this.childComposables.length < 1){
    return null;
  }
  for(var i = 0; i < this.childComposables.length; i++){
    if(this.childComposables[i].y > lowest.y){
      lowest = this.childComposables[i]
    }
  }
  return lowest;
}
Composeable.prototype.highestChild = function(){
  if(this.childComposables.length < 1){
    return null;
  }
  var highest = this.childComposables[0];

  for(var i = 0; i < this.childComposables.length; i++){
    if(this.childComposables[i].y < highest.y){
      highest = this.childComposables[i]
    }
  }
  return highest;
}
Composeable.prototype.getChildrenBounds = function(){
  if(this.childComposables.length < 1){
    return {top: this.y, bottom: (this.y + this.getHeight())}
  }

  var highest = this.highestChild();


  while(highest.childComposables.length > 0){
    highest = highest.highestChild();
  }
  var lowestChild = this.lowestChild();
  while(lowestChild.childComposables.length > 0){
    lowestChild = lowestChild.lowestChild();
  }
  var topY = highest.y;
  var bottomY = lowestChild.y + lowestChild.getHeight();
  return {top: topY, bottom: bottomY}
}

Composeable.prototype.indexOfParent = function(){
  try{
    return MinkComposer.currentSpace.columns[this.parent.x].composeables.indexOf(this.parent);

  }catch(err){
    return -1;
  }
}

Composeable.prototype.sameParent = function(b){
  if(this.parent && b.parent){
    if(this.parent.id == b.parent.id){
      return true;
    }
  }
  return false;
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
    if(MinkComposer.currentSpace.rootComposeables.length > 1){
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
Composeable.prototype.getSiblingsAbove = function(){

  var siblings = this.getSiblings()
  var siblingsBelow = [];
  if(siblings.length > 1){
    for(var i = 0; i < siblings.length; i++){
      if(siblings[i].y < this.y){
        siblingsBelow.push(siblings[i]);
      }
    }
    return siblingsBelow;
  }else{
    return [];
  }

}

Composeable.prototype.getSiblingsBelow = function(){

  var siblings = this.getSiblings()
  var siblingsBelow = [];
  if(siblings.length > 1){
    for(var i = 0; i < siblings.length; i++){
      if(siblings[i].y > this.y){
        siblingsBelow.push(siblings[i]);
      }
    }
    return siblingsBelow;
  }else{
    return [];
  }

}
Composeable.prototype.getSiblings = function(){
  if(this.isRoot()){
    var children = MinkComposer.currentSpace.rootComposeables;
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



MinkComposer.composeEventHandler = function(event){

  try{

    if(event.detail.type == 'pullup'){
      var composeable = MinkComposer.currentSpace.composeableMap.get(event.detail.composeableID);

      var height = composeable.getChildrenBounds().bottom + 30;

      window.setTimeout(function(){
        var newHeight = composeable.getChildrenBounds().bottom;

        MinkComposer.changeHeight(composeable, height, newHeight)

      }, 200);
    }else if(event.detail.type == 'growbelow'){
      var composeable = MinkComposer.currentSpace.composeableMap.get(event.detail.composeableID);
      var height = composeable.getChildrenBounds().bottom ;

      window.setTimeout(function(){
        var newHeight = composeable.getChildrenBounds().bottom;
        var diff = newHeight - height ;

        MinkComposer.changeHeight(composeable, height, newHeight)

      }, 200);
    }
  }catch(err){

  }

}

Composeable.prototype.getColumn = function(){
  return MinkComposer.currentSpace.columns[this.x];

}
Composeable.prototype.getParentId = function(){
  if(this.parent){
    return this.parent.id;
  }else{
    return -1;
  }
}
Composeable.prototype.positionAt = function(y){
  this.y = y;
  this.HTML.style.top = (y.toString() + "px");
  MinkComposer.currentSpace.columns[this.x].composeables.sort(function(a, b){
    return a.y - b.y;
  })
}
Composeable.prototype.positionBy = function(diff){
  this.y = this.y + diff;
  this.HTML.style.top = (this.y.toString() + "px");
  MinkComposer.currentSpace.columns[this.x].composeables.sort(function(a, b){
    return a.y - b.y;
  })
}

MinkComposer.shiftFamilyDownBy = function(composeable, amount){
  composeable.positionBy(amount);
  for(var i = 0; i < composeable.childComposables.length; i++){
    MinkComposer.shiftFamilyDownBy(composeable.childComposables[i], amount);
  }
  MinkComposer.reanchorFloatingInColumn(composeable.column);

}
MinkComposer.shiftChildren = function(composeable, amount){
  for(var i = 0; i < composeable.childComposables.length; i++){
    composeable.childComposables[i].positionBy(amount);
    MinkComposer.shiftFamilyDownBy(composeable.childComposables[i], amount);
  }
}

MinkComposer.matchToBottomOfPreviousSibling = function(composeable){
  var above = composeable.getSiblingsAbove();
  if(above.length > 0){
    var highestSib = above[above.length - 1];
    var bottom = highestSib.y + highestSib.getHeight();
    var myTop = composeable.getChildrenBounds().top;
    var diff = bottom - myTop;
    MinkComposer.shiftFamilyDownBy(composeable, diff);
//    MinkComposer.reflowAround(composeable, formerBottom)
  MinkComposer.reanchorFloatingInColumn(composeable.column);

  }
}
MinkComposer.reflowAround = function(composeable, formerBottom, formerBoundingBottom){
  if(composeable){
    var cardsThatShouldBeBelow = [];
    var cardsThatShouldBeAbove = [];
    var column = composeable.getColumn();
    for(var i = 0; i < column.composeables.length; i++){
      var siblings = column.composeables[i];
      if(siblings.getChildrenBounds().top >= formerBottom && siblings.id != composeable.id){
        cardsThatShouldBeBelow = cardsThatShouldBeBelow.concat(siblings);
      }else if(siblings.isLeaf()){
        if(siblings.getChildrenBounds().bottom >= (composeable.y + composeable.getHeight()) && siblings.id != composeable.id){
          cardsThatShouldBeBelow = cardsThatShouldBeBelow.concat(siblings);

        }
      }else if(siblings.id != composeable.id){
        cardsThatShouldBeAbove = cardsThatShouldBeAbove.concat(siblings);
      }

    }
    var boundingBox = composeable.getChildrenBounds();
    var moveDownBy = 0;


    if(cardsThatShouldBeBelow.length > 0){
      var diff = -1*(cardsThatShouldBeBelow[0].getChildrenBounds().top - composeable.getChildrenBounds().bottom);
       for(var i = 0; i < cardsThatShouldBeBelow.length; i++){
            if(cardsThatShouldBeBelow[i].isLeaf()){
              MinkComposer.matchToBottomOfPreviousSibling(cardsThatShouldBeBelow[i])
            }else{
              MinkComposer.shiftFamilyDownBy(cardsThatShouldBeBelow[i], diff);

            }

          }


    }
    MinkComposer.reanchorFloatingInColumn(composeable.column);

  }



}
MinkComposer.reanchorFloatingInColumn = function(column){
  for(var i = 0; i < column.floatingComposeables.length; i++){
    column.floatingComposeables[i].reanchor();
  }

}
MinkComposer.addComposeable = function(composeable){
  //go through column composeables and find which to insert below

  var column = composeable.getColumn();
  var insertAfter;
  for(var i = 0; i < column.composeables.length; i++){
    if(column.composeables[i].getParentId() == composeable.getParentId() && column.composeables[i].id != composeable.id){
      insertAfter = column.composeables[i];
    }
  }
  //we have some sibling to add this after
  if(insertAfter){
    var box = insertAfter.getChildrenBounds();

    var formerParentBounding = {bottom: 0};
    if(composeable.parent){
      formerParentBounding = composeable.parent.getChildrenBounds();

    }

    composeable.positionAt(box.bottom);
    MinkComposer.centerWithinBounding(composeable.parent, box.bottom);
  }
  else{
    if(composeable.parent){
      //child element
      //for now we only care about one type of expandable
      if(composeable.parent.getSiblingsAbove().length > 0){
        var above = composeable.parent.getSiblingsAbove();

        var lowest = above[above.length -1 ];
        if(lowest.isLeaf()){
          var formertop = composeable.parent.y
          composeable.positionAt(formertop);

        }else{
          var bottom = lowest.getChildrenBounds().bottom;
          composeable.positionAt(bottom);

        }

      }else{
        var formertop = composeable.parent.y
        composeable.positionAt(formertop);

      }

      MinkComposer.centerWithinBounding(composeable.parent);

    }else{
      //root element
      composeable.positionAt(0);

    }

    MinkComposer.reanchorFloatingInColumn(composeable.column);

}

MinkComposer.centerWithinBounding = function(composeableParent, properlyPreppedBottom){
  if(composeableParent){
    var bounding = composeableParent.getChildrenBounds();
    var bottom = composeableParent.y + composeableParent.getHeight();
    var highest = bounding.top;
    var lowest = bounding.bottom;
    var middle = (highest + lowest)/2 - composeableParent.getHeight()/2;
    if(middle < highest){
      middle = highest;

      //if the highest remaining kid is lower than it should be, move up


    }
    composeableParent.positionAt(middle);
    if(properlyPreppedBottom == null){

      MinkComposer.reflowAround(composeableParent, bottom);

    }else{
      MinkComposer.reflowAround(composeableParent, properlyPreppedBottom);

    }




    MinkComposer.centerWithinBounding(composeableParent.parent, bottom, lowest);
    MinkComposer.reanchorFloatingInColumn(composeableParent.column);

  }
}

MinkComposer.changeHeight = function(composeable, oldHeight, newHeight){
  //Pull up or push down siblings and their kids
  var diff = newHeight - oldHeight;

//  composeable.positionBy(diff/2);

  var siblings = composeable.getSiblingsBelow();
  for(var i = 0; i < siblings.length; i++){
    MinkComposer.shiftFamilyDownBy(siblings[i], diff);
  }
  MinkComposer.centerWithinBounding(composeable.parent);
  MinkComposer.reanchorFloatingInColumn(composeable.column);

  //center parent
}
MinkComposer.checkIfAttachmentIsExpanded = function(composeableID, possiblePileId){
  try{

    var composeable = MinkComposer.currentSpace.composeableMap.get(composeableID);
    for(var i = 0; i < composeable.childComposables.length; i++){
      var kid = composeable.childComposables[i];
      var pileid = $(kid.HTML).closest('.minkPile').attr('pileid');
      if(pileid == possiblePileId){
        return true;
      }
    }
    return false;
  }catch(e){
    return false;

  }

}

MinkComposer.removeRecursively = function(composeable){

  MinkComposer.changeHeight(composeable, (composeable.getChildrenBounds().bottom - composeable.getChildrenBounds().top), 0);
  if(composeable.parent){
    //remove from parent
    composeable.parent.childComposables.splice(composeable.parent.childComposables.indexOf(composeable), 1);
    composeable.parent.incidentallyRemovedKids.push(composeable);

  }
    //remove from column
  var column = composeable.getColumn();
  column.composeables.splice(column.composeables.indexOf(composeable), 1);



  //detach from the DOM
  composeable.formerHTMLParent = composeable.HTML.parentNode;
  $(composeable.HTML).detach();

  //and the same for all the kiddies
  var listOfKids = [];
  for(var i = 0; i < composeable.childComposables.length; i++){
    listOfKids.push(composeable.childComposables[i]);
  }
  for(var i = 0; i < listOfKids.length; i++){
    MinkComposer.removeRecursively(listOfKids[i]);
  }
  if(composeable.parent){
    MinkComposer.centerWithinBounding(composeable.parent);
  }
  MinkComposer.reanchorFloatingInColumn(composeable.column);

}







MinkComposer.removeAllKidsrecursively = function(composeable){
  var listOfKids = [];
  for(var i = 0; i < composeable.childComposables.length; i++){
    listOfKids.push(composeable.childComposables[i]);
  }
  for(var i = 0; i < listOfKids.length; i++){
    MinkComposer.removeRecursively(listOfKids[i]);
  }
  composeable.incidentallyRemovedKids = composeable.incidentallyRemovedKids.concat(listOfKids);
  MinkComposer.reanchorFloatingInColumn(composeable.column);

}
MinkComposer.restoreRecursively = function(composeable){

 if(composeable.parent){
    composeable.parent.childComposables.push(composeable);
  }
  $(composeable.HTML).appendTo(composeable.formerHTMLParent);
  MinkComposer.currentSpace.columns[composeable.x].addComposeable(composeable);
  MinkComposer.addComposeable(composeable)
  for(var i = 0; i < composeable.incidentallyRemovedKids.length; i++){
    MinkComposer.restoreRecursively(composeable.incidentallyRemovedKids[i]);
  }

  MinkComposer.reanchorFloatingInColumn(composeable.column);

}
MinkComposer.restoreKidsRecursively = function(composeableID, pileid){
  var composeableParent = MinkComposer.currentSpace.composeableMap.get(composeableID);
  var toAdd = composeableParent.pileIdToRemovedChildrenMap.get(pileid);
/*  var pile = $('.minkPile[@pileid="pileid"]')[0];
  pile.style.display = '';
*/
  for(var i = 0; i < toAdd.length; i++){
    MinkComposer.restoreRecursively(toAdd[i]);
  }

}

MinkComposer.snapUp = function(composeable){
  try{

    var above = composeable.getSiblingsAbove();

    if(above.length > 0){
      var highestSib = above[above.length - 1];
      var bottom = highestSib.getChildrenBounds().bottom;
      var myTop = composeable.getChildrenBounds().top;
      var formerBottom = composeable.getChildrenBounds().bottom;
      var diff = bottom - myTop;
      MinkComposer.shiftFamilyDownBy(composeable, diff);
      MinkComposer.reflowAround(composeable, formerBottom)

    }else{
      var myTop = composeable.getChildrenBounds().top;
      var formerBottom = composeable.getChildrenBounds().bottom;

      var diff = 0 - myTop;

      MinkComposer.shiftFamilyDownBy(composeable, diff);
      MinkComposer.reflowAround(composeable, formerBottom)

    }


    MinkComposer.reanchorFloatingInColumn(composeable.column);

  }catch(err){

  }

}

}
MinkComposer.removeChildrenWithPileId = function(composeableID, possiblePileId){

  var composeableParent = MinkComposer.currentSpace.composeableMap.get(composeableID);
  var formerBoundingBottom = composeableParent.getChildrenBounds().bottom;
  var formerBottom = composeableParent.getHeight() + composeableParent.y;
  var pile;
  var toRemove = [];
  for(var i = 0; i < composeableParent.childComposables.length; i++){
    var kid = composeableParent.childComposables[i];
    var pileid = $(kid.HTML).closest('.minkPile').attr('pileid');

    if(pileid == possiblePileId){
      pile = $(kid.HTML).closest('.minkPile');
      toRemove.push(kid);
    }
  }
  for(var i = 0; i < toRemove.length; i++){
    MinkComposer.removeRecursively(toRemove[i]);

  }
//  pile.style.display = 'none';
  MinkComposer.centerWithinBounding(composeableParent, composeableParent.getChildrenBounds().bottom);
  MinkComposer.snapUp(composeableParent)
  composeableParent.pileIdToRemovedChildrenMap.put(pileid, toRemove);

}


MinkComposer.findAttachmentPoint = function(composeable, childComposable){
  var childPileName = $(childComposable.HTML).closest('.minkPile').attr('pileid');
  var parentExplorables = $(composeable.HTML).find('.minkExplorableField');
  var parentExplorableIDs = [];
  for(var i = 0; i < parentExplorables.length; i++){
    var url = parentExplorables[i].getAttribute('rooturl');
    var collection = parentExplorables[i].getAttribute('collectionname');
    parentExplorableIDs.push((url + '|' + collection));
  }
}



MinkComposer.drawLinesToChildren = function(composeable, canvas, ctx){
  if(composeable.childComposables.length < 1){
    return;
  }else{

     var canvasY = canvas.getBoundingClientRect().top;
     var canvasX = canvas.getBoundingClientRect().left;

    var childPiles = $('.minkPileWrapper[parentcard="' + composeable.id + '"]');
    //find those piles kids, specifically the highest one
    for (var i = 0; i < childPiles.length; i++){

      var childPileID = $(childPiles[i]).find('.minkPile').attr('pileid');
      var parentExplorables = $(composeable.HTML).find('.minkExplorableField');
      var explorableHTML;
      for(var j = 0; j < parentExplorables.length; j++){
        var url = parentExplorables[j].getAttribute('rooturl');
        var collection = parentExplorables[j].getAttribute('collectionname');
        var id = url + '|' + collection;
        if(id == childPileID){
          explorableHTML = parentExplorables[j];
        }
      }

      var pileCards = $(childPiles[i]).find('.minkCardContainer');
      var topCard = pileCards[0].getBoundingClientRect();

      var lowestCard = pileCards[0];

      if(!topCard || !lowestCard){
        continue;
      }
      for(var q = 0; q < pileCards.length; q++){
        if(parseFloat(pileCards[q].style.top) > parseFloat(lowestCard.style.top)){
          lowestCard = pileCards[q];
        }
      }
      var bottomCard = lowestCard.getBoundingClientRect();
      var pileTopAttachPointX = topCard.left - canvasX;
      var pileTopAttachPointY = (topCard.top) - canvasY;
      var pileBotAttachPointX = bottomCard.left - canvasX;
      var pileBotAttachPointY = (bottomCard.top) + bottomCard.height - canvasY;

      var rootRect = explorableHTML.getBoundingClientRect();

      var rootAttachPointX = rootRect.left + rootRect.width - canvasX;
      var rootAttachPointY = (rootRect.top + rootRect.height / 2) - canvasY;


      var pathSplitX = rootAttachPointX + 1/2 * (pileTopAttachPointX - rootAttachPointX);
      var pathSplitY = (pileTopAttachPointY + (pileBotAttachPointY - pileTopAttachPointY)/2);
      ctx.beginPath();
      ctx.strokeStyle = '#999999';
      ctx.moveTo(rootAttachPointX, rootAttachPointY);
      ctx.bezierCurveTo((rootAttachPointX + (1/2 * Math.abs(pathSplitX - rootAttachPointX))), rootAttachPointY, pathSplitX - (1/2 * Math.abs((pathSplitX - rootAttachPointX))), pathSplitY, pathSplitX, pathSplitY);
      ctx.stroke();


      ctx.beginPath();
      ctx.strokeStyle = '#999999';
      ctx.moveTo(pathSplitX, pathSplitY);
      ctx.bezierCurveTo((pathSplitX + (1/2 * Math.abs(pileTopAttachPointX - pathSplitX))), pathSplitY, pileTopAttachPointX - (1/2 * Math.abs((pileTopAttachPointX - pathSplitX))), pileTopAttachPointY, pileTopAttachPointX, pileTopAttachPointY);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = '#999999';
      ctx.moveTo(pathSplitX, pathSplitY);
      ctx.bezierCurveTo((pathSplitX + (1/2 * Math.abs((pileBotAttachPointX - pathSplitX)))), pathSplitY, pileBotAttachPointX - (1/2 * Math.abs((pileBotAttachPointX - pathSplitX))), pileBotAttachPointY, pileBotAttachPointX, pileBotAttachPointY);
      ctx.stroke();

    }

    for(var k = 0; k < composeable.childComposables.length; k++){
      MinkComposer.drawLinesToChildren(composeable.childComposables[k], canvas, ctx);

    }

  }
}
// start the mainloop
function redrawCanvas(){
 var canvas = document.getElementById('minkAppCanvas');
 var ctx = canvas.getContext('2d');
 ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );
 ctx.canvas.height = $(document).height();
 ctx.canvas.width = $('#minkColumns').width();

 if(minkApp.currentQuery){
   for(var i = 0; i < MinkComposer.currentSpace.rootComposeables.length; i++){
     MinkComposer.drawLinesToChildren(MinkComposer.currentSpace.rootComposeables[i], canvas, ctx);
   }

 }//Find all expanded collections and draw lines to the top and bottom of their piles
}
