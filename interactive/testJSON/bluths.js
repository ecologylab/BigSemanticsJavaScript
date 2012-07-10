var georgeSr = {
				"title": {
					"name": "Title",
					"scalar_type": "String",
					"style": "metadata_h1",
					"value": "George Bluth Sr."
				},
				"photo": {
					"name": "Photo",
					"child_type": "image",
					"value": {
						"image": [
							{
								"location": {
									"name": "location",
									"scalar_type": "ParsedURL",
									"value": "http://snakkle.wpengine.netdna-cdn.com/wp-content/uploads/2012/01/jeffrey-tambor-tca-arrested-development-bent-george-bluth-tv-photo-GC.jpg"
								}
							}
						]
					}
				},
				"siblings": {
					"name": "Sibilings",
					"child_type": "person",
					"value": {
						"person": [
							
						]
					}
				},
				"married": {
					"name": "Married To",
					"child_type": "person",
					"value": {
						"person": [
							
						]
					}
				},			
				"children": {
					"name": "Children",
					"child_type": "person",
					"value": {
						"person": [
							
						]
					}
				}
			};

var oscar = {
				"title": {
					"name": "Title",
					"scalar_type": "String",
					"style": "metadata_h1",
					"value": "Oscar Bluth"
				},
				"photo": {
					"name": "Photo",
					"child_type": "image",
					"value": {
						"image": [
							{
								"location": {
									"name": "location",
									"scalar_type": "ParsedURL",
									"value": "http://images.wikia.com/arresteddevelopment/images/7/77/Oscar.jpg"
								}
							}
						]
					}
				},
				"siblings": {
					"name": "Sibilings",
					"child_type": "person",
					"value": {
						"person": [
							georgeSr
						]
					}
				},
				"children": {
					"name": "Children",
					"child_type": "person",
					"value": {
						"person": [
							
						]
					}
				}
			};

var lucille = {
				"title": {
					"name": "Title",
					"scalar_type": "String",
					"style": "metadata_h1",
					"value": "Lucille Bluth"
				},
				"photo": {
					"name": "Photo",
					"child_type": "image",
					"value": {
						"image": [
							{
								"location": {
									"name": "location",
									"scalar_type": "ParsedURL",
									"value": "http://ilikethingsthataregreat.files.wordpress.com/2008/09/jessica-ad.jpg"
								}
							}
						]
					}
				},
				"married": {
					"name": "Married To",
					"child_type": "person",
					"value": {
						"person": [
							georgeSr
						]
					}
				},
				"children": {
					"name": "Children",
					"child_type": "person",
					"value": {
						"person": [
							
						]
					}
				}
			};
			
var michael = {
				"title": {
					"name": "Title",
					"scalar_type": "String",
					"style": "metadata_h1",
					"value": "Michael Bluth"
				},
				"photo": {
					"name": "Photo",
					"child_type": "image",
					"value": {
						"image": [
							{
								"location": {
									"name": "location",
									"scalar_type": "ParsedURL",
									"value": "http://www.worlddominationcorp.com/wp-content/uploads/2012/04/Michael-Bluth.jpg"
								}
							}
						]
					}
				},				
				"parents": {
					"name": "Parents",
					"child_type": "person",
					"value": {
						"person": [
							georgeSr,
							lucille
						]
					}
				},
				"siblings": {
					"name": "Sibilings",
					"child_type": "person",
					"value": {
						"person": [
							
						]
					}
				},
				"children": {
					"name": "Children",
					"child_type": "person",
					"value": {
						"person": [
							
						]
					}
				}
			};
			
var gob = {
				"title": {
					"name": "Title",
					"scalar_type": "String",
					"style": "metadata_h1",
					"value": "G.O.B. Bluth"
				},
				"photo": {
					"name": "Photo",
					"child_type": "image",
					"value": {
						"image": [
							{
								"location": {
									"name": "location",
									"scalar_type": "ParsedURL",
									"value": "http://upload.wikimedia.org/wikipedia/en/8/8d/GOBwithaJOB.JPG"
								}
							}
						]
					}
				},
				"parents": {
					"name": "Parents",
					"child_type": "person",
					"value": {
						"person": [
							georgeSr,
							lucille
						]
					}
				},
				"siblings": {
					"name": "Sibilings",
					"child_type": "person",
					"value": {
						"person": [
							
						]
					}
				},
				"married": {
					"name": "Married To",
					"child_type": "person",
					"value": {
						"person": [
							
						]
					}
				},
				"children": {
					"name": "Children",
					"child_type": "person",
					"value": {
						"person": [
							
						]
					}
				}
			};

