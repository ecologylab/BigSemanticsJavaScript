function regex_split(regex, input, limit) {
    var rst = [];
    if (input != undefined && input != null && input.length > 0) {
        var p = new RegExp(regex, 'g');
        var i = 0; // the start of the next element
        while (true) {
            var matched = p.exec(input);
            var seg = null;
            if (matched == null) {
                seg = input.substring(i);
            } else {
                var j = p.lastIndex - matched[0].length;
                seg = input.substring(i, j);
                i = p.lastIndex;
            }
            rst.push(seg);
            if (limit != undefined && limit != null && rst.length == limit - 1) {
                seg = input.substring(i);
                rst.push(seg);
                break;
            }
            if (matched == null)
                break;
        }
    }
    return rst;
};

function skipChars(s, start, chars) {
    while (start < s.length && chars.indexOf(s[start]) >= 0)
        start++;
    return start;
}

function skipCharsUntil(s, start, chars) {
    while (start < s.length && chars.indexOf(s[start]) < 0)
        start++;
    return start;
}


var FieldParserForRegexFind = function() {
};
FieldParserForRegexFind.prototype.getKeyValuePairResult = function(parserElement, input) {
	var rst = { };
	if (input != undefined && input != null && input.length > 0) {
		var p = new RegExp(parserElement.regex, 'g');
		var groups = p.exec(input);
		if (groups != null && groups.length > 0)
			for (var i = 0; i < groups.length; ++i) {
				rst['$' + i] = groups[i];
			}
	}
	return rst;
};

var FieldParserForRegexSplit = function() {
};
FieldParserForRegexSplit.prototype.getCollectionResult = function(parserElement, input) { 
	var rst = [];
	if (input != undefined && input != null && input.length > 0) {
		var split_results = regex_split(parserElement.regex, input);
		for (var i = 0; i < split_results.length; ++i) {
			var a_rst = {
				'$0' : split_results[i]
			};
			rst.push(a_rst);
		}
	}
	return rst;
};

var FieldParserForRegexSplitAndFind = function() {
	FieldParserForRegexSplit.call(this);
	this.regexFindObj = new FieldParserForRegexFind();
};
FieldParserForRegexSplitAndFind.prototype = Object.create(FieldParserForRegexSplit.prototype);
FieldParserForRegexSplitAndFind.prototype.getKeyValuePairResult = function(parserElement, input) { //getCollectionResult
    	var splitResults = null;
		if (parserElement.regex != null)
		{
			splitResults = this.getCollectionResult(parserElement, input);
		}
		else
		{
			splitResults = [];
			var onlyResult = {};
			onlyResult['$0'] = input;
			splitResults.push(onlyResult);
		}
		
		if (splitResults != null)
		{
			for (var i = 0; i < splitResults.length; ++i)
			{
				var splitResult = splitResults[i];
				if (splitResult != null && Object.keys(splitResult).length > 0)
				{
					var split = splitResult[Object.keys(splitResult)[0]];
					splitResult = this.regexFindObj.getKeyValuePairResult(parserElement, split);
				}
			}
		}
		
		return splitResults;
};

var FieldParserForAcmReferences = function() {
};
FieldParserForAcmReferences.prototype.getKeyValuePairResult = function(parserElement, input) { 
	var result = { };
	if (input == undefined || input == null || input.length == 0)
		return result;

	var flavor = 0;
	if (input.indexOf(" , ") >= 0 || input.indexOf("doi>") >= 0 || input.indexOf(".") < 0)
		flavor = 1;
	// ACM standard reference format
	else if (new RegExp('^[A-Z][a-z]+, [A-Z]\\..*').test(input))
		flavor = 2;
	// Brief format

	switch (flavor) {
		case 1:
			var pos = 1;
			while (pos < input.length - 1) {
				if (input[pos - 1] != ' ' && input[pos] == ',' && input[pos + 1] == ' ')
					break;
				pos++;
			}
			var authorListAndOther = [input.substring(0, pos), input.substring(pos + 2)];
			if (authorListAndOther.length == 2 && authorListAndOther[1] != null && authorListAndOther[1].length > 0) {
				var authorList = authorListAndOther[0];
				if (authorList != null)
					result['$author_list'] = authorList.trim();
				var other = authorListAndOther[1];
				if (other != null) {
					var titleAndOther = regex_split(',\\s(?=[A-Z])', other, 2);
					if (titleAndOther.length == 2) {
						var title = titleAndOther[0];
						var other0 = titleAndOther[1];
						if (title != null)
							result['$title'] = title.trim();
						if (other0 != null)
							result['$other'] = other0.trim();
					}
				}
			}
			break;
		case 2:
			var authors = '';
			var p = new RegExp('([A-Z][a-z]+(-[A-Z][a-z]+)?, [A-Z]\\.(\\s?[A-Z]\\.)?)', 'g');
			while (true) {
				var matched = p.exec(input);
				if (matched == null)
					break;
				if (authors.length > 0)
					authors += ' , ';
				authors += matched[0];
			}
			result['$author_list'] = authors;

			var beginTitle = p.lastIndex;
			var nextPos = beginTitle + 5;
			// minimum title length
			if (nextPos > input.length)
				nextPos = input.length;
			nextPos = skipCharsUntil(input, nextPos, ',.');
			var endTitle = nextPos;

			nextPos = skipChars(input, nextPos, ', .');
			var c = input[nextPos];
			if (c >= 'a' && c <= 'z' && input.substring(nextPos, nextPos + 3) != 'in ') {
				endTitle = skipCharsUntil(input, nextPos, ',.');
				nextPos = skipChars(input, endTitle, ', .');
			}
			var title2 = input.substring(beginTitle, endTitle);
			result['$title'] = title2.trim();
			var other2 = input.substring(nextPos);
			result['$other'] = other2.trim();
			break;
		default:
			result['$title'] = input;
	}

	return result;
};

