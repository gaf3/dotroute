MyApp = new DoTRoute.Application();

MyApp.controller("Doors",null,{
  directions: ['south','north','east'],
  front: function() {
    this.it = {door: "front", directions: this.directions};
    this.application.render(this.it);
  },
  back: function() {
    this.it = {door: "back", directions: this.directions};
    this.application.render(this.it);
  },
  side: function() {
    this.it = {door: "side", directions: this.directions};
    this.application.render(this.it);
  },
  check: function() {
    alert("Make sure you check the " + this.it.door + " door.");
  }
});

MyApp.partial("Header","<h1>Top Stuff</h1>");

var directions = '{{~it.directions :direction}}\n'+ 
                 '<a href="{{=MyApp.link(direction)}}">{{=direction}}</a> \n' +
                 '{{~}}';

MyApp.partial("Footer",directions);

var complex = "{{#def.Header}}\n" +
              "<p>I came in through the {{=it.door}} door.</p>\n" + 
              "{{#def.Footer}}";

MyApp.template("Complex",complex,null,MyApp.partials);

MyApp.route("south","/south/","Complex","Doors","front");
MyApp.route("north","/north/","Complex","Doors","back","check");
MyApp.route("east","/east/","Complex","Doors","side");
