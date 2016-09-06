var TabbyCat = {

	buildMetadataDisplay: function(metadataFields, styleInfo)
	{
		console.log(metadataFields);
		var html = "<div class='"+styleInfo.metadataContainer+"'>";

		var fieldsShown = [];

		// always draw favicon, title(as link) on the top
		var title = this.getField("title", metadataFields);
		if(title != null)
		{
			var titleRow = "<div class='"+styleInfo.titleRow+"'>";

			// favicon
			titleRow += "<img src='"+BSUtils.getFaviconURL(title.navigatesTo)+"' class='"+styleInfo.favicon+"'/>";

			// title as link
			titleRow += "<a href='"+title.navigatesTo+"' target='_blank' class='"+styleInfo.title+"'>";
			titleRow += title.value;
			titleRow += "</a>";

			titleRow += "</div>";

			html += titleRow;

			fieldsShown.push("title");
		}

		// next draw the main image if there is one
		var mainImages = this.getField("main_images", metadataFields);
		if(mainImages != null && mainImages.value.length > 0)
		{
			var imageRow = "<div class='"+styleInfo.imageRow+"'>";

			// first image as big
			imageRow += "<img src='"+mainImages.value[0].value[0].value+"' class='"+styleInfo.mainImage+"'/>";

			for(var i = 1; i < mainImages.value.length; i++)
			{
				// small images
				imageRow += "<img src='"+mainImages.value[i].value[0].value+"' class='"+styleInfo.subImage+"'/>";
			}			

			imageRow += "</div>";

			html += imageRow;

			fieldsShown.push("main_images");
		}

		// then the remaining fields in order
		for(var i = 0; i < metadataFields.length; i++)
		{
			var field = metadataFields[i];

			if(fieldsShown.indexOf(field.name) != -1)
				continue;

			html += this.buildField(field, styleInfo);
		}

		html += "</div>";

		return html;
	},

	buildField: function(field, styleInfo)
	{
		// for scalars
		if(field.scalar_type != null)
		{
			return this.buildScalarField(field, styleInfo);
		}

		// for fields with children
		else if(field.child_type != null)
		{
			return this.buildParentField(field, styleInfo);
		}

		// for composites 
		else if(field.composite_type != null)
		{
			return this.buildCompositeField(field, styleInfo);
		}

		return "error";
	},

	buildScalarField: function(field, styleInfo)
	{
		var row = "<div class='"+styleInfo.row+"'>";

		if(field.value_as_label != null && field.value_as_label != "")
		{
			row += "<div class='"+styleInfo.fieldLabel+"'>"+field.value_as_label.value+"</div>";
		}
		else
		{
			row += "<div class='"+styleInfo.fieldLabel+"'>"+BSUtils.toFancyCase(field.name)+"</div>";
		}

		// value
		if(field.navigatesTo != null && false)
		{
			row += "<div class='"+styleInfo.fieldValue+"'>";
			
			// favicon
			row += "<img src='"+BSUtils.getFaviconURL(field.navigatesTo)+"' class='"+styleInfo.favicon+"'/>";

			// title as link
			row += "<a href='"+field.navigatesTo+"' target='_blank' class='"+styleInfo.fieldLink+"'>";
			row += field.value;
			row += "</a>";

			row += "</div>";
		}
		else
		{
			row += "<div class='"+styleInfo.fieldValue+"'>"+field.value+"</div>";
		}

		row += "</div>";

		return row;
	},

	buildParentField: function(field, styleInfo)
	{
		var count = field.value.length;
		var label = BSUtils.toFancyCase(field.name);

		var row = "<div class='"+styleInfo.row+"'>";

		if(count > 1)
			label += " <span class='"+styleInfo.fieldCount+"'>("+count+")</span>";

		row += "<div class='"+styleInfo.fieldLabel+"'>"+label+"</div>";

		for(var i = 0; i < field.value.length; i++)
		{
			// value
			row += this.buildField(field.value[i], styleInfo);
		}

		row += "</div>";

		return row;
	},

	buildCompositeField: function(field, styleInfo)
	{
		var label = BSUtils.toFancyCase(field.name);

		var row = "<div class='"+styleInfo.row+"'>";

		row += "<div class='"+styleInfo.fieldLabel+"'>"+label+"</div>";

		// if something>???, just render the title of the composite
		if(true)
		{
			var title = this.getField("title", field.value);
			if(title != null)
			{
				row += "<div class='"+styleInfo.fieldValue+"'>";
				
				// favicon
				row += "<img src='"+BSUtils.getFaviconURL(title.navigatesTo)+"' class='"+styleInfo.favicon+"'/>";

				// title as link
				row += "<a href='"+title.navigatesTo+"' target='_blank' class='"+styleInfo.fieldLink+"'>";
				row += title.value;
				row += "</a>";

				row += "</div>";
			}
		}
		else
		{
			for(var i = 0; i < field.value.value.length; i++)
			{
				// value
				row += this.buildField(field.value.value[i], styleInfo);
			}
		}

		row += "</div>";

		return row;
	},

	getField: function(fieldName, fields)
	{
		for(var i = 0; i < fields.length; i++)
		{
			if(fields[i].name == fieldName)
				return fields[i];
		}
		return null;
	},

	prettyLabel: function(label)
	{
		// remove underscores

		// captialize first and after spaces
	}
};

