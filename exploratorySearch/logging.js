
/*
 * A series of test functions to help me sketch out how to send log messages
 */

//Stolen (appropriated) from ideaMache/site_media/static/mache/code/logging/historicOperation






/*
 * A function that takes the name of the event and its timestamp and wraps it up into a tasty pie of an event
 */
/*
function newLogEvent(eventsToSend, appName, userName, hashkey){
	
	//yay magic numbers
	var hashKey = hashkey;
	var appname = appName;
	var name = userName;
	var events = eventsToSend;
	var logMessage = {
		log_post: {
			hash_key: hashKey,
			username: name,
			app: appname,
			events: events
		}
	};
	
	return logMessage;
}
*/

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
//Comes up with a dummy log event
function dummnyEvent(nquery){

	eventObj = {
			new_query: {
				query: nquery,
				timestamp: 1337
			}
		};
	

	return eventObj;
}

