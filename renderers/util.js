var application_name = "tweetbubble";

var Util = {};

Util.YES = "yes";
Util.NO = "no";

Util.getCurrentUTCMilliTime = function()
{
	var d =  new Date();
	return d.getTime() + (d.getTimezoneOffset()*60*1000)/1000;
}

Util.info_sheet = "TweetBubble Extension for Chrome\n\n" +
"INFORMATION SHEET\n" +
"Interacting With Information\n" +
"Introduction\n" +
"The purpose of this sheet is to provide you information that may affect your decision as to whether or not to participate in this research study.  If you decide to participate in this study, this form will also be used to " +
"record your consent.\n\n" +
"You have been asked to participate in a research project studying interactive systems that work with information.  The purpose of this study to investigate how the designs of interactive systems affect the way people interact with and understand information. You were selected to be a possible participant because you are interested in collecting and representing information.\n\n" +
"What will I be asked to do?\n" +
"If you agree to participate in this study, you will be asked to use versions of an interactive system to work with information. You will be asked to perform tasks that involve searching, collecting and organizing information resources from the web.\n\n" +
"What are the risks involved in this study?" +
"The risks associated in this study are minimal, and are not greater than risks ordinarily encountered in daily life.\n\n" +
"What are the possible benefits of this study?" +
"The possible benefits of participation include learning to work with information on novel interactive systems and the discovery of new ideas and information.\n\n" +
"Do I have to participate?" +
"No.  Your participation is voluntary.  You may decide not to participate or to withdraw at any time without your current or future relations with Texas A&M University being affected.\n\n" +
"Who will know about my participation in this research study?" +
"This study is confidential, and we will not link or associate your name with your responses for the study." +
"The records of this study will be kept private unless you explicitly share your responses with others. No identifiers linking you to this study will be included in any sort of report that might be published.  Research records will be stored securely and only Dr. Kerne and his research assistants will have access to the records.\n\n" +
"Whom do I contact with questions about the research?" +
"If you have questions regarding this study, you may contact Dr. Kerne (979 862-3217, andruid @cse.tamu.edu).\n\n" +
"Whom do I contact about my rights as a research participant?" +
"This research study has been reviewed by the Human Subjects’ Protection Program and/or the Institutional Review Board at Texas A&M University.  For research-related problems or questions regarding your rights as a research participant, you can contact these offices at (979)458-4067 or irb@tamu.edu." +
"\n\n";

Util.getInformationSheetResponse = function(callback)
{
	var info_sheet = 
		"<h3>TweetBubble Extension for Chrome</h3><br>" +
		"<h4>USER STUDY</h4>" +
		"<p>So we can develop research on how people interact with information TweetBubble will collect anonymous data about how you use it.</p>" +
		"<p>The purpose of this sheet is to provide you information that may affect your decision as to whether or not to participate in this research study.  If you decide to participate in this study, this form will also be used to " +
		"record your consent.</p><br>" +
		"<p>You have been asked to participate in a research project studying interactive systems that work with information.  The purpose of this study to investigate how the designs of interactive systems affect the way people interact with and understand information. You were selected to be a possible participant because you are interested in collecting and representing information.</p><br>" +
		"<p><b>What will I be asked to do?</b>" +
		"If you agree to participate in this study, you will be asked to use versions of an interactive system to work with information. You will be asked to perform tasks that involve searching, collecting and organizing information resources from the web.</p><br>" +
		"<p><b>What are the risks involved in this study?</b>" +
		"The risks associated in this study are minimal, and are not greater than risks ordinarily encountered in daily life.</p><br>" +
		"<p><b>What are the possible benefits of this study?</b>" +
		"The possible benefits of participation include learning to work with information on novel interactive systems and the discovery of new ideas and information.</p><br>" +
		"<p><b>Do I have to participate?</b>" +
		"No.  Your participation is voluntary.  You may decide not to participate or to withdraw at any time without your current or future relations with Texas A&M University being affected.</p><br>" +
		"<p><b>Who will know about my participation in this research study?</b>" +
		"This study is confidential, and we will not link or associate your name with your responses for the study." +
		"The records of this study will be kept private unless you explicitly share your responses with others. No identifiers linking you to this study will be included in any sort of report that might be published.  Research records will be stored securely and only Dr. Kerne and his research assistants will have access to the records.</p><br>" +
		"<p><b>Whom do I contact with questions about the research?</b>" +
		"If you have questions regarding this study, you may contact Dr. Kerne (979 862-3217, andruid @cse.tamu.edu).</p><br>" +
		"<p><b>Whom do I contact about my rights as a research participant?</b>" +
		"This research study has been reviewed by the Human Subjects’ Protection Program and/or the Institutional Review Board at Texas A&M University.  For research-related problems or questions regarding your rights as a research participant, you can contact these offices at (979)458-4067 or irb@tamu.edu." +
		"</p><br>";
	
	var removeDivAndReturnResp = function(event) {
		document.body.removeChild(bgDiv);
		document.body.removeChild(outerDiv);
		if (event.target.value == "OK")
			callback(Util.YES);
		else
			callback(Util.NO);
	}
	
	var doNothing = function() {}
	
	//var handleScroll = function() {
	//	outerDiv.style.top = window.scrollY;
	//}
	
	var highlightbutton = function(event) {
		if (event.target.value == "OK")
			event.target.style.background = "#55ACEE";
		else
			event.target.style.background = "#AA0000";
	}
	
	var unhighlightbutton = function(event) {
		event.target.style.background = "#ddd";
	}
	
	var button_ok = document.createElement("input");
	button_ok.type = "button";
	button_ok.value = "OK";
	button_ok.className = "infoSheetButton";
	button_ok.onclick = removeDivAndReturnResp;
	button_ok.onmouseover = highlightbutton;
	button_ok.onmouseout = unhighlightbutton;
	
	var button_cancel = document.createElement("input");
	button_cancel.type = "button";
	button_cancel.value = "Cancel";
	button_cancel.className = "infoSheetButton";
	button_cancel.style.float = "right";
	button_cancel.onclick = removeDivAndReturnResp;
	button_cancel.onmouseover = highlightbutton;
	button_cancel.onmouseout = unhighlightbutton;
			
	var buttonDiv = document.createElement("div");
	buttonDiv.appendChild(button_ok);
	buttonDiv.appendChild(button_cancel);
	
	var bgDiv = document.createElement("div");
	bgDiv.className = "infoSheetBgDiv";
	bgDiv.style.width = window.screen.width + "px";
	bgDiv.style.height = window.screen.height + "px";
	bgDiv.onClick = doNothing;
	
	var outerDiv = document.createElement("div");
	outerDiv.innerHTML = info_sheet;	
	outerDiv.className = "infoSheetDiv";
	outerDiv.appendChild(buttonDiv);
			
	document.body.appendChild(bgDiv);
	document.body.appendChild(outerDiv);
	//window.addEventListener("scroll", handleScroll);
}
