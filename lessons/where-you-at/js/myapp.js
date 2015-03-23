MyApp = new DoTRoute.Application();

MyApp.template("Home","Hello, world!");
MyApp.route("home","/","Home");

MyApp.template("Where","I'm at {{=MyApp.current.path.place}}.");
MyApp.route("where","/where/{place}","Where");

MyApp.route("location","/location/{at}",null,null,function() {
  alert("Switching it up!");
  this.application.go("where",this.application.current.path.at);
});
