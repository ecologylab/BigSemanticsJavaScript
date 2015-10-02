var classA_classB_data = {
   "class_a":{
      "simpl.id":"22297736",
      "x":"1",
      "y":"2",
      "class_b":{
         "a":"3",
         "b":"4",
         "class_a":{
            "simpl.ref":"22297736"
         }
      },
      "class_a":{
         "simpl.ref":"22297736"
      },
      "simpl.type": "tests.graph.ClassA"
   }
};

var classA = {
	"x":11,
    "y":22,
    "simpl.type": "tests.graph.ClassA"
};

var classB = {
	"a":33,
     "b":44,
     "class_a": classA
};

classA["class_a"] = classA;
classA["class_b"] = classB;

var classA_classB_app_data = {
   "my_class_a":classA
};