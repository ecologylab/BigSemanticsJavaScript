function SimplTestSuite(name, typeScopes, testObjects)
{
	this.name = name;
	this.typeScopes = typeScopes;
	this.testObjects = testObjects;
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
		]));

