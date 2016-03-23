var MinkComposer = {};
MinkComposer.composeableMap = new Map()
MinkComposer.rootComposeables = [];
MinkComposer.columns = [];

function Column(number, HTML){
  this.number = number
  this.HTML = HTML;
  this.composeables = [];
  MinkComposer.columns.push(this)

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

  this.container = $(HTML).closest('.minkColumn')[0];
  this.x = this.container.getAttribute('column');
  MinkComposer.columns[this.x].addComposeable(this);
  this.childrenHeight = 0;
  MinkComposer.composeableMap.put(this.id, this);
  Material.addMaterial(this.id, $(this.HTML).find('.minkContainer')[0], 1)


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
    return MinkComposer.columns[this.parent.x].composeables.indexOf(this.parent);

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

MinkComposer.composeEventHandler = function(event){

  try{

    if(event.detail.type == 'pullup'){
      var composeable = MinkComposer.composeableMap.get(event.detail.composeableID);

      var height = composeable.getHeight();

      window.setTimeout(function(){
        var newHeight = composeable.getHeight();
        var diff = newHeight - height - 30;
        MinkComposer.removeExcessSpaceBelow(composeable, diff);

      }, 200);
    }else if(event.detail.type == 'growbelow'){
      var composeable = MinkComposer.composeableMap.get(event.detail.composeableID);
      var height = composeable.getHeight();

      window.setTimeout(function(){
        var newHeight = composeable.getHeight();
        var diff = newHeight - height ;

        MinkComposer.addSpaceBelow(composeable, diff)

      }, 200);
    }
  }catch(err){

  }

}

Composeable.prototype.getColumn = function(){
  return MinkComposer.columns[this.x];

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
  MinkComposer.columns[this.x].composeables.sort(function(a, b){
    return a.y - b.y;
  })
}
Composeable.prototype.positionBy = function(diff){
  this.y = this.y + diff;
  this.HTML.style.top = (this.y.toString() + "px");
  MinkComposer.columns[this.x].composeables.sort(function(a, b){
    return a.y - b.y;
  })
}

MinkComposer.shiftFamilyDownBy = function(composeable, amount){
  composeable.positionBy(amount);
  for(var i = 0; i < composeable.childComposables.length; i++){
    MinkComposer.shiftFamilyDownBy(composeable.childComposables[i], amount);
  }
}
MinkComposer.reflowAround = function(composeable, formerBottom, formerBoundingBottom){
  if(composeable){
    var cardsThatShouldBeBelow = [];
    var column = composeable.getColumn();
    for(var i = 0; i < column.composeables.length; i++){
      var siblings = column.composeables[i];
      if(siblings.getChildrenBounds().top >= formerBottom && siblings.id != composeable.id){
        cardsThatShouldBeBelow = cardsThatShouldBeBelow.concat(siblings);
      }
    }
    var boundingBox = composeable.getChildrenBounds();
    var moveDownBy = 0;


    if(cardsThatShouldBeBelow.length > 0){
      var diff = -1*(cardsThatShouldBeBelow[0].getChildrenBounds().top - composeable.getChildrenBounds().bottom);

       for(var i = 0; i < cardsThatShouldBeBelow.length; i++){
          MinkComposer.shiftFamilyDownBy(cardsThatShouldBeBelow[i], diff);


      }
    }
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
      var formertop = composeable.parent.y
      composeable.positionAt(formertop);

      MinkComposer.centerWithinBounding(composeable.parent);

    }else{
      //root element
      composeable.positionAt(0);

    }
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
    }
    composeableParent.positionAt(middle);
    if(properlyPreppedBottom == null){

      MinkComposer.reflowAround(composeableParent, bottom);

    }else{
      MinkComposer.reflowAround(composeableParent, properlyPreppedBottom);

    }




    MinkComposer.centerWithinBounding(composeableParent.parent, bottom, lowest);

  }
}







  //     var index = MinkComposer.rootComposeables.indexOf(composeable);
  //     if(index == 0){
  //       composeable.reposition(0);
  //     }else{
  //       var ourElement = MinkComposer.rootComposeables[index-1].HTML.scrollHeight + MinkComposer.rootComposeables[index-1].y;
  //       composeable.reposition(ourElement);
  //     }
  //   }else{
  //     var parent = composeable.parent;
  //     var baseHeight = parent.y;
  //     if(!composeable.hasSilbings()){
  //       var currentScrollheight = composeable.HTML.scrollHeight;
  //
  //       composeable.reposition(baseHeight);
  //       parent.childrenHeight = composeable.HTML.scrollHeight;
  //       MinkComposer.createSpaceForSiblings(composeable, 0);
  //
  //     }else{
  //       //right now hard coded for two siblings
  //       var siblingsHeight = 0;
  //       var siblings = composeable.getSiblings();
  //       for(var i = 0; i < siblings.length; i++){
  //         siblingsHeight = siblingsHeight + siblings[i].getHeight();
  //
  //       }
  //       var newY = siblingsHeight + siblings[0].y;
  //       composeable.reposition(newY);
  //
  //       composeable.parent.reposition(parent.y + (composeable.getHeight()/2));
  //       MinkComposer.createSpaceAroundParent(parent, composeable.getHeight());
  //       MinkComposer.createSpaceForSiblings(composeable, 0);
  //     }
  //   }

  //insert
  //reflow elements below while recursively centering their parents/*
}
// MinkComposer.reflowColumn = function(composeable){
//   //go through column composeables and ensure adequate space
//   //recursively centerParents and then go forward to reorient kids
// }
//
//
// MinkComposer.removeComposeable = function(composeable){
//   //remove all kids, reflowing each column and centering
//   //forward track to straiten up
// }