var gobsWife = {
				"title": {
					"name": "Title",
					"scalar_type": "String",
					"style": "metadata_h1",
					"value": "Wife of G.O.B."
				},
				"photo": {
					"name": "Photo",
					"child_type": "image",
					"value": {
						"image": [
							{
								"location": {
									"name": "location",
									"scalar_type": "ParsedURL",
									"value": "http://images1.wikia.nocookie.net/__cb20120529180343/arresteddevelopment/images/thumb/d/dd/1x16_Altar_Egos_%2839%29.png/1000px-1x16_Altar_Egos_%2839%29.png"
								}
							}
						]
					}
				},
				"married": {
					"name": "Married To",
					"child_type": "person",
					"value": {
						"person": [
							gob
						]
					}
				}
		};

var lindsay = {
				"title": {
					"name": "Title",
					"scalar_type": "String",
					"style": "metadata_h1",
					"value": "Lindsay Bluth Fünke"
				},
				"photo": {
					"name": "Photo",
					"child_type": "image",
					"value": {
						"image": [
							{
								"location": {
									"name": "location",
									"scalar_type": "ParsedURL",
									"value": "http://24.media.tumblr.com/tumblr_m5veiav3bo1ql3ugao1_1280.png"
								}
							}
						]
					}
				},
				"parents": {
					"name": "Parents",
					"child_type": "person",
					"value": {
						"person": [
							georgeSr,
							lucille
						]
					}
				},
				"siblings": {
					"name": "Sibilings",
					"child_type": "person",
					"value": {
						"person": [
							
						]
					}
				},
				"married": {
					"name": "Married To",
					"child_type": "person",
					"value": {
						"person": [
							
						]
					}
				},
				"children": {
					"name": "Children",
					"child_type": "person",
					"value": {
						"person": [
							
						]
					}
				}
			};
			
var tobias = {
				"title": {
					"name": "Title",
					"scalar_type": "String",
					"style": "metadata_h1",
					"value": "Tobias Fünke"
				},
				"photo": {
					"name": "Photo",
					"child_type": "image",
					"value": {
						"image": [
							{
								"location": {
									"name": "location",
									"scalar_type": "ParsedURL",
									"value": "http://cdn2.hark.com/images/000/002/892/2892/original.jpg"
								}
							}
						]
					}
				},
				"married": {
					"name": "Married To",
					"child_type": "person",
					"value": {
						"person": [
							lindsay
						]
					}
				},
				"children": {
					"name": "Children",
					"child_type": "person",
					"value": {
						"person": [
							
						]
					}
				}
			};
			
var buster = {
				"title": {
					"name": "Title",
					"scalar_type": "String",
					"style": "metadata_h1",
					"value": "Byron 'Buster' Bluth"
				},
				"photo": {
					"name": "Photo",
					"child_type": "image",
					"value": {
						"image": [
							{
								"location": {
									"name": "location",
									"scalar_type": "ParsedURL",
									"value": "http://images1.wikia.nocookie.net/__cb20111027201442/arresteddevelopment/images/thumb/5/5d/Buster.jpg/1000px-Buster.jpg"
								}
							}
						]
					}
				},
				"parents": {
					"name": "Parents",
					"child_type": "person",
					"value": {
						"person": [
							oscar,
							lucille
						]
					}
				},
				"siblings": {
					"name": "Sibilings",
					"child_type": "person",
					"value": {
						"person": [
							
						]
					}
				}
			};
			
var georgeMichael = {
				"title": {
					"name": "Title",
					"scalar_type": "String",
					"style": "metadata_h1",
					"value": "George Michael Bluth"
				},
				"photo": {
					"name": "Photo",
					"child_type": "image",
					"value": {
						"image": [
							{
								"location": {
									"name": "location",
									"scalar_type": "ParsedURL",
									"value": "http://3.bp.blogspot.com/-3HMViIQYRo4/TbIzWAqG1PI/AAAAAAAAARQ/0k08LHVWbvA/s1600/george_michael_bluth.jpg"
								}
							}
						]
					}
				},
				"parents": {
					"name": "Parents",
					"child_type": "person",
					"value": {
						"person": [
							michael
						]
					}
				},
				"cousins": {
					"name": "Cousins",
					"child_type": "person",
					"value": {
						"person": [
						]
					}
				}
			};
			
