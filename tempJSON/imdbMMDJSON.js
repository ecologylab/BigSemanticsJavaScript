{
    "name": "imdb_title",
    "comment": "IMDB metadata",
    "extends": "document",
    "parser": "xpath",
    "kids": [
        {
            "scalar": {
                "name": "title",
                "xpath": "//h1[@class='header']"
            }
        },
        {
            "scalar": {
                "name": "location",
                "layer": "-1.0"
            }
        },
        {
            "scalar": {
                "name": "year_released",
                "xpath": "//h1[@class='header']//a",
                "style": "h1",
                "layer": "9.5",
                "label": "year released",
                "scalar_type": "StringType"
            }
        },
        {
            "scalar": {
                "name": "rating",
                "xpath": "//span[@class='rating-rating']",
                "scalar_type": "StringType"
            }
        },
        {
            "collection": {
                "name": "directors",
                "xpath": "//td[@id='overview-top']//div[@class='txt-block'][contains(.,'Director')]//a",
                "layer": "9.0",
                "child_type": "person_details",
                "child_entity": "true",
                "kids": [
                    {
                        "composite": {
                            "name": "entity",
                            "kids": [
                                {
                                    "scalar": {
                                        "name": "location",
                                        "xpath": "./@href"
                                    }
                                },
                                {
                                    "scalar": {
                                        "name": "gist",
                                        "xpath": ".",
                                        "label": "name"
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            "collection": {
                "name": "writers",
                "xpath": "//td[@id='overview-top']//div[@class='txt-block'][contains(.,'Writer')]//a",
                "layer": "8.5",
                "child_type": "person_details",
                "child_entity": "true",
                "kids": [
                    {
                        "composite": {
                            "name": "entity",
                            "kids": [
                                {
                                    "scalar": {
                                        "name": "location",
                                        "xpath": "./@href"
                                    }
                                },
                                {
                                    "scalar": {
                                        "name": "gist",
                                        "xpath": ".",
                                        "label": "name"
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            "scalar": {
                "name": "release_date",
                "xpath": "//td[@id='overview-top']//div[@class='txt-block'][contains(.,'Release Date')]",
                "label": "release date",
                "scalar_type": "StringType",
                "filter": {
                    "regex": "Release Date:",
                    "replace": ""
                }
            }
        },
        {
            "collection": {
                "name": "genres",
                "xpath": "//h4[contains(.,'Genres')]/..//a",
                "child_type": "genre",
                "kids": [
                    {
                        "composite": {
                            "name": "genre",
                            "kids": [
                                {
                                    "scalar": {
                                        "name": "genre_link",
                                        "xpath": "./@href",
                                        "hide": "true",
                                        "scalar_type": "ParsedURLType"
                                    }
                                },
                                {
                                    "scalar": {
                                        "name": "name",
                                        "xpath": "string(.)",
                                        "navigates_to": "genre_link",
                                        "scalar_type": "StringType"
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            "scalar": {
                "name": "plot",
                "xpath": "//h2[contains(.,'Storyline')]/../p[1]",
                "scalar_type": "StringType",
                "filter": {
                    "regex": "more",
                    "replace": ""
                }
            }
        },
        {
            "scalar": {
                "name": "tagline",
                "xpath": "//h4[contains(.,'Tagline')]/..",
                "scalar_type": "StringType",
                "filter": {
                    "regex": "Taglines:|See more",
                    "replace": ""
                }
            }
        },
        {
            "collection": {
                "name": "cast",
                "xpath": "//table[@class='cast_list']//tr[@class='odd' or @class='even']",
                "layer": "8.0",
                "child_type": "cast_member",
                "kids": [
                    {
                        "composite": {
                            "name": "cast_member",
                            "kids": [
                                {
                                    "composite": {
                                        "name": "actor",
                                        "xpath": "td[@class='name']",
                                        "type": "person_details",
                                        "entity": "true",
                                        "kids": [
                                            {
                                                "scalar": {
                                                    "name": "gist",
                                                    "xpath": "string(.)",
                                                    "label": "name"
                                                }
                                            },
                                            {
                                                "scalar": {
                                                    "name": "location",
                                                    "xpath": "./a/@href"
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    "composite": {
                                        "name": "character",
                                        "xpath": "td[@class='character']",
                                        "type": "person_details",
                                        "entity": "true",
                                        "kids": [
                                            {
                                                "scalar": {
                                                    "name": "gist",
                                                    "xpath": "string(.)",
                                                    "label": "name"
                                                }
                                            },
                                            {
                                                "scalar": {
                                                    "name": "location",
                                                    "xpath": "./div/a/@href"
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            "collection": {
                "name": "title_photos",
                "xpath": "//div[@class='mediastrip']//img/@src",
                "hide": "true",
                "child_type": "image",
                "kids": [
                    {
                        "composite": {
                            "name": "image",
                            "kids": [
                                {
                                    "scalar": {
                                        "name": "location",
                                        "xpath": "."
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            "scalar": {
                "name": "poster_img",
                "xpath": "//td[@id='img_primary']//img/@src",
                "hide": "true",
                "scalar_type": "ParsedURLType"
            }
        }
    ],
    "semantic_actions": [
        
    ],
    "selector": {
        "url_path_tree": "http://www.imdb.com/title/"
    }
}