imdbMovie = {
	"title": {
		"name": "title",
		"xpath": "//h1[@class='header']",
		"schema_org_itemprop": "name",
		"style": "metadata_h1",
		"layer": "10.0",
		"navigates_to": "location",
		"scalar_type": "String",
		"hint": "XML_LEAF",
		"kids": [],
		"value": "Pulp Fiction (1994) - IMDb"
	},
	"abstract": {
		"name": "description",
		"tag": "abstract",
		"other_tags": "abstract_field",
		"xpath": "//div/table[@id='title-overview-widget-layout']/tbody/tr[1]/td[@id='overview-top']/p[2]",
		"schema_org_itemprop": "description",
		"layer": "9.0",
		"label": "Description",
		"scalar_type": "String",
		"hint": "XML_LEAF",
		"kids": [],
		"filter": {
			"regex": "more",
			"replace": "",
			"normalize_text": "true"
		},
		"value": "The lives of two mob hit men, a boxer, a gangster's wife, and a pair of diner bandits intertwine in four tales of violence and redemption."
	},
	"storyline": {
		"name": "storyline",
		"xpath": "//h2[contains(.,'Storyline')]/../p[1]",
		"layer": "8.5",
		"scalar_type": "String",
		"kids": [],
		"value": "Jules Winnfield and Vincent Vega are two hitmen who are out to retrieve a suitcase stolen from their employer, mob boss Marsellus Wallace. Wallace has also asked Vincent to take his wife Mia out a few days later when Wallace himself will be out of town. Butch Coolidge is an aging boxer who is paid by Wallace to lose his next fight. The lives of these seemingly unrelated people are woven together comprising of a series of funny, bizarre and uncalled-for incidents.Written by Soumitra"
	},
	"overall_rating": {
		"name": "overall_rating",
		"xpath": "//div[@class='star-box giga-star']/div[@class='star-box-details']/strong/span",
		"layer": "8.0",
		"scalar_type": "String",
		"kids": [],
		"value": "9.0"
	},
	"mpaa_rating": {
		"name": "mpaa_rating",
		"xpath": "//h4[contains(.,'Motion Picture Rating')]/../span",
		"layer": "7.0",
		"scalar_type": "String",
		"kids": [],
		"value": "Rated R for strong graphic violence and drug use, pervasive strong language and some sexuality"
	},
	"theater_release": {
		"name": "theater_release",
		"xpath": "//h4[contains(.,'Release Date:')]/../time",
		"layer": "5.0",
		"scalar_type": "String",
		"kids": [],
		"value": "14 October 1994"
	},
	"directors": {
		"name": "directors",
		"xpath": "//h4[contains(.,'Director:')]/../a",
		"layer": "4.0",
		"package": "ecologylab.semantics.generated.library.movie",
		"child_type": "document",
		"kids": [
			{
				"composite": {
					"name": "document",
					"package": "ecologylab.semantics.generated.library.movie",
					"type": "document",
					"kids": [
						{
							"scalar": {
								"name": "title",
								"xpath": ".",
								"schema_org_itemprop": "name",
								"style": "metadata_h1",
								"layer": "10.0",
								"navigates_to": "location",
								"label": "name",
								"scalar_type": "String",
								"hint": "XML_LEAF",
								"kids": [],
								"value": "Quentin Tarantino"
							}
						}, {
							"scalar": {
								"name": "location",
								"xpath": "./@href",
								"schema_org_itemprop": "url",
								"hide": "true",
								"layer": "8.0",
								"scalar_type": "ParsedURL",
								"kids": [],
								"value": "/name/nm0000233/"
							}
						}, {
							"scalar": {
								"simpl.ref": "1524063303"
							}
						}, {
							"scalar": {
								"simpl.ref": "815786062"
							}
						}, {
							"collection": {
								"simpl.ref": "415546420"
							}
						}, {
							"scalar": {
								"simpl.ref": "471860896"
							}
						}, {
							"collection": {
								"simpl.ref": "1226412018"
							}
						}, {
							"collection": {
								"simpl.ref": "10202458"
							}
						}
					]
				}
			}
		],
		"value": {
			"document": [
				{
					"title": {
						"name": "title",
						"xpath": ".",
						"schema_org_itemprop": "name",
						"style": "metadata_h1",
						"layer": "10.0",
						"navigates_to": "location",
						"label": "name",
						"scalar_type": "String",
						"hint": "XML_LEAF",
						"kids": [],
						"value": "Quentin Tarantino"
					},
					"location": {
						"name": "location",
						"xpath": "./@href",
						"schema_org_itemprop": "url",
						"hide": "true",
						"layer": "8.0",
						"scalar_type": "ParsedURL",
						"kids": [],
						"value": "/name/nm0000233/"
					}
				}
			]
		}
	},
	"writers": {
		"name": "writers",
		"xpath": "//h4[contains(.,'Writers:')]/../a",
		"layer": "4.0",
		"package": "ecologylab.semantics.generated.library.movie",
		"child_type": "document",
		"kids": [
			{
				"composite": {
					"name": "document",
					"package": "ecologylab.semantics.generated.library.movie",
					"type": "document",
					"kids": [
						{
							"scalar": {
								"name": "title",
								"xpath": ".",
								"schema_org_itemprop": "name",
								"style": "metadata_h1",
								"layer": "10.0",
								"navigates_to": "location",
								"label": "name",
								"scalar_type": "String",
								"hint": "XML_LEAF",
								"kids": [],
								"value": "and 1 more credit"
							}
						}, {
							"scalar": {
								"name": "location",
								"xpath": "./@href",
								"schema_org_itemprop": "url",
								"hide": "true",
								"layer": "8.0",
								"scalar_type": "ParsedURL",
								"kids": [],
								"value": "fullcredits#writers"
							}
						}, {
							"scalar": {
								"simpl.ref": "1524063303"
							}
						}, {
							"scalar": {
								"simpl.ref": "815786062"
							}
						}, {
							"collection": {
								"simpl.ref": "415546420"
							}
						}, {
							"scalar": {
								"simpl.ref": "471860896"
							}
						}, {
							"collection": {
								"simpl.ref": "1226412018"
							}
						}, {
							"collection": {
								"simpl.ref": "10202458"
							}
						}
					]
				}
			}
		],
		"value": {
			"document": [
				{
					"title": {
						"name": "title",
						"xpath": ".",
						"schema_org_itemprop": "name",
						"style": "metadata_h1",
						"layer": "10.0",
						"navigates_to": "location",
						"label": "name",
						"scalar_type": "String",
						"hint": "XML_LEAF",
						"kids": [],
						"value": "Quentin Tarantino"
					},
					"location": {
						"name": "location",
						"xpath": "./@href",
						"schema_org_itemprop": "url",
						"hide": "true",
						"layer": "8.0",
						"scalar_type": "ParsedURL",
						"kids": [],
						"value": "/name/nm0000233/"
					}
				}, {
					"title": {
						"name": "title",
						"xpath": ".",
						"schema_org_itemprop": "name",
						"style": "metadata_h1",
						"layer": "10.0",
						"navigates_to": "location",
						"label": "name",
						"scalar_type": "String",
						"hint": "XML_LEAF",
						"kids": [],
						"value": "Roger Avary"
					},
					"location": {
						"name": "location",
						"xpath": "./@href",
						"schema_org_itemprop": "url",
						"hide": "true",
						"layer": "8.0",
						"scalar_type": "ParsedURL",
						"kids": [],
						"value": "/name/nm0000812/"
					}
				}, {
					"title": {
						"name": "title",
						"xpath": ".",
						"schema_org_itemprop": "name",
						"style": "metadata_h1",
						"layer": "10.0",
						"navigates_to": "location",
						"label": "name",
						"scalar_type": "String",
						"hint": "XML_LEAF",
						"kids": [],
						"value": "and 1 more credit"
					},
					"location": {
						"name": "location",
						"xpath": "./@href",
						"schema_org_itemprop": "url",
						"hide": "true",
						"layer": "8.0",
						"scalar_type": "ParsedURL",
						"kids": [],
						"value": "fullcredits#writers"
					}
				}
			]
		}
	},
	"genres": {
		"name": "genres",
		"xpath": "//h4[contains(.,'Genres:')]/../a",
		"package": "ecologylab.semantics.generated.library.movie",
		"child_type": "document",
		"kids": [
			{
				"composite": {
					"name": "document",
					"package": "ecologylab.semantics.generated.library.movie",
					"type": "document",
					"kids": [
						{
							"scalar": {
								"name": "title",
								"xpath": ".",
								"schema_org_itemprop": "name",
								"style": "metadata_h1",
								"layer": "10.0",
								"navigates_to": "location",
								"scalar_type": "String",
								"hint": "XML_LEAF",
								"kids": [],
								"value": "Thriller"
							}
						}, {
							"scalar": {
								"name": "location",
								"xpath": "./@href",
								"schema_org_itemprop": "url",
								"hide": "true",
								"layer": "8.0",
								"scalar_type": "ParsedURL",
								"kids": [],
								"value": "/genre/Thriller"
							}
						}, {
							"scalar": {
								"simpl.ref": "1524063303"
							}
						}, {
							"scalar": {
								"simpl.ref": "815786062"
							}
						}, {
							"collection": {
								"simpl.ref": "415546420"
							}
						}, {
							"scalar": {
								"simpl.ref": "471860896"
							}
						}, {
							"collection": {
								"simpl.ref": "1226412018"
							}
						}, {
							"collection": {
								"simpl.ref": "10202458"
							}
						}
					]
				}
			}
		],
		"value": {
			"document": [
				{
					"title": {
						"name": "title",
						"xpath": ".",
						"schema_org_itemprop": "name",
						"style": "metadata_h1",
						"layer": "10.0",
						"navigates_to": "location",
						"scalar_type": "String",
						"hint": "XML_LEAF",
						"kids": [],
						"value": "Crime"
					},
					"location": {
						"name": "location",
						"xpath": "./@href",
						"schema_org_itemprop": "url",
						"hide": "true",
						"layer": "8.0",
						"scalar_type": "ParsedURL",
						"kids": [],
						"value": "/genre/Crime"
					}
				}, {
					"title": {
						"name": "title",
						"xpath": ".",
						"schema_org_itemprop": "name",
						"style": "metadata_h1",
						"layer": "10.0",
						"navigates_to": "location",
						"scalar_type": "String",
						"hint": "XML_LEAF",
						"kids": [],
						"value": "Thriller"
					},
					"location": {
						"name": "location",
						"xpath": "./@href",
						"schema_org_itemprop": "url",
						"hide": "true",
						"layer": "8.0",
						"scalar_type": "ParsedURL",
						"kids": [],
						"value": "/genre/Thriller"
					}
				}
			]
		}
	},
	"tagline": {
		"name": "tagline",
		"xpath": "//h4[contains(.,'Tagline')]/..",
		"scalar_type": "String",
		"kids": [],
		"filter": {
			"regex": "Taglines:|See more",
			"replace": "",
			"normalize_text": "true"
		},
		"value": " Girls like me don't make invitations like this to just anyone!"
	},
	"title_photos": {
		"name": "title_photos",
		"xpath": "//div[@class='mediastrip']//img/@src",
		"hide": "true",
		"package": "ecologylab.semantics.generated.library.imdb",
		"child_type": "image",
		"kids": [
			{
				"composite": {
					"name": "image",
					"package": "ecologylab.semantics.generated.library.imdb",
					"type": "image",
					"kids": [
						{
							"scalar": {
								"simpl.ref": "2137552888"
							}
						}, {
							"scalar": {
								"name": "location",
								"xpath": ".",
								"schema_org_itemprop": "url",
								"hide": "true",
								"layer": "9.0",
								"scalar_type": "ParsedURL",
								"kids": [],
								"value": "http://ia.media-imdb.com/images/M/MV5BMTQ1Mzc5NjU5NF5BMl5BanBnXkFtZTcwMzAzNDY3Mw@@._V1._CR136,0,387,387_SS99_.jpg"
							}
						}, {
							"scalar": {
								"simpl.ref": "1524063303"
							}
						}, {
							"scalar": {
								"name": "local_location",
								"comment": "Relative location of local copy of image.",
								"hide": "true",
								"scalar_type": "ParsedURL",
								"kids": []
							}
						}, {
							"scalar": {
								"name": "creation_date",
								"scalar_type": "Date",
								"kids": []
							}
						}, {
							"collection": {
								"simpl.id": "1519543948",
								"name": "clippings_this_is_in",
								"comment": "Clippings based on this.",
								"other_tags": "clippings",
								"hide": "true",
								"package": "ecologylab.semantics.metadata.builtins",
								"polymorphic_scope": "repository_clippings",
								"child_type": "media_clipping",
								"kids": [
									{
										"composite": {
											"name": "media_clipping",
											"package": "ecologylab.semantics.metadata.builtins",
											"type": "media_clipping",
											"kids": [
												{
													"scalar": {
														"name": "caption",
														"comment": "The caption of the image.",
														"always_show": "true",
														"style": "metadata_h1",
														"layer": "11.0",
														"scalar_type": "String",
														"kids": []
													}
												}, {
													"scalar": {
														"simpl.ref": "1235930463"
													}
												}, {
													"composite": {
														"name": "media",
														"package": "ecologylab.semantics.metadata.builtins",
														"promote_children": "true",
														"polymorphic_scope": "repository_media",
														"type": "ME",
														"wrap": "true",
														"kids": [
															{
																"scalar": {
																	"simpl.ref": "2137552888"
																}
															}, {
																"scalar": {
																	"simpl.ref": "1789767313"
																}
															}, {
																"scalar": {
																	"simpl.ref": "1524063303"
																}
															}, {
																"collection": {
																	"simpl.ref": "1519543948"
																}
															}, {
																"scalar": {
																	"simpl.id": "649272183",
																	"name": "width",
																	"hide": "true",
																	"scalar_type": "Integer",
																	"kids": []
																}
															}, {
																"scalar": {
																	"simpl.id": "953169274",
																	"name": "height",
																	"hide": "true",
																	"scalar_type": "Integer",
																	"kids": []
																}
															}, {
																"scalar": {
																	"simpl.ref": "815786062"
																}
															}, {
																"collection": {
																	"simpl.ref": "415546420"
																}
															}, {
																"scalar": {
																	"simpl.ref": "471860896"
																}
															}, {
																"collection": {
																	"simpl.ref": "1226412018"
																}
															}, {
																"collection": {
																	"simpl.ref": "10202458"
																}
															}
														]
													}
												}, {
													"scalar": {
														"simpl.ref": "862814614"
													}
												}, {
													"scalar": {
														"simpl.ref": "1939520811"
													}
												}, {
													"composite": {
														"simpl.ref": "1152296720"
													}
												}, {
													"composite": {
														"simpl.ref": "1211763377"
													}
												}, {
													"scalar": {
														"simpl.ref": "471860896"
													}
												}, {
													"collection": {
														"simpl.ref": "1226412018"
													}
												}, {
													"collection": {
														"simpl.ref": "10202458"
													}
												}
											]
										}
									}
								],
								"generic_type_var": [
									{
										"name": "ME",
										"arg": "ME"
									}
								]
							}
						}, {
							"scalar": {
								"simpl.ref": "649272183"
							}
						}, {
							"scalar": {
								"simpl.ref": "953169274"
							}
						}, {
							"collection": {
								"simpl.ref": "415546420"
							}
						}, {
							"scalar": {
								"simpl.ref": "471860896"
							}
						}, {
							"collection": {
								"simpl.ref": "1226412018"
							}
						}, {
							"collection": {
								"simpl.ref": "10202458"
							}
						}
					]
				}
			}
		],
		"value": {
			"image": [
				{
					"location": {
						"name": "location",
						"xpath": ".",
						"schema_org_itemprop": "url",
						"hide": "true",
						"layer": "9.0",
						"scalar_type": "ParsedURL",
						"kids": [],
						"value": "http://ia.media-imdb.com/images/M/MV5BMTg3MDQ5NTgwOV5BMl5BanBnXkFtZTcwNzA0MzU5Ng@@._V1._CR364,0,1320,1320_SS99_.jpg"
					}
				}, {
					"location": {
						"name": "location",
						"xpath": ".",
						"schema_org_itemprop": "url",
						"hide": "true",
						"layer": "9.0",
						"scalar_type": "ParsedURL",
						"kids": [],
						"value": "http://ia.media-imdb.com/images/M/MV5BMTUwNTE0NjU2Ml5BMl5BanBnXkFtZTcwMDE0MzU5Ng@@._V1._CR353,0,1341,1341_SS99_.jpg"
					}
				}, {
					"location": {
						"name": "location",
						"xpath": ".",
						"schema_org_itemprop": "url",
						"hide": "true",
						"layer": "9.0",
						"scalar_type": "ParsedURL",
						"kids": [],
						"value": "http://ia.media-imdb.com/images/M/MV5BMTUzNjMxNjUwN15BMl5BanBnXkFtZTcwNDgxMjIyNw@@._V1._CR343,0,1362,1362_SS99_.jpg"
					}
				}, {
					"location": {
						"name": "location",
						"xpath": ".",
						"schema_org_itemprop": "url",
						"hide": "true",
						"layer": "9.0",
						"scalar_type": "ParsedURL",
						"kids": [],
						"value": "http://ia.media-imdb.com/images/M/MV5BMTM3MzA5MDQxMF5BMl5BanBnXkFtZTcwMjE0MzU5Ng@@._V1._CR339,0,1369,1369_SS99_.jpg"
					}
				}, {
					"location": {
						"name": "location", 
						"xpath": ".",
						"schema_org_itemprop": "url",
						"hide": "true",
						"layer": "9.0",
						"scalar_type": "ParsedURL",
						"kids": [],
						"value": "http://ia.media-imdb.com/images/M/MV5BMTU2Mjc0MTg4MF5BMl5BanBnXkFtZTcwOTA0MzU5Ng@@._V1._CR0,0,1310,1310_SS99_.jpg"
					}
				}, {
					"location": {
						"name": "location",
						"xpath": ".",
						"schema_org_itemprop": "url",
						"hide": "true",
						"layer": "9.0",
						"scalar_type": "ParsedURL",
						"kids": [],
						"value": "http://ia.media-imdb.com/images/M/MV5BMTQ1Mzc5NjU5NF5BMl5BanBnXkFtZTcwMzAzNDY3Mw@@._V1._CR136,0,387,387_SS99_.jpg"
					}
				}
			]
		}
	},
	"pic": {
		"name": "pic",
		"xpath": "//td[@id='img_primary']//img/@src",
		"hide": "true",
		"scalar_type": "ParsedURL",
		"kids": [],
		"value": "http://ia.media-imdb.com/images/M/MV5BMjE0ODk2NjczOV5BMl5BanBnXkFtZTYwNDQ0NDg4._V1._SY317_CR4,0,214,317_.jpg"
	},
	"location": {
		"name": "location",
		"schema_org_itemprop": "url",
		"hide": "true",
		"layer": "-1.0",
		"scalar_type": "ParsedURL",
		"kids": [],
		"value": "http://www.imdb.com/title/tt0110912/"
	},
	"mm_name": "imdb_title"
};