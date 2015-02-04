function SimplTestSuite(name, typeScopes, testSimplObjects, testUserObjects)
{
	this.name = name;
	this.typeScopes = typeScopes;
	this.testSimplObjects = testSimplObjects;
	this.testUserObjects = testUserObjects;
}

var simplTestSuites = [];

simplTestSuites.push(new SimplTestSuite("Circle",
		[
			circle_scope,
			collectionOfCircles_scope,
			collectionWrapScalar_scope
		],
		[
			point_data,
			circle_data,
			collectionOfCircles_data,
			collectionWrapScalar_data
		],
		[			
			circle_app_data,
			collectionOfCircles_app_data,
			nic
		]));

simplTestSuites.push(new SimplTestSuite("Graph",
		[
			classAclassB_scope,
			diamond_scope,
			graph_collection_scope
		],
		[
			classA_classB_data,
			diamond_data,
			graph_collection_data
		],
		[			
			classA_classB_app_data
			
		]));
		
simplTestSuites.push(new SimplTestSuite("Maps",
		[
			maps_within_maps_scope
		],
		[
			maps_data
		],
		[			
			
		]));
		
simplTestSuites.push(new SimplTestSuite("Person",
		[
			person_directory_scope,
			student_scope
		],
		[
			person_directory_data,
			student_data
		],
		[			
			
		]));