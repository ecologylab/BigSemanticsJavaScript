
/*
 * A series of test functions to help me sketch out how to send log messages
 */

//Stolen (appropriated) from ideaMache/site_media/static/mache/code/logging/historicOperation

function HistoricEvent(name, eventObj, timestamp)
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

//Send the events
function sendVeryUsefulEvent(){
	var event = logNewQuery("testytesttest");
	var logMessage = newLogWrapper(event);
	console.log(logMessage);
	var fd = new FormData();
	fd.append("events_json ", JSON.stringify(logMessage));
		 
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "/i/event_log/");
	xhr.onload = function()
	{
		if(xhr.statusText == "OK")
		{
	   		console.log("Logging Successful");
	   		
	   	}	   		
	   	else
	   	{
	   		console.log("Logging Failed");
	   	}	
	   		
	}
	xhr.send(fd);

	
}
//Makes the user/hashkey/time to wrap around the event
function newLogWrapper(eventToSend){
	
	//yay magic numbers
	var hashKey = 612345;
	var test ="test";
	var name = "AnonymousUser";
	var events = new Array(eventToSend);
	var logMessage = {
		log_post: {
			hash_key: hashKey,
			username: name,
			app: test,
			events: events
		}
	};
	
	return logMessage;
}
//Comes up with a dummy log event
function logNewQuery(nquery){

	eventObj = {
			new_query: {
				query: nquery,
				timestamp: 1337
			}
		};
	

	return eventObj;
}