/*


		if(!table)
		{
			table = document.createElement('div');
			table.className = styleInfo.styles.metadataTableDiv;

			//if(!isRoot)
			//	table.className = "metadataTable";
		}

		// console.log(metadataFields);

		// Iterate through the metadataFields which are already sorted into display order
		for(var i = 0; i < metadataFields.length; i++)
		{
			var row = document.createElement('div');
			row.className = styleInfo.styles.metadataRow;
			if(metadataFields[i].composite_type != null && metadataFields[i].composite_type != undefined && metadataFields[i].value.length > 0){
				var field = metadataFields[i];
				var value = field.value[0];
				var link = value.navigatesTo;
				var childUrl = link;
				//Should we add to map?

			}
			// if the maximum number of fields have been rendered then stop rendering and add a "More" expander

			if(fieldCount <= 0)
			{
				var nameCol = document.createElement('div');
					nameCol.className = styleInfo.styles.labelColShowDiv;

				var valueCol = document.createElement('div');
					valueCol.className = styleInfo.styles.valueColShowDiv;

				//TODO - add "more" expander
				var moreCount = metadataFields.length - i;

				var fieldValueDiv = document.createElement('div');
					fieldValueDiv.className = styleInfo.styles.moreButton;
					fieldValueDiv.textContent = "More... ("+moreCount+")";
					fieldValueDiv.onclick = MICE.morePlease;
				var moreData = {
					"fields": FIELDS_TO_EXPAND,
					"isChild": isChildTable,
					"data": metadataFields.slice(i, metadataFields.length),
					"type": styleInfo.type
				};

				var detailsSpan = document.createElement('span');
					detailsSpan.className = styleInfo.styles.hidden;
					detailsSpan.textContent = JSON.stringify(moreData);

				fieldValueDiv.appendChild(detailsSpan);

				valueCol.appendChild(fieldValueDiv);

				row.appendChild(nameCol);
				row.appendChild(valueCol);

				table.appendChild(row);

				break;
			}

			var metadataField = metadataFields[i];

			if(metadataField.value)
			{
				// If the field is an empty array then move on to the next field
				if(	metadataField.value.length != null && metadataField.value.length == 0)
					continue;

				if (metadataField.concatenates_to != null)
					continue;

				var expandButton = null;
				var fieldObj = MICE.buildMetadataField(metadataField, isChildTable, fieldCount, row, styleInfo, metadataFields[0].navigatesTo);
				expandButton = fieldObj.expand_button;

				var fieldObjs = [];
				fieldObjs.push(fieldObj);

				var innerRow = null;
				if (metadataField.concatenates.length > 0)
				{
					innerRow = document.createElement('div');
					innerRow.className = styleInfo.styles.metadataRow;
				}
				else
					innerRow = row;

				for (var j = 0; j < metadataField.concatenates.length; j++)
				{
					fieldObj = MICE.buildMetadataField(metadataField.concatenates[j], isChildTable, fieldCount, row, styleInfo, metadataFields[0].navigatesTo);
					fieldObjs.push(fieldObj);
				}

				for (var j = 0; j < fieldObjs.length; j++)
				{
					var nameCol = fieldObjs[j].name_col;
					var valueCol = fieldObjs[j].value_col;

					fieldCount = fieldObjs[j].count;

					// append name and value in the needed order
					if (metadataField.label_at != null)
					{
						if (metadataField.label_at == "top" || metadataField.label_at == "bottom")
						{
							var innerTable = document.createElement('div');
							var row1 = document.createElement('div');
							var row2 = document.createElement('div');
							innerTable.style.display = 'table';
							row1.className = styleInfo.styles.metadataRow;
							row2.className = styleInfo.styles.metadataRow;
							if (metadataField.label_at == "top")
							{
								row1.appendChild(nameCol);
								row2.appendChild(valueCol);
							}
							else
							{
								row1.appendChild(valueCol);
								row2.appendChild(nameCol);
							}
							innerTable.appendChild(row1);
							innerTable.appendChild(row2);

							var td = document.createElement('div');
							td.style.display = 'table-cell';
							td.appendChild(innerTable);

							// to still make labels align well with fields having label_at left
							if (metadataField.concatenates.length == 0)
							{
								var tdDummy = document.createElement('div');
								tdDummy.style.display = 'table-cell';
								innerRow.appendChild(tdDummy);
							}
							innerRow.appendChild(td);
						}
						else if (metadataField.label_at == "right")
						{
							innerRow.appendChild(valueCol);
							innerRow.appendChild(nameCol);
						}
						else
						{
							innerRow.appendChild(nameCol);
							innerRow.appendChild(valueCol);
						}
					}
					else
					{
						innerRow.appendChild(nameCol);
						innerRow.appendChild(valueCol);
					}
				}

				if (metadataField.concatenates.length > 0)
				{
					// new table for inner row
					var outerTable = document.createElement('div');
					outerTable.style.display = 'table';
					outerTable.appendChild(innerRow);

					var tdOuter = document.createElement('div');
					tdOuter.style.display = 'table-cell';
					tdOuter.appendChild(outerTable);

					var tdDummy1 = document.createElement('div');
					tdDummy1.style.display = 'table-cell';

					row.appendChild(tdDummy1);
					row.appendChild(tdOuter);
				}
				table.appendChild(row);

				if (expandButton != null && (metadataField.show_expanded_initially == "true"
											|| metadataField.show_expanded_always == "true")) {
					var fakeEvent = {};
					fakeEvent.target = expandButton;
					// console.log("fake event ready");
					MICE.expandCollapseTable(fakeEvent);
				}
			}
		}
		return table;
	},

};
*/