// MinkComposer.pushOutSiblings = function(composeable){
//   var boundingBox = composeable.boundingYOfChildTree();
//   var siblings = composeable.getSiblings();
//
//
//   var indexOf = column.composeables.indexOf(composeable);
//
//   var cardsThatShouldBeBelow = [];
//   for(var i = indexOf + 1; i < column.composeables.length; i++){
//     var siblings = column.composeables[i];
//     cardsThatShouldBeBelow = cardsThatShouldBeBelow.concat(siblings);
//   }
//   var moveDownBy = 0;
//   if(cardsThatShouldBeBelow.length > 0){
//
//     //check to make sure we don't get above the parent
//     var diff = boundingBox.bottom - cardsThatShouldBeBelow[0].boundingYOfChildTree().top;
//     if(diff != 0){
//       var parentBottom = composeable.y + composeable.getHeight();
//       moveDownBy = moveDownBy + diff;
//       if(parentBottom > (cardsThatShouldBeBelow[0].y + moveDownBy)){
//         moveDownBy = parentBottom - cardsThatShouldBeBelow[0].y;
//       }
//
//       for(var i = 0; i < cardsThatShouldBeBelow.length; i++){
//           cardsThatShouldBeBelow[i].reposition(cardsThatShouldBeBelow[i].y + moveDownBy);
//           MinkComposer.moveKidsWithParent(cardsThatShouldBeBelow[i], moveDownBy)
//         }
//       }
//     }
//
// }
//
// MinkComposer.recenterParent = function(composeableParent, dontMoveSiblings){
//   if(composeableParent){
//     var bounding = composeableParent.boundingYOfChildTree();
//     var highest = bounding.top;
//     var lowest = bounding.bottom;
//     var middle = (highest + lowest)/2 - composeableParent.getHeight()/2;
//     var accountForParentHeight = true;
//     if(middle < highest){
//       middle = highest;
//       accountForParentHeight = false;
//     }
//     var ogHeight = composeableParent.y;
//     var diff =  -ogHeight + middle;
//     var ogDiff = diff;
//     if(accountForParentHeight){
//       diff = diff - composeableParent.getHeight()/2
//
//     }
//     composeableParent.reposition(middle);
//   //  if(!dontMoveSiblings)
//       MinkComposer.pushOutSiblings(composeableParent);
//
//
//   }
//
// }
// //assumes the parent is in the right place but the kids gotta move
// MinkComposer.moveKidsWithParent = function(parentComposeable, diff){
//   for(var i = 0; i < parentComposeable.childComposables.length; i++){
//     var kid = parentComposeable.childComposables[i];
//     kid.reposition(kid.y + diff);
//     MinkComposer.moveKidsWithParent(kid, diff);
//   }
// }
//
// MinkComposer.addSpaceBelow = function(composeable, diff){
//   var column = MinkComposer.columns[composeable.x];
//   var indexOf = column.composeables.indexOf(composeable);
//
//   var cardsThatShouldBeBelow = [];
//   for(var i = indexOf + 1; i < column.composeables.length; i++){
//     var siblings = column.composeables[i];
//     cardsThatShouldBeBelow = cardsThatShouldBeBelow.concat(siblings);
//   }
//
//
//   var lastMovedComp;
//   //push down siblings by diff, then push down others by partial diff
//   for(var i = 0 ; i < cardsThatShouldBeBelow.length; i++){
//
//
//     if(!cardsThatShouldBeBelow[i].parent || (cardsThatShouldBeBelow[i].parent.id == composeable.parent.id)){
//         cardsThatShouldBeBelow[i].reposition(cardsThatShouldBeBelow[i].y + diff);
//         MinkComposer.recenterParent(cardsThatShouldBeBelow[i].parent)
//         lastMovedComp = cardsThatShouldBeBelow[i];
//     }else{
//       MinkComposer.recenterParent(cardsThatShouldBeBelow[i].parent)
//
//     }
//   }
//   MinkComposer.recenterParent(composeable.parent, false, true);
//
//
//
// }
// MinkComposer.removeExcessSpaceBelow = function(composeable, diff){
//   var column = MinkComposer.columns[composeable.x];
//   var indexOf = column.composeables.indexOf(composeable);
//
//   var cardsThatShouldBeBelow = [];
//   for(var i = indexOf + 1; i < column.composeables.length; i++){
//     var siblings = column.composeables[i];
//     cardsThatShouldBeBelow = cardsThatShouldBeBelow.concat(siblings);
//   }
//   var lastComposeable= composeable;
//   for(var i = 0; i < cardsThatShouldBeBelow.length; i++){
//     cardsThatShouldBeBelow[i].reposition(cardsThatShouldBeBelow[i].y + diff);
//
//     MinkComposer.recenterParent(cardsThatShouldBeBelow[i].parent)
//
//   }
//   MinkComposer.recenterParent(composeable.parent, true)
//
// }
//
//
// MinkComposer.insertComposeable = function(composeable){
//   if(composeable.isRoot()){
//     var index = MinkComposer.rootComposeables.indexOf(composeable);
//     if(index == 0){
//       composeable.reposition(0);
//     }else{
//       var ourElement = MinkComposer.rootComposeables[index-1].HTML.scrollHeight + MinkComposer.rootComposeables[index-1].y;
//       composeable.reposition(ourElement);
//     }
//   }else{
//     var parent = composeable.parent;
//     var baseHeight = parent.y;
//     if(!composeable.hasSilbings()){
//       var currentScrollheight = composeable.HTML.scrollHeight;
//
//       composeable.reposition(baseHeight);
//       parent.childrenHeight = composeable.HTML.scrollHeight;
//       MinkComposer.createSpaceForSiblings(composeable, 0);
//
//     }else{
//       //right now hard coded for two siblings
//       var siblingsHeight = 0;
//       var siblings = composeable.getSiblings();
//       for(var i = 0; i < siblings.length; i++){
//         siblingsHeight = siblingsHeight + siblings[i].getHeight();
//
//       }
//       var newY = siblingsHeight + siblings[0].y;
//       composeable.reposition(newY);
//
//       composeable.parent.reposition(parent.y + (composeable.getHeight()/2));
//       MinkComposer.createSpaceAroundParent(parent, composeable.getHeight());
//       MinkComposer.createSpaceForSiblings(composeable, 0);
//     }
//   }
//
//
// }
//
// MinkComposer.createSpaceAroundParent = function(composeable, amount){
//   if(composeable.hasSilbings()){
//
//     var siblingsIncludingComp;
//     if(composeable.isRoot()){
//       siblingsIncludingComp = MinkComposer.rootComposeables;
//
//     }else{
//       siblingsIncludingComp = composeable.parent.childComposables;
//
//     }
//
//     var index = siblingsIncludingComp.indexOf(composeable);
//
//
//     for (var i = index+1; i < siblingsIncludingComp.length; i++){
//       var sibling = siblingsIncludingComp[i];
//       sibling.reposition(sibling.y + amount);
//       MinkComposer.moveKidsWithParent(sibling, amount)
//     }
//     if(!composeable.isRoot()){
//       MinkComposer.createSpaceAroundParent(composeable.parent, amount);
//
//     }
//
//   }
//
// }
//
// MinkComposer.centerViewOnComposeable = function(composeable){
//
// }
//
// MinkComposer.createSpaceForSiblings = function(composeable, amount){
//   //tells the other mink cards around an expanded parent to fuck off
//
//   //Start from the top. If there's an intersection, increase the amount and send it down
//
//
//   var column = MinkComposer.columns[composeable.x];
//
//   var indexOfParent = composeable.indexOfParent();
//   var parentColumn = MinkComposer.columns[composeable.parent.x];
//   //try and push out cards in piles above
//   var cardsThatShouldBeAbove = [];
//   for(var i = indexOfParent - 1; i >= 0; i--){
//     var cousinCompoaseables = parentColumn.composeables[i].childComposables;
//     cardsThatShouldBeAbove = cardsThatShouldBeAbove.concat(cousinCompoaseables);
//   }
//   var amountUp = 0;
//   //if this is the first inserted of a set of kids, move down a bit
//   if(!composeable.hasSilbings()){
//     amountUp = -20;
//   }
//
//   for(var i = cardsThatShouldBeAbove.length - 1 ; i >= 0; i--){
//
//       var diff =  composeable.y - cardsThatShouldBeAbove[i].y - cardsThatShouldBeAbove[i].getHeight() ;
//       if (diff < -2){
//         amountUp = amountUp + diff;
//       }
//
//   }
//   composeable.reposition(composeable.y - amountUp)
//
//   var cardsThatShouldBeBelow = [];
//   for(var i = indexOfParent + 1; i < parentColumn.composeables.length; i++){
//     var cousinCompoaseables = parentColumn.composeables[i].childComposables;
//     cardsThatShouldBeBelow = cardsThatShouldBeBelow.concat(cousinCompoaseables);
//   }
//   var amountDown = 20;
//   for(var i = 0 ; i < cardsThatShouldBeBelow.length; i++){
//
//       var diff =  composeable.y + composeable.getHeight() - cardsThatShouldBeBelow[i].y  ;
//       if (diff >= 0){
//         amountDown = amountDown + diff;
//       }
//       cardsThatShouldBeBelow[i].reposition(cardsThatShouldBeBelow[i].y + amountDown);
//   }
//
//   //try and push out cards in piles below
//
//
//
//
//
//
//
//
//
//
//
//   //
//   //
//   // var index = column.composeables.indexOf(composeable);
//   // var composeableBottom = composeable.y + composeable.getHeight();
//   //
//   //
//   //
//   // //If we're running into another pile, create some extra space
//   //
//   //
//   //
//   //
//   // firstEncounteredStranger = true;
//   // for(var i = index + 1; i < column.composeables.length; i++){
//   //   if(!composeable.sameParent(column.composeables[i])){
//   //
//   //     if(firstEncounteredStranger){
//   //       amount = amount + 20;
//   //       firstEncounteredStranger = false;
//   //     }
//   //     var diff =  composeableBottom - column.composeables[i].y;
//   //     if (diff > 2){
//   //       amount = amount + diff;
//   //     }
//   //   }
//   //   column.composeables[i].reposition(column.composeables[i].y + amount)
//   // }
//   //
//   //
//
// }

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
 ctx.canvas.width = $(document).width();

 if(minkApp.currentQuery){
   for(var i = 0; i < MinkComposer.rootComposeables.length; i++){
     MinkComposer.drawLinesToChildren(MinkComposer.rootComposeables[i], canvas, ctx);
   }

 }


 //Find all expanded collections and draw lines to the top and bottom of their piles
}
