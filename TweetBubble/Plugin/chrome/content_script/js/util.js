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
	var outerDiv = document.createElement("div");
	
	var info_sheet = "<h3>INFORMATION SHEET</h3>" +
		"<h5>Interacting With Information</h5>" +
		"<h5>Introduction</h5>" +
		"<p>The purpose of this sheet is to provide you information that may affect your decision as to whether or not to participate in this research study.  If you decide to participate in this study, this form will also be used to " +
		"record your consent.</p>" +
		"<p>You have been asked to participate in a research project studying interactive systems that work with information.  The purpose of this study to investigate how the designs of interactive systems affect the way people interact with and understand information. You were selected to be a possible participant because you are interested in collecting and representing information.</p>" +
		"<p><b>What will I be asked to do?</b>" +
		"If you agree to participate in this study, you will be asked to use versions of an interactive system to work with information. You will be asked to perform tasks that involve searching, collecting and organizing information resources from the web.</p>" +
		"<p><b>What are the risks involved in this study?</b>" +
		"The risks associated in this study are minimal, and are not greater than risks ordinarily encountered in daily life.</p>" +
		"<p><b>What are the possible benefits of this study?</b>" +
		"The possible benefits of participation include learning to work with information on novel interactive systems and the discovery of new ideas and information.</p>" +
		"<p><b>Do I have to participate?</b>" +
		"No.  Your participation is voluntary.  You may decide not to participate or to withdraw at any time without your current or future relations with Texas A&M University being affected.</p>" +
		"<p><b>Who will know about my participation in this research study?</b>" +
		"This study is confidential, and we will not link or associate your name with your responses for the study." +
		"The records of this study will be kept private unless you explicitly share your responses with others. No identifiers linking you to this study will be included in any sort of report that might be published.  Research records will be stored securely and only Dr. Kerne and his research assistants will have access to the records.</p>" +
		"<p><b>Whom do I contact with questions about the research?</b>" +
		"If you have questions regarding this study, you may contact Dr. Kerne (979 862-3217, andruid @cse.tamu.edu).</p>" +
		"<p><b>Whom do I contact about my rights as a research participant?</b>" +
		"This research study has been reviewed by the Human Subjects’ Protection Program and/or the Institutional Review Board at Texas A&M University.  For research-related problems or questions regarding your rights as a research participant, you can contact these offices at (979)458-4067 or irb@tamu.edu." +
		"</p>";
	
	outerDiv.innerHTML = info_sheet;
	
	var removeDiv = function(resp) {
		document.body.removeChild(outerDiv);
	}
	
	var returnYes = function() {
		callback(Util.YES);
	}
	
	var returnNo = function() {
		callback(Util.NO);
	}
	
	var button_ok = document.createElement("button");
	button_ok.value = "OK";
	button_ok.onclick = returnYes;
	
	var button_cancel = document.createElement("button");
	button_cancel.value = "Cancel";
	button_cancel.onclick = returnNo;
	
	outerDiv.appendChild(button_ok);
	outerDiv.appendChild(button_cancel);
	
	//set zIndex
	var nodes = document.body.childNodes;
	var node = null;
	for (var i = 0; i < nodes.length; i++)
	{
		if (nodes[i].offsetWidth && nodes[i].offsetHeight 
				&& nodes[i].offsetWidth > 0 && nodes[i].offsetHeight > 0)
		{
			node = nodes[i];
			break;
		}
	}
	if (node)
	{
		outerDiv.style.zIndex = node.style.zIndex + 1;
		document.body.insertBefore(outerDiv, node);
	}
}