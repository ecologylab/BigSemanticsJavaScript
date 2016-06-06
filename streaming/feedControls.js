
function FeedControls()
{
	
}

FeedControls.prototype.constructControlsDiv = function() 
{
	var controlsDiv = document.createElement('div');
	controlsDiv.className = "feedControls";
	
	var imgPnP = document.createElement('img');
    imgPnP.className = "tweetStreamIcon";
    imgPnP.src = TwitterRenderer.pauseIconPath;
    imgPnP.onclick = TwitterRenderer.playPauseStream;
    
    controlsDiv.appendChild(imgPnP);
    return controlsDiv;
}