var FieldParserForNsfPubList = function() { FieldParserForAcmReferences.call(this); };
FieldParserForNsfPubList.prototype = Object.create(FieldParserForAcmReferences.prototype);
FieldParserForNsfPubList.prototype.getKeyValuePairResult = function(parserElement, input) { //getCollectionResult
		//input = input.replaceAll("\\s+", " ");
		input = input.replace(new RegExp("\\s+")," ");
		input = trimUntil(input, "</table>", true);
		input = trimAfter(input, "</p>", true);
		
		input = removeHtmlTag(input, "script", false);
		input = removeHtmlTag(input, "noscript", false);
		input = removeHtmlTag(input, "i", true);
		
		//String[] splits = input.split("(\\s*<br\\s*/?>\\s*)+");
		var splits = input.split("(\\s*<br\\s*/?>\\s*)+");
		//List<Map<String, String>> results = new ArrayList<Map<String,String>>();
		var results = [];
		for (split in splits)
		{
			if (split == null)
				continue;
			split = split.trim();
			if (split.length() == 0)
				continue;
			if (split.substring(0) == "<") //split.startsWith("<")) // must be some tag
				continue;
			
			split = unescape(split);
			//split = split.replaceFirst("^\\d+\\.\\s*", "");
			split = split.replace("^\\d+\\.\\s*", "");
			//Map<String, String> parsedRef = this.getKeyValuePairResult(null, split);
			var parsedRef = this.getKeyValuePairResult(null, split);
			if (parsedRef != null && parsedRef.size() > 0)
			{
				console.log(parsedRef);
				results.push(parsedRef);
			}
		}
		
		return results;
};

var FieldParserForBibTeX = function() {
};
FieldParserForBibTeX.prototype.getKeyValuePairResult = function(parserElement, input) {
	var rst = { };
	if (input == undefined || input == null || input.length == 0)
		return rst;
	input = input.replace(/\s+/g, ' ').trim();

	var par1 = new RegExp('@(\\w+)\\s*{(.*)}').exec(input);
	if (par1 != null && par1.length == 3) {
		var entryType = par1[1];
		rst['@type'] = entryType;

		var content = par1[2];
		var tags = regex_split('\\s*,\\s*', content);
		if (tags.length > 0) {
			var entryId = tags[0].trim();
			rst['@key'] = entryId;
			for (var i = 1; i < tags.length; ++i) {
				var tag = tags[i];
				var parts = regex_split('\\s*=\\s*', tag);
				if (parts.length == 2) {
					var tagName = parts[0].trim();
					var tagValue0 = parts[1].trim();
					if (tagValue0[0] == '"') {
						// string or string concatenation
						var tagValue = '';
						var pString = new RegExp('"([^"\\\\]*(\\\\.[^"\\\\]*)*)"');
						while (true) {
							var matched = pString.exec(tagValue0);
							if (matched == null || matched.length < 2)
								break;
							tagValue += matched[1];
						}
						rst[tagName] = tagValue;
					} else if (tagValue0[0] == '{') {
						// curly braces
						var len = tagValue0.length;
						var tagValue = tagValue0.substring(1, len - 1).trim();
						rst[tagName] = tagValue;
					} else {
						// otherwise, treat it as a whole string
						rst[tagName] = tagValue0;
					}
				}
			}
		}
	}

	return rst;
}; 


var registeredFieldParsers = {
    'regex_find': new FieldParserForRegexFind(),
    'regex_split': new FieldParserForRegexSplit(),
    'regex_split_and_find': new FieldParserForRegexSplitAndFind(),
    'acm_reference': new FieldParserForAcmReferences(),
    'bibtex': new FieldParserForBibTeX(),
    'nsf_pub_list': new FieldParserForNsfPubList()
};

// the factory for creating different kinds of field parsers.
// using a function here is mainly for maintaining the consistency with the java implementation.
function getFieldParserFactory() {
    return registeredFieldParsers;
}

function trimUntil(input,s,include)
{
	var p = input.indexOf(s);
	if (p >= 0) 
	{
		if (include) {
			return input.substring(p + s.length());
		} else {
			return input.substring(p);
		}
	}
	return input;
}

function trimAfter(input,s,include)
{
	var p = input.indexOf(s);
	if (p >= 0) 
	{
		if (include) {
			return input.substring(0,p);
		} else {
			return input.substring(0,p+s.length());
		}
	}
	return input;
}

function removeHtmlTag(input,tagName,keepInnerText)
{
	//var p1 = 
	var p1 = "<" + tagName + "(\\s+[A-Za-z0-9:_-]+=\"[^\"\\\r\n]*(?:\\.[^\"\\\r\n]*)*\")*\\s*/>";
	var p2 = "<" + tagName + "(\\s+[A-Za-z0-9:_-]+=\"[^\"\\\r\n]*(?:\\.[^\"\\\r\n]*)*\")*\\s*>(.*?)<" + tagName + ">";
}
