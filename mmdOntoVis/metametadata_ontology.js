// MetaMetadata Ontology Visualizer.
// Author: Yin Qu (yin@ecologylab.net)
//
// The alignment-baseline property is SVG standard, but Firefox does not support
// it yet. Thus this will work worse in Firefox.

// Global object.
var OntoVis = {};
OntoVis.dataFile = "mmd_repo.json"
OntoVis.width = 3000;
OntoVis.height = 3200;
OntoVis.marginX = 80;
OntoVis.marginY = 20;
OntoVis.nodePaddingX = 15;
OntoVis.nodePaddingY = 3;
OntoVis.duration = 500;
OntoVis.maxLevelDistance = 350;

// For generating the link to the MICE demo using example URL.
OntoVis.getMiceUrl = function(url) {
  var eurl = encodeURIComponent(url);
  return "http://ecologylab.net/mice?url=" + eurl;
}

// D3's projection() specifies a transform of coordinates for generated links.
OntoVis._diagonal = d3.svg.diagonal().projection(
  function(d) {
    return [d.y, d.x];
  });
OntoVis._colors = d3.scale.category20();

// Returns an SVG element with the right namespace specified.
OntoVis.SVG = function(elementName) {
  var e = document.createElementNS("http://www.w3.org/2000/svg", elementName);
  if (e.tagName == 'svg') {
    $(e).attr("xmlns:xlink", "http://www.w3.org/1999/xlink");
  }
  return e;
}

// Returns the subtypes of a given node.
OntoVis.subtypes = function(node) {
  var subtypes = node.subtypes;
  if (!subtypes) {
    subtypes = node._subtypes;
  }
  if (!subtypes) {
    subtypes = node.subtype;
  }
  if (subtypes) {
    if (subtypes instanceof Array) {
      return subtypes;
    }
    if (typeof subtypes == "object") {
      subtypes = subtypes.subtype;
      if (subtypes && subtypes instanceof Array) {
        return subtypes;
      }
    }
  }
  return;
}

// Returns the number of subtypes for a node.
OntoVis.subtypes_size = function(node) {
  var subtypes = OntoVis.subtypes(node);
  if (subtypes) {
    return subtypes.length;
  }
  return 0;
}

// Traverse a node tree in pre order. For each node, carry out an operation
// denoted by op. Then, test the node with a condition denoted by cond. If the
// test returns true, terminate the process and return the node; otherwise the
// process continues.
//
// If op or cond is null, is it simply ignored and the process continues.
//
// Returns: the first node (in pre order) that satisfies the cond if exists,
// otherwise false.
OntoVis.pre_order_traverse = function(node, op, cond) {
  if (node) {
    if (op) {
      op(node);
    }
    if (cond) {
      if (cond(node)) {
        return node;
      }
    }
    var subtypes = OntoVis.subtypes(node);
    if (subtypes) {
      for (var i = 0; i < subtypes.length; ++i) {
        var result = OntoVis.pre_order_traverse(subtypes[i], op, cond);
        if (result) {
          return result;
        }
      }
    }
  }
  return false;
}

// Returns the node or the subnode with the given name.
OntoVis.findNode = function(node, name) {
  return OntoVis.pre_order_traverse(
      node,
      null,
      function(n) {
        return n.name == name
      });
}

// Create and initialize the layout.
OntoVis.createLayout = function(rootNodeName) {
  // Initialize color palette.
  for (var c = 0; c < 20; ++c) {
    console.log("color " + c + ": " + OntoVis._colors(c));
  }

  // Initialize the SVG canvas.
  var svg = OntoVis.SVG("svg");
  $("div#viz").append(svg);
  $(svg).attr("width", OntoVis.width);
  $(svg).attr("height", OntoVis.height);

  var gLinks = OntoVis.SVG("g");
  $(gLinks).attr("id", "links");
  $(gLinks).attr("transform",
                  "translate(" + OntoVis.marginX + " " + OntoVis.marginY + ")");
  $(svg).append(gLinks);
  var gTexts = OntoVis.SVG("g");
  $(gTexts).attr("id", "elements");
  $(svg).append(gTexts);

  // Initialize the tree layout.
  var visibleWidth = OntoVis.width - OntoVis.marginX * 2;
  var visibleHeight = OntoVis.height - OntoVis.marginY * 2;
  var layout = d3.layout.tree()
    .size([visibleWidth, visibleHeight])
    .children(function(d) {
      if (d.is_expanded) {
        return OntoVis.subtypes(d);
      }
      return;
    });
  OntoVis.layout = layout;

  // Load JSON data and initialize.
  d3.json(OntoVis.dataFile, function(error, json) {
      var root = json.node;
      OntoVis.data_root = root;
      OntoVis.show(rootNodeName);
  });
}

