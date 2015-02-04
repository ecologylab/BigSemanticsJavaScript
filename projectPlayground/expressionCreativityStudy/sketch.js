var globalSketch;

var __slice = Array.prototype.slice;
(function($) {
	var Sketch;
	$.fn.sketch = function() {
		var args, key, sketch;
		key = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
		if (this.length > 1) {
			$.error('Sketch.js can only be called on one element at a time.');
		}
		sketch = this.data('sketch');
		if ( typeof key === 'string' && sketch) {
			if (sketch[key]) {
				if ( typeof sketch[key] === 'function') {
					return sketch[key].apply(sketch, args);
				} else if (args.length === 0) {
					return sketch[key];
				} else if (args.length === 1) {
					return sketch[key] = args[0];
				}
			} else {
				return $.error('Sketch.js did not recognize the given command.');
			}
		} else if (sketch) {
			return sketch;
		} else {
			globalSketch = new Sketch(this.get(0), key);
			this.data('sketch', globalSketch);
			return this;
		}
	};
	Sketch = (function() {
		function Sketch(el, opts) {
			this.el = el;
			this.canvas = $(el);
			this.context = el.getContext('2d');
			this.options = $.extend({
				toolLinks : true,
				defaultTool : 'marker',
				defaultColor : '#000000',
				defaultSize : 5
			}, opts);
			this.painting = false;
			this.color = this.options.defaultColor;
			this.size = this.options.defaultSize;
			this.tool = this.options.defaultTool;
			this.actions = [];
			this.action = [];
			this.canvas.bind('click mousedown mouseup mousemove mouseleave mouseout touchstart touchmove touchend touchcancel', this.onEvent);
			if (this.options.toolLinks) {
				$('body').delegate("a[href=\"#" + (this.canvas.attr('id')) + "\"]", 'click', function(e) {
					var $canvas, $this, key, sketch, _i, _len, _ref;
					$this = $(this);
					$canvas = $($this.attr('href'));
					sketch = $canvas.data('sketch');
					_ref = ['color', 'size', 'tool'];
					for ( _i = 0, _len = _ref.length; _i < _len; _i++) {
						key = _ref[_i];
						if ($this.attr("data-" + key)) {
							sketch.set(key, $(this).attr("data-" + key));
						}
					}
					if ($(this).attr('data-download')) {
						//console.log("downloading");
						sketch.share();
					} else if ($(this).attr('data-clear')) {
						//console.log("clear button");
						sketch.clear();
					}
					return false;
				});
			}
		}
		Sketch.prototype.clear = function() {
			console.log("clearing");
			var ctx = this.el.getContext('2d');
			ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);			
			this.canvas.sketch('actions', []);
			this.redraw();
		};
		Sketch.prototype.download = function(format) {
			var mime;
			format || ( format = "png");
			if (format === "jpg") {
				format = "jpeg";
			}
			mime = "image/" + format;
			return window.open(this.el.toDataURL(mime));
		};
		Sketch.prototype.share = function(){
			document.getElementById("popup").style.display = "block";
		    try {
		        var img = this.el.toDataURL('image/jpg', 0.9);//.split(',')[1];
		        //console.log(img);
		        img = img.split(',')[1];
		    } catch(e) {
		        var img = this.el.toDataURL().split(',')[1];
		    }
		    // open the popup in the click handler so it will not be blocked
		   
		    // upload to imgur using jquery/CORS
		    // https://developer.mozilla.org/En/HTTP_access_control
		    $.ajax({
		        url: 'http://api.imgur.com/2/upload.json',
		        type: 'POST',
		        data: {
		            type: 'base64',
		            key: 'f6f7732afaa6a62b026a258aa77479d3',
		            name: 'alien.jpg',
		            title: 'Alien',
		            image: img
		        },
		        dataType: 'json'
		    }).success(function(data) {
		        console.log(data['upload']['links']['imgur_page']);
		        document.getElementById("instructionText").innerText = "Please copy the URL below into the task form.";
		        document.getElementById("imgurLink").href = data['upload']['links']['imgur_page'];
		        document.getElementById("imgurLink").innerText = data['upload']['links']['imgur_page'];
		    }).error(function() {
		        alert('We cannot upload your image, sorry. =(');
		        w.close();
		    });
		};
		Sketch.prototype.set = function(key, value) {
			this[key] = value;
			console.log(key+" : "+value);
			if(key == "color")
			{
				this.set("tool", "marker");
				this.set("size", "5");
			}
			else if(value == "eraser")
			{
				this.set("size", "15");
			}
				
			return this.canvas.trigger("sketch.change" + key, value);
		};
		Sketch.prototype.addLabel = function(label, x, y) {
			this.actions.push({
				tool : "text",
				events : [{text: label, x: x, y: y}]
			});
			this.redraw();
		};
		Sketch.prototype.startPainting = function() {
			this.painting = true;
			return this.action = {
				tool : this.tool,
				color : this.color,
				size : parseFloat(this.size),
				events : []
			};
		};
		Sketch.prototype.stopPainting = function() {
			if (this.action) {
				this.actions.push(this.action);
			}
			this.painting = false;
			this.action = null;
			return this.redraw();
		};
		Sketch.prototype.onEvent = function(e) {
			if(drags == 0)
			{
				if (e.originalEvent && e.originalEvent.targetTouches) {
					e.pageX = e.originalEvent.targetTouches[0].pageX;
					e.pageY = e.originalEvent.targetTouches[0].pageY;
				}
				$.sketch.tools[$(this).data('sketch').tool].onEvent.call($(this).data('sketch'), e);
				e.preventDefault();
				return false;
			}
		};
		Sketch.prototype.redraw = function() {
			var sketch;
			this.el.width = this.canvas.width();
			this.context = this.el.getContext('2d');
			
			this.context.fillStyle = "#FFF";
			this.context.fillRect(0, 0, this.el.width, this.el.height);
						
			sketch = this;
			$.each(this.actions, function() {
				if (this.tool) {
					//console.log(this.tool);
					//console.log($.sketch.tools);
					return $.sketch.tools[this.tool].draw.call(sketch, this);
				}
			});
			if (this.painting && this.action) {
				return $.sketch.tools[this.action.tool].draw.call(sketch, this.action);
			}
		};
		return Sketch;
	})();
	$.sketch = {
		tools : {}
	};
	$.sketch.tools.marker = {
		onEvent : function(e) {
			switch (e.type) {
				case 'mousedown':
				case 'touchstart':
					this.startPainting();
					break;
				case 'mouseup':
				case 'mouseout':
				case 'mouseleave':
				case 'touchend':
				case 'touchcancel':
					this.stopPainting();
			}
			if (this.painting && drags == 0) {
				this.action.events.push({
					x : e.pageX - this.canvas.offset().left,
					y : e.pageY - this.canvas.offset().top,
					event : e.type
				});
				return this.redraw();
			}
		},
		draw : function(action) {
			var event, previous, _i, _len, _ref;
			this.context.lineJoin = "round";
			this.context.lineCap = "round";
			this.context.beginPath();
			this.context.moveTo(action.events[0].x, action.events[0].y);
			_ref = action.events;
			for ( _i = 0, _len = _ref.length; _i < _len; _i++) {
				event = _ref[_i];
				this.context.lineTo(event.x, event.y);
				previous = event;
			}
			this.context.strokeStyle = action.color;
			this.context.lineWidth = action.size;
			return this.context.stroke();
		}
	};
	$.sketch.tools.text = {
		draw : function(action) {		
			//console.log("text drawing");
			this.context.lineWidth=1;
			this.context.fillStyle="#000";
			this.context.lineStyle="#000";
			this.context.font="12px sans-serif";
			return this.context.fillText(action.events[0].text, action.events[0].x, action.events[0].y);
		}
	};
	return $.sketch.tools.eraser = {
		onEvent : function(e) {
			return $.sketch.tools.marker.onEvent.call(this, e);
		},
		draw : function(action) {
			var oldcomposite;
			oldcomposite = this.context.globalCompositeOperation;
			this.context.globalCompositeOperation = "copy";
			action.color = "rgb(255,255,255)";
			$.sketch.tools.marker.draw.call(this, action);
			return this.context.globalCompositeOperation = oldcomposite;
		}
	};
	
})(jQuery);

