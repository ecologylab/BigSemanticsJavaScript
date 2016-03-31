var MinkSemantics = {}

/*
	A reduced version of RendererBase used specifically for minkRenderer.

*/


MinkSemantics.addMetadataDisplay = function(container, url, clipping, renderer, options){
	if(options == null){
		options = {};
	}

    var task = new MinkRenderingTask(url, true, clipping, container, null, renderer, options.viewmodel);
    task.options = options;


	if(clipping != null && clipping.viewModel){
		task.fields = clipping.viewModel.value;
		task.style = {styles: miceStyles, type: clipping.mmdName};

		if(clipping.viewModel['minkfav']){
		task.favicon = clipping.viewModel['minkfav'];
		}
		task.options = options;

		task.handler(task);
		if(options.callback){
			options.callback(clipping);
		}
	}

  else {

	task.options = options;
	bsService.onReady(function(){

		bsService.loadMetadata(url, options, function(err, md_and_mmd){

			if (err) {
				console.error(err);
				return;
			}

			if(bsService.constructor.name == "BSAutoSwitch"){
				  console.log("loadMetadata result from " + bsService.bsImpl.constructor.name + ": ", md_and_mmd);

			}else{
				  console.log("loadMetadata result from " + bsService.constructor.name + ": ", md_and_mmd);

			}

			task.mmd = md_and_mmd.mmd;
			task.mmd = simpl.graphExpand(task.mmd);
			task.metadata = md_and_mmd.metadata;


			//ideamache hack
			if(typeof veryBadAddMetadataToClippingStorage == 'function')
			{
				veryBadAddMetadataToClippingStorage(task.metadata);
			}

			task.handler(task);
			if(options.callback){
				options.callback(md_and_mmd);
			}


		})
	});
	// MetadataLoader.getMetadata(url, "MetadataLoader.setMetadata", reloadMD);
	}

}