OntoVis.show = function(rootNodeName) {
  var root = OntoVis.findNode(OntoVis.data_root, rootNodeName);
  if (!root) {
    root = OntoVis.findNode(OntoVis.data_root, "document");
  }
  if (root) {
    OntoVis.vis_root = root;

    // Collapse all nodes except the root
    OntoVis.pre_order_traverse(
        OntoVis.data_root,
        function(n) {
          n.is_root = false;
          n.is_expanded = false;
        });
    root.is_root = true;
    root.is_expanded = true;

    // See the later explanation of x0 and y0.
    root.x0 = 0;
    root.y0 = OntoVis.height / 2;

    OntoVis.update(root, function() {
      var rootNode = $(".root_node")[0];
      OntoVis.scrollTo(rootNode);
    });
  } else {
    alert("Cannot find root node: " + rootNodeName);
  }
}

// Update the presentation when clicking events happen.
OntoVis.update = function(source, end_listener) {
  // Use D3 to generate the layout.
  // This will set the x-y coordinates for nodes.
  var nodes = OntoVis.layout.nodes(OntoVis.vis_root);
  var links = OntoVis.layout.links(nodes);

  // Adjust margin and the max distance between two levels of nodes, for
  // readability.
  var minX = 1 << 30;
  nodes.forEach(function(d) {
    if (d.x < minX) {
      minX = d.x;
    }
    if (d.y > d.depth * OntoVis.maxLevelDistance) {
      d.y = d.depth * OntoVis.maxLevelDistance;
    }
  });
  nodes.forEach( function(d) {
    d.x = d.x - minX;
  });

  // Select nodes and bind data.
  var elements = d3.select("div#viz > svg > g#elements").selectAll("g.g1");
  // The 2nd argument determines an ID, so that D3 can maintain correspondence
  // between data and generated visuals.
  var node = elements.data(nodes, function(d) { return d.name; });

  // For entering nodes, initially create them at the clicked node (which is
  // their parent node).
  //
  // Since the source may be relocated at the beginning of update(), we need to
  // use the saved previous location of the source node, which is specified in
  // source.x0 and source.y0.
  //
  // Translates are specified on the <g> element so that the bounding box can be
  // translated along with the text.
  var enteringNodes =
    node.enter()
      .insert("g", ":first-child")
      .attr("class", "g1")
      .attr("transform",
            function(d) {
              var x = source.y0 + OntoVis.marginX;
              var y = source.x0 + OntoVis.marginY;
              return "translate(" + x + " " + y + ")";
            });
  var g2s = enteringNodes.insert("g").attr("class", "g2");

  g2s.insert("text")
    .attr("id", function(d) { return "text_" + d.name; })
    .attr("class", "text")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .text(function(d) {
      if (!d.is_expanded && OntoVis.subtypes_size(d) > 0) {
        return d.name + " [+]";
      } else {
        return d.name;
      }
    })
    .on("click", OntoVis.click);

  var bbox1 = function(shape) {
    return $(shape.parentNode.parentNode).select("text.text")[0].getBBox();
  }
  var anchors =
    g2s
      .insert("a")
      .attr("style", function(d) {
        if (d.example_url) {
          return "";
        } else {
          return "display: none";
        }
      })
      .attr("class", "node_anchor")
      .attr("xlink:href", function(d) {
        if (d.example_url) {
          return OntoVis.getMiceUrl(d.example_url);
        } else {
          return "#";
        }
      })
      .attr("xlink:show", function(d) {
        if (d.example_url) {
          return "new";
        } else {
          return "none";
        }
      })
      .insert("g")
      .attr("class", "node_anchor_g")
      .attr("stroke", "#444444")
      .attr("stroke-linecap", "round")
      .attr("fill", "white")
      .attr("transform", function(d) {
         var x = bbox1(this).width / 2 + 5;
         return "translate(" + x + ", -8)";
      });
  anchors
    .insert("path")
    .attr("stroke-width", "0")
    .attr("d", "M0 0 L0 12 L12 12 L12 0 Z");
  anchors
    .insert("path")
    .attr("stroke-width", "1.5")
    .attr("d", "M2 0 L0 0 L0 12 L12 12 L12 10");
  anchors
    .insert("path")
    .attr("stroke-width", "3")
    .attr("d", "M6 0 L12 0 L12 6 M12 0 L5 7");

  // Add boxes.
  var bbox2 = function(shape) {
    return $(shape.parentNode).select("g.g2")[0].getBBox();
  }
  var px = OntoVis.nodePaddingX;
  var py = OntoVis.nodePaddingY;
  enteringNodes
    .insert("rect", ":first-child")
    .attr("id", function(d) { return "box_" + d.name; })
    .attr("class", function(d) {
      if (d.is_root) {
        return "root_node";
      } else {
        return "node";
      }
    })
    .attr("fill", function(d) { return OntoVis._colors(d.depth % 10 * 2 + 1); })
    .attr("rx", "5")
    .attr("ry", "5")
    .attr("x", function(d) { return bbox2(this).x - px; })
    .attr("y", function(d) { return bbox2(this).y - py; })
    .attr("width", function(d) { return bbox2(this).width + px * 2; })
    .attr("height", function(d) { return bbox2(this).height + py * 2; });

  // enteringNodes.select("text").on("click", OntoVis.click);

  var handle_end_listener = function(transition) {
    var n = 0;
    transition
      .each(function() { ++n; console.log("A: " + n); })
      .each("end", function() { --n; console.log("B: " + n); if (n == 0) { end_listener() } });
  }

  // Transit existing and entering nodes to their new locations (specified in
  // d.x and d.y).
  node
    .transition()
    .duration(OntoVis.duration)
    .attr("transform", function(d) {
      var x = d.y + OntoVis.marginX;
      var y = d.x + OntoVis.marginY;
      return "translate(" + x + " " + y + ")";
    })
    .call(handle_end_listener);

  // Update the plus sign according to its expansion/collapse status.
  node.selectAll("text")
    .text(function(d) {
      if (!d.is_expanded && OntoVis.subtypes_size(d) > 0) {
        return d.name + " [+]";
      } else {
        return d.name;
      }
    });

  // Update box CSS class.
  node.selectAll("rect")
    .attr("class", function(d) {
      if (d.is_root) {
        return "root_node";
      } else {
        return "node";
      }
    });

  // For exiting nodes, transit them to the clicked node (which is their
  // parent) before removing them.
  node.exit()
    .transition()
    .duration(OntoVis.duration)
    .attr("transform",
          function(d) {
            var x = source.y + OntoVis.marginX;
            var y = source.x + OntoVis.marginY;
            return "translate(" + x + " " + y + ")";
          })
    .remove();

  // Bind links data.
  var connectors = d3.select("div#viz > svg > g#links").selectAll("path");
  // Again, the 2nd argument determines an ID for maintaining correspondence.
  var link = connectors.data(links, function(d) { return d.target.name; });

  // For entering links, initially show them as essentially 1 point near the
  // saved location of the clicked node.
  link.enter()
    .insert("path")
      .attr("class", "link")
      .attr("d",
            function(d) {
              var o = { x: source.x0, y: source.y0 };
              return OntoVis._diagonal({ source: o, target: o });
            });

  // Transit existing and entering links to their full shapes and new locations.
  link
    .transition()
    .duration(OntoVis.duration)
    .attr("d", OntoVis._diagonal);

  // For exiting links, transit them into 1 point near the clicked node before
  // removing.
  link.exit()
    .transition()
    .duration(OntoVis.duration)
    .attr("d",
          function(d) {
            var o = { x: source.x, y: source.y };
            return OntoVis._diagonal({ source: o, target: o });
          })
    .remove();

  // Save the location of each node before next update().
  nodes.forEach(function(d) { d.x0 = d.x; d.y0 = d.y; });
}

// Handles clicks. Expands or collapse sub nodes by manipulating the data.
OntoVis.click = function(d) {
  d.is_expanded = ! d.is_expanded;
  var element = $(this);
  OntoVis.update(d, function() {
    OntoVis.scrollTo(element);
  });
}

OntoVis.scrollTo = function(element) {
  console.log("scroll: ");
  console.log(element);
  if (element && $(element)) {
    var sx = $(element).offset().left - window.innerWidth / 2;
    var sy = $(element).offset().top - window.innerHeight / 2;
    console.log("scrollTop: " + sy);
    $('html,body').animate({ scrollLeft: sx, scrollTop: sy }, 200);
  }
}

