# doTRoute.js

A simple, flexible javascript framwork using jQuery, doT.js, and a custom router.

# General Usage 

```javascript
MyApp = new DoTRoute.Application();

MyApp.template("Simple","What's up?");
MyApp.route("base","/","Simple");

// Navigating to #/ (or blank) shows "What's up?"

MyApp.template("Where","I'm at {{=MyApp.current.path.place}}.");
MyApp.route("where","/where/{place}","Where");

// Navigating to #/where/Home shows "I'm at Home."

MyApp.route("location","/location/{at}",null,null,function() {
  alert("Switching it up!");
  this.application.go("where",this.application.current.path.at);
});

// Navigating to #/location/Work pops up "Switcing it up!" 
// and then shows "I'm at Work."

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

// Navigating to #/south/ shows "<h1>Top Stuff</h1><p>I came in 
// through the front door.</p>Bottom Stuff"

// Navigating then to #/north/ shows "<h1>Top Stuff</h1><p>I 
// came in through the back door.</p>Bottom Stuff"

// Navigating then to #/east/ pops up "Make sure you check the 
// back door." and shows "<h1>Top Stuff</h1><p>I came in through 
// the side door.</p>Bottom Stuff"
```

[Full Documentation](https://github.com/gaf3/dotroute/wiki)