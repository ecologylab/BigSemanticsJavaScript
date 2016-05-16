$(".navLink").hover(function() {
    //have to animate to scrollWidth because animating to 'auto' isn't possible
    $(this).animate({
        width: this.scrollWidth
    });
}, function() {
    //store element so that it can be used in checkHover
    var ele = $(this);
    
    var checkHover = function() {
        //if user is still hovering over links, don't collapse      
        if($("#links").is(":hover")) {
            //check again in 100ms
            setTimeout(checkHover, 100);
            return;
        };
        
        ele.animate({
            width: '32px'
        });
    }
    
    //can't do this immediately of slight gap between links
    //setTimeout(checkHover, 50);
    checkHover();
});