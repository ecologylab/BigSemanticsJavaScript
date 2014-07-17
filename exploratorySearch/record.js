var TheRecord = {};
//All recorded events from the beginning of the session 
TheRecord.items = [];
//Recorded events yet to be sent
TheRecord.queue = [];
//Keeps a copy of the queue around incase the logging service declares independence from your commands
TheRecord.oldQueue =[];
TheRecord.addEvent = function(event){
	this.queue.push(event);
	this.items.push(event);
}
TheRecord.emptyQueue = function(){
	
	var hashKey = "not_yet_assigned";
    //Code for the obtaining of hashkeys
	
	//Code for the discovering of names
	var USER_NAME = null;
	var name = USER_NAME ? USER_NAME : "AnonymousUser";
	
	var logMessage = {
		log_post: {
			hash_key: hashKey,
			username: name,
			events: this.translateQueue()
		}
	};
	
	return logMessage;
} 


TheRecord.translateQueue = function()
{
	var events = [];
	
	for(var i = 0; i < this.queue.length; i++)
	{
		events.push(this.queue[i]);
	}
	this.oldQueue = this.queue;
	this.queue = [];
	
	return events;
}
TheRecord.clearLogQueue = function ()
{
	this.oldQueue = [];
}
TheRecord.dontClearLogQueue = function ()
{
	for(var i = 0; i < this.oldQueue.length; i++)
	{
		this.queue.push(this.oldQueue[i]);
	}
	this.oldQueue = [];
}
function sendLog(log){
	
	console.log(log);
	var fd = new FormData();
	fd.append("events_json ", JSON.stringify(log));
		 
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "http://ecoarray0:3801/i/event_log/");
	xhr.onload = function()
	{
		if(xhr.statusText == "OK")
		{
	   		console.log("Logging Successful");
	   		TheRecord.clearLogQueue();
	   	}	   		
	   	else
	   	{
	   		console.log("Logging Failed");
	   		TheRecord.dontClearLogQueue();
	   	}	
	   		
	}
	xhr.send(fd);
	
}
function getLog(){
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://ecoarray0:3801/i/event_log/?username=AnonymousUser");
	
	xhr.send();
	xhr.onload = function()
	{
		if(xhr.statusText == "OK")
		{
	   		console.log(xhr.response);
	   	}	   		
	   	else
	   	{
	   		console.log(xhr.response);
	   	}	
	   		
	}
}
//Father Time!!

var MILLIS_BETWEEN_SAVE = 12000;

var FatherTime = {};

FatherTime.init = function()
{
	setInterval(FatherTime.aTimeToLog, MILLIS_BETWEEN_SAVE);	
}

FatherTime.aTimeToLog = function()
{
	sendLog(TheRecord.emptyQueue());
}
