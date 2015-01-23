var circle_data = {"circle":{"radius":"3","center":{"x":"2","y":"1"},"simpl.type":"tests.circle.Circle"}};

var circle_app_data = {"my_circle":{"radius":77,"center":{"x":52,"y":15},"flavor":"mustard","name":"Samuel","simpl.type":"tests.circle.Circle"}};

var nic = {"person":{"name": "Nic"}};
var marion = {"name": "Marion", "spouse": nic["person"]};
nic["person"]["spouse"] = marion;