function getUrlVars()
{
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

var drags = 0;
function startDragLabel(event)
{	
	if(event.target.id == "labelMaker")
	{
		window.addEventListener("mousemove", dragLabel);	
		window.addEventListener("mouseup", endDragLabel);
	}
}

function dragLabel(event)
{
	if(drags > 14)
	{
		var label = document.createElement('div');
			label.id= "floatingLabel";
			label.innerText = document.getElementById("labelText").value;
			
			label.style.top = event.pageY - 24 + "px";
			label.style.left = event.pageX - 8 + "px";
		
		document.body.appendChild(label);
		drags = -1;
	}
	else if(drags == -1)
	{
		var label = document.getElementById("floatingLabel");
			
			label.style.top = event.pageY - 24 + "px";
			label.style.left = event.pageX - 8 + "px";
			//console.log(label.style.top);
	}
	else
	{
		drags++;
	}
	return false;
}


function endDragLabel(event)
{
	drags = 0;
	window.removeEventListener("mousemove", dragLabel);	
	window.removeEventListener("mouseup", endDragLabel);
	
	var label = document.getElementById("floatingLabel");
	var x = parseInt(label.style.left);
	var y = parseInt(label.style.top);
	globalSketch.addLabel(label.innerText, x-6, y-68)
		
	label.parentElement.removeChild(label);
}