var maeybe = {
				"title": {
					"name": "Title",
					"scalar_type": "String",
					"style": "metadata_h1",
					"value": "Maeby Fünke"
				},
				"photo": {
					"name": "Photo",
					"child_type": "image",
					"value": {
						"image": [
							{
								"location": {
									"name": "location",
									"scalar_type": "ParsedURL",
									"value": "http://images3.wikia.nocookie.net/__cb20111027201355/arresteddevelopment/images/thumb/a/ad/Maeby.jpg/1000px-Maeby.jpg"
								}
							}
						]
					}
				},
				"parents": {
					"name": "Parents",
					"child_type": "person",
					"value": {
						"person": [
							tobias,
							lindsay
						]
					}
				},
				"cousins": {
					"name": "Cousins",
					"child_type": "person",
					"value": {
						"person": [
						]
					}
				}
			};

var steveHolt = {
				"title": {
					"name": "Title",
					"scalar_type": "String",
					"style": "metadata_h1",
					"value": "Steve Holt"
				},
				"photo": {
					"name": "Photo",
					"child_type": "image",
					"value": {
						"image": [
							{
								"location": {
									"name": "location",
									"scalar_type": "ParsedURL",
									"value": "http://www.ifc.com/wp-content/uploads/2012/03/Notapusy-steve-holt-3033209-1280-720_1_jpg_627x325_crop_upscale_q85.jpg"
								}
							}
						]
					}
				},
				"parents": {
					"name": "Parents",
					"child_type": "person",
					"value": {
						"person": [
							gob
						]
					}
				},
				"cousins": {
					"name": "Cousins",
					"child_type": "person",
					"value": {
						"person": [
							georgeMichael,
							maeybe
						]
					}
				}
			};
			
var annyong = {
				"title": {
					"name": "Title",
					"scalar_type": "String",
					"style": "metadata_h1",
					"value": "Annyong Bluth"
				},
				"photo": {
					"name": "Photo",
					"child_type": "image",
					"value": {
						"image": [
							{
								"location": {
									"name": "location",
									"scalar_type": "ParsedURL",
									"value": "http://images2.wikia.nocookie.net/__cb20120105071311/arresteddevelopment/images/thumb/d/dc/2x3_Annyong.png/1000px-2x3_Annyong.png"
								}
							}
						]
					}
				},
				"parents": {
					"name": "Parents",
					"child_type": "person",
					"value": {
						"person": [
							georgeSr,
							lucille
						]
					}
				},
				"siblings": {
					"name": "Sibilings",
					"child_type": "person",
					"value": {
						"person": [
							gob,
							michael,
							lindsay,
							buster
						]
					}
				}
			};
			
georgeSr.married.value.person.push(lucille);
georgeSr.siblings.value.person.push(oscar);
georgeSr.children.value.person.push(gob);
georgeSr.children.value.person.push(michael);
georgeSr.children.value.person.push(lindsay);
georgeSr.children.value.person.push(annyong);

oscar.children.value.person.push(buster);

lucille.children.value.person.push(gob);
lucille.children.value.person.push(michael);
lucille.children.value.person.push(lindsay);
lucille.children.value.person.push(buster);
lucille.children.value.person.push(annyong);

michael.siblings.value.person.push(gob);
michael.siblings.value.person.push(lindsay);
michael.siblings.value.person.push(buster);
michael.siblings.value.person.push(annyong);
michael.children.value.person.push(georgeMichael);

gob.married.value.person.push(gobsWife);
gob.siblings.value.person.push(michael);
gob.siblings.value.person.push(lindsay);
gob.siblings.value.person.push(buster);
gob.siblings.value.person.push(annyong);
gob.children.value.person.push(steveHolt);

lindsay.married.value.person.push(tobias);
lindsay.siblings.value.person.push(gob);
lindsay.siblings.value.person.push(michael);
lindsay.siblings.value.person.push(buster);
lindsay.siblings.value.person.push(annyong);
lindsay.children.value.person.push(maeybe);

tobias.children.value.person.push(maeybe);

buster.siblings.value.person.push(gob);
buster.siblings.value.person.push(michael);
buster.siblings.value.person.push(lindsay);
buster.siblings.value.person.push(annyong);

georgeMichael.cousins.value.person.push(maeybe);
georgeMichael.cousins.value.person.push(steveHolt);

maeybe.cousins.value.person.push(georgeMichael);
maeybe.cousins.value.person.push(steveHolt);
