var Logger = {};

Logger.queue = [];

var MILLIS_BETWEEN_LOG = 12000;

var LOGGING_SERVICE = "http://ecoarray0:3080/i/event_log/";

function Operation(name, eventObj, timestamp)
{
	this.name = name;
	
	this.eventObj = eventObj;
	
	this.timestamp = timestamp;
	
	// add timestamp to eventObj	
	for(i in this.eventObj)
	{
		this.eventObj[i].timestamp = this.timestamp;
		break;
	}
}

Logger.init = function()
{
	MetadataRenderer.LoggingFunction = Logger.recordMICEOperation;
	
	setInterval(Logger.checkLogEvents, MILLIS_BETWEEN_LOG);
}

Logger.getCurrentUTCMilliTime = function()
{
	var d =  new Date();
	return d.getTime() + (d.getTimezoneOffset()*60*1000)/1000;
}

Logger.recordMICEOperation = function(eventObj)
{
	var op = new Operation("MICE Operation", eventObj, Logger.getCurrentUTCMilliTime());
	
	Logger.queue.push(op);
}

Logger.emptyLogQueue = function()
{
	var hashKey = "pcfndmfodhl";
	
	//var name = USER_NAME ? USER_NAME : "AnonymousUser";
	var name = "AnonymousUser";
	
	var logMessage = {
		log_post: {
			hash_key: hashKey,
			username: name,
			app: "BubblingTweets",
			events: this.translateQueue()
		}
	};
	
	return logMessage;
}

Logger.translateQueue = function()
{
	var events = [];
	
	for(var i = 0; i < this.queue.length; i++)
	{
		var q = this.queue[i];
		events.push(q.eventObj);
	}
	this.oldQueue = this.queue;
	this.queue = [];
	
	return events;
}

Logger.clearLogQueue = function()
{
	this.oldQueue = [];
}

Logger.dontClearLogQueue = function()
{
	for(var i = 0; i < this.oldQueue.length; i++)
	{
		this.queue.push(this.oldQueue[i]);
	}
	this.oldQueue = [];
}

Logger.logEvents = function(logMessage)
{
	var fd = new FormData();
	fd.append("events_json ", JSON.stringify(logMessage));
		 
	var xhr = new XMLHttpRequest();
	xhr.open("POST", LOGGING_SERVICE);
	xhr.onload = function()
	{
		if(xhr.statusText == "OK")
		{
	   		//console.log("Logging Successful");
			Logger.clearLogQueue();
	   	}	   		
	   	else
	   	{
	   		//console.log("Logging Failed");
	   		Logger.dontClearLogQueue();
	   	}	
	   		
	}
	xhr.send(fd);
}

Logger.checkLogEvents = function()
{
	if(Logger.queue.length > 1)
		Logger.logEvents(Logger.emptyLogQueue());
}
