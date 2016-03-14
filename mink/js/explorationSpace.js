
function ValidUrl(str) {
	  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
	  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
	  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
	  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
	  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
	  '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
	  if(!pattern.test(str)) {
	    return false;
	  } else {
	    return true;
	  }
	}

//exploration spaces should store some state info, ie.  which piles are in which ordered column and what the leftmost dispalyed column is
function ExplorationSpace(queryOrUrl, engines){
	
	
	this.queries = [];
	this.query = queryOrUrl;
	if(ValidUrl(queryOrUrl)){
		this.urlAsRoot = true;
	}
	this.engines = engines;
	this.trails = [];
	
}