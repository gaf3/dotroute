MyApp = new DoTRoute.Application();

MyApp.template("Home","Hello, world!");
MyApp.route("home","/","Home");

MyApp.template("Where","I'm at {{=MyApp.current.path.place}}.");
MyApp.route("where","/where/{place}","Where");

MyApp.route("location","/location/{at}",null,null,function() {
  alert("Switching it up!");
  this.application.go("where",this.application.current.path.at);
});

MyApp.partial("Header","<h1>Top Stuff</h1>");
MyApp.partial("Footer","Bottom Stuff");

var complex = "{{#def.Header}}\n" +
              "<p>I came in through the {{=it.door}} door.</p>\n" + 
              "{{#def.Footer}}";

MyApp.template("Complex",complex,null,MyApp.partials);

MyApp.controller("Doors",null,{
  front: function() {
    this.it = {door: "front"};
    this.application.render(this.it);
  },
  back: function() {
    this.it = {door: "back"};
    this.application.render(this.it);
  },
  side: function() {
    this.it = {door: "side"};
    this.application.render(this.it);
  },
  check: function() {
    alert("Make sure you check the " + this.it.door + " door.");
  }
});

MyApp.route("south","/south/","Complex","Doors","front");
MyApp.route("north","/north/","Complex","Doors","back","check");
MyApp.route("east","/east/","Complex","Doors","side");
