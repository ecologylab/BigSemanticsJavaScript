var Logger = {};

Logger.queue = [];

var MILLIS_BETWEEN_LOG = 12000;


var LOGGING_SERVICE = "https://ideamache.ecologylab.net/i/event_log/";//"http://ecoarray0:3080/i/event_log/";

Logger.username = "pcfndmfodhl";

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

Logger.init = function(userid, cond)
{
	MetadataLoader.logger = Logger.recordMICEOperation;
	
	Logger.hash_key = userid;
	
	if (cond != "none")
		Logger.username = cond + "_s15_s2";
	
	setInterval(Logger.checkLogEvents, MILLIS_BETWEEN_LOG);
}

Logger.recordMICEOperation = function(eventObj)
{
	var op = new Operation("MICE Operation", eventObj, Util.getCurrentUTCMilliTime());
	
	Logger.queue.push(op);
}

Logger.emptyLogQueue = function()
{
	//var name = USER_NAME ? USER_NAME : "AnonymousUser";
	//var name = "AnonymousUser";
	
	var logMessage = {
		log_post: {
			hash_key: Logger.hash_key,
			username: Logger.username,
			app: "TweetBubble",
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
	if(Logger.queue.length > 0)
		Logger.logEvents(Logger.emptyLogQueue());
}
