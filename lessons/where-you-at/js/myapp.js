MyApp = new DoTRoute.Application();

MyApp.template("Home","Hello, world!");
MyApp.route("home","/","Home");

MyApp.template("Where","I'm at {{=MyApp.current.path.place}}.");
MyApp.route("where","/where/{place}","Where");

MyApp.route("another/location","/another/location/{place}/{:^\\d+$}","Where",null,function() {
  if (this.application.current.path.place == "Work" && this.application.current.paths[3] > 6) {
    alert("Heading home!");
    this.application.go("where","Home");
  } else {
    this.application.render();
  }
});

