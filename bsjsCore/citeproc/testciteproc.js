var gen = new BibTexGenerator('../bsjsCore/citeproc/modern-language-association-with-url.csl', '../bsjsCore/citeproc/locales-en-US.xml');

function testWithLinks(){
	
	gen.addDocument(new BibTexDocument('http://dl.acm.org/citation.cfm?id=2063231.2063237&preflayout=flat'));
	gen.addDocument(new BibTexDocument('http://dl.acm.org/citation.cfm?id=2441986&CFID=560426657&CFTOKEN=34586024'));
	gen.addDocument(new BibTexDocument('http://dl.acm.org/citation.cfm?id=2658681&CFID=560426657&CFTOKEN=34586024'));

}

function testWithMD(){
	var counter = 0;
	bsService.loadMetadata('http://dl.acm.org/citation.cfm?id=2063231.2063237&preflayout=flat', null, function(err, result){
		gen.addDocument(new BibTexDocument('http://dl.acm.org/citation.cfm?id=2063231.2063237&preflayout=flat', result.metadata));
		counter++;
	});
	
	bsService.loadMetadata('http://dl.acm.org/citation.cfm?id=2441986&CFID=560426657&CFTOKEN=34586024', null, function(err, result){
		gen.addDocument(new BibTexDocument('http://dl.acm.org/citation.cfm?id=2441986&CFID=560426657&CFTOKEN=34586024', result.metadata));
		counter++;

	});

	
	bsService.loadMetadata('http://dl.acm.org/citation.cfm?id=2441986&CFID=560426657&CFTOKEN=34586024', null, function(err, result){
		gen.addDocument(new BibTexDocument('http://dl.acm.org/citation.cfm?id=2441986&CFID=560426657&CFTOKEN=34586024', result.metadata));
		counter++;

	});
	function whenDone(callforward){
		if(counter == 3){
			gen.getBibHTML(useHTML);

			gen.getBibString(useString);
			gen.getBibJSON(useJSON);

		}else{
			setTimeout(whenDone, 500);
		}
		
	}
	whenDone();
}


function testAddLater(){
	var counter = 0;
	bsService.loadMetadata('http://dl.acm.org/citation.cfm?id=2063231.2063237&preflayout=flat', null, function(err, result){
		gen.addDocument(new BibTexDocument('http://dl.acm.org/citation.cfm?id=2063231.2063237&preflayout=flat', result.metadata));
		counter++;
	});
	
	bsService.loadMetadata('http://dl.acm.org/citation.cfm?id=2441986&CFID=560426657&CFTOKEN=34586024', null, function(err, result){
		gen.addDocument(new BibTexDocument('http://dl.acm.org/citation.cfm?id=2441986&CFID=560426657&CFTOKEN=34586024', result.metadata));
		counter++;

	});

	counter++;
	function whenDone(callforward){
		if(counter == 3){
			gen.getBibHTML(useHTML);
			var gen2 = new BibTexGenerator('../bsjsCore/citeproc/modern-language-association-with-url.csl', '../bsjsCore/citeproc/locales-en-US.xml', null, gen.documents);
			gen2.addDocument(new BibTexDocument('http://dl.acm.org/citation.cfm?id=2441957&CFID=560426657&CFTOKEN=34586024'));

			gen2.getBibString(useString);
			gen2.getBibJSON(useJSON);

		}else{
			setTimeout(whenDone, 500);
		}
		
	}
	whenDone();
}



function testMixedMDAndLinks(){
	var counter = 0;
	bsService.loadMetadata('http://dl.acm.org/citation.cfm?id=2063231.2063237&preflayout=flat', null, function(err, result){
		gen.addDocument(new BibTexDocument('http://dl.acm.org/citation.cfm?id=2063231.2063237&preflayout=flat', result.metadata));
		counter++;
	});
	
	bsService.loadMetadata('http://dl.acm.org/citation.cfm?id=2441986&CFID=560426657&CFTOKEN=34586024', null, function(err, result){
		gen.addDocument(new BibTexDocument('http://dl.acm.org/citation.cfm?id=2441986&CFID=560426657&CFTOKEN=34586024', result.metadata));
		counter++;

	});

	
	gen.addDocument(new BibTexDocument('http://dl.acm.org/citation.cfm?id=2658681&CFID=560426657&CFTOKEN=34586024'));
	counter++;
	function whenDone(callforward){
		if(counter == 3){
			gen.getBibHTML(useHTML);
			gen.getBibString(useString);
			gen.getBibJSON(useJSON);

		}else{
			setTimeout(whenDone, 500);
		}
		
	}
	whenDone();

}


function gimmeHTML(){
	gen.getBibHTML(useHTML);
}
function gimmeString(){
	gen.getBibString(useString);
}
function useHTML(html){
	console.log(html);
}
function useString(s){
	console.log(s);
}
function useJSON(s){
	console.log(s);
}
