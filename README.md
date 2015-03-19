# dotroute
A simple, flexible javascript framwork using jQuery, doT.js, and a custom router.

# General Usage 

```javascript
MyApp = new DoTRoute.Application();

MyApp.template("Simple","What's up?");
MyApp.route("base","/","Simple");

// Navigating to #/ (or blank) shows "What's up?"

MyApp.template("Where","I'm at {{=this.application.current.path.place}}.");
MyApp.route("where","/where/{place}","Where");

// Navigating to #/place/Home shows "I'm at Home."

MyApp.route("location","/location/{at}",null,null,function() {
  alert("Switching it up!");
  this.application.go("where",this.application.current.path.at);
});

// Navigating to #/location/Work pops up "Switcing it up!" and then shows "I'm at Work."

MyApp.partial("Header","<h1>Top Stuff</h1>");
MyApp.partial("Footer","Bottom Stuff");

MyApp.template("Complex","{{#def.Header}}<p>I came in through the {{=it.door}} door.</p>{{#def.Footer}}",null,MyApp.partials);

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

// Navigating to #/south/ shows "<h1>Top Stuff</h1><p>I came in through the front door.</p>Bottom Stuff"
// Navigating then to #/north/ shows "<h1>Top Stuff</h1><p>I came in through the back door.</p>Bottom Stuff"
// Navigating then to #/east/ pops up "Make sure you check the back door." and shows "<h1>Top Stuff</h1><p>I came in through the side door.</p>Bottom Stuff"
```

# Full Listing

## Application

Main object in the framework

- target - jQuery target for rendering. Used as $(application.target).
- pane - Window for rendering. Used as $(application.target,application.pane.document).
- routes - Object of all routes. Used as application.routes.{route name}.
- routing - Order of all routes. Used as part of matching.  First added is first matched.
- partials - Object of all partials. Used as application.partials.{partial name}.
- templates - Object of all templates. Used as application.templates.{template name}.
- controllers - Object of all controllers. Used as application.controllers.{controller name}.
- current - Object of what's current. 
  - controller - Current controller that was routed to. Can be null if current route lacks a controller.
  - route - Current route
  - paths - Array of what's in the path. 
  ```URL: "#/this/that/5/" => paths: ["this","that","5",""]```
  - path - Parameters object from path as defined by the route. 
  ```URL: "#/this/that/5/" => Route: "/this/{thing}/{id}/" => path: {thing: "this",id: 5}```
  - query - Parameters object from the query. Not used for routing. 
```URL: "#/this?that=3" => query: {that: "3"}```

## Route

Maps a hash pattern to actions.

- application - The application that created the route
- name - The name of the route used for referencing. Used as application.routes.{route name}
- path - The path in text for matching hashes. Can have parameters and/or regular expressions.
  - "/this/that/" matches "#/this/this/" 
  - "/this/{thing}/" matches "#/this/*/" and whatever's in * ends up in application.current.path.thing
  - "/this/{:^\\d+$}/{:^\\w+$:i}/" matches "#/this/(any number)/(any word, case insensitive)/"
  - "/this/{id:\\d+}" matches "#/this/(any number)" and the number ends up in application.current.path.id
- patterns - The compile path for matching hashes
  - "/this/that/" becomes \[{exact: "this"},{exact: "that"},{exact: ""}] (Note the last blank, trailing /'s matter!)
  - "/this/{thing}/" becomes [{exact: "this"},{parameter: "thing"},{exact: ""}]
  - "/this/{:^\\d+$}/{:^\\w+$:i}/" becomes [{exact: "this"},{regex: /^\d+$/},{regex: /^\w+$/i},{exact: ""}]
  - "/this/{id:\\d+}" becomes [{exact: "this"},{parameter: "id",regex: /^\d+$/},{exact: ""}]
- template - The template object for this route.  Used by application.render in that if not template is specified, uses the current route's template. 
- controller - The controller object for this route.  Can be used to grab the controller's it context. 
- enter - Function called with entering the route.  Can be anonymous or part of its controller.
- exit - Function called with exiting the route.  Can be anonymous or part of its controller. 

## Controller

Collates functionality in an Application mapped to by Routes

- application - The application that created the controller
- name - The name of the controller used for referencing. Used as application.controllers.{controller name}.
- it - The Object context to render templates by. it: {stuff: "things"} + template: "I like {{=it.stuff}}" => render: "I like things"

The name 'it' is a matter of convention.  The doT.js template engine uses that as the context name so for clarity we do the same in the controller.  

When rendering a template, you can send any object you want but seeing "this.application.render(this.it)" is clearer.

## Template

Templates aren't objects in an Application.  Just names mapped to functions outputted by doT.template(). Used as application.templates.{template name}.

## Partial

Partials are even less so in an Application.  Just names mapped to strings. Used as application.partials.{partial name}.

See doT.template() for more.

## constructor(target,pane,wait)

Creates an application.  

- target(='body') - jQuery target for rendering. Assigned to this.target
- pane(=window) - Window for rendering. Assigned to this.pane
- wait(=false) - Whether to wait before starting app.  Used in the unit tests.

```javascript
// This is the most typical usage
MyApp = new DoTRoute.Application();

// This is how you'd open a test app
testing = window.open("", "_blank", "width=200, height=100");
testing.document.write("<span></span>");
MyTestApp = new DoTRoute.Application("span",testing,true);
```

## start() 

Adds events listeners hashchange  Normally called by default as part of the contructor

```javascript
testing = window.open("", "_blank", "width=200, height=100");
testing.document.write("<span></span>");
MyTestApp = new DoTRoute.Application("span",testing,true);
// Perform some other setup
MyTestApp.start();
```

## partial(name,text)

Registers a partial template which can then be used by other templates. 
- name - What to reference by.
- text - Text to use in the template

Returns the partial's text. This usually isn't needed as partials are typically referenced by name. 

It doesn't compile the partial at this point.  That'll be done when it's used by another template.

```javascript
MyApp = new DoTRoute.Application();

MyApp.partial("Header","<h1>Top Stuff</h1>");
MyApp.partial("Footer","Bottom Stuff");

// Note the use of partials as the last arg
MyApp.template("Complex","{{#def.Header}}<p>I came in through the {{=it.door}} door.</p>{{#def.Footer}}",null,MyApp.partials);
```

See doT.template() for more.

## template(name,text,custom,data)

Compiles and registers a template which can then be used by routes. 
- name - What to reference by.
- text - Text to use in the template, first arg to doT.template().
- custom - Custom compile settings, second arg to doT.template().
- data - Compile time rendering data, second arg to doT.template(). Used mainly for partials.
Returns the template's compile function. This usually isn't needed as templates are typically referenced by name. 

```javascript
MyApp = new DoTRoute.Application();

MyApp.template("Simple","What's up?");
   
MyApp.partial("Header","<h1>Top Stuff</h1>");
MyApp.partial("Footer","Bottom Stuff");

// Note the use of partials as the last arg
MyApp.template("Complex","{{#def.Header}}<p>I came in through the {{=it.door}} door.</p>{{#def.Footer}}",null,MyApp.partials);
```

See doT.template() for more.

# Reasons for Creating

## Issues

I've been working with Ember.js and Angular.js and realized at the core my goals differ from their authors' goals. 

### Explicit/Implicit

Not a sligh against Ember.js and Angular.js specifically, I've found many frameworks do a lot of automagic under the hood.  While this pattern is great for getting simple applications up and running quickly, it often makes complex applications harder, especially if the framework's core philosophy didn't anticipate what your application is trying to do. 

I prefer to write more code if it's easier to read and understand, else you're merely trading initial dev time (fixed cost) later maintenance time (variable cost), and that just doens't add up.

### Data Binding

I neither need nor want data binding.  In the example Todo app for Ember, the ability to change a title multiple places simultaneously, while neato, is something I can't fathom ever needing.  I feel many of emberizing/angularizing hoops I'm having to jump through revolve around just that.  So for my needs, it's a high cost with little gain.  

### Logicless Templates

All templates have logic, that's what makes them a template and not a static file.  When you use a templating system that's called "logicless," it means you move the exact same logic you'd put in a template to some other part of the code.  You see this most common with simple boolean expressions have to be set as a variable in the model only to be used in if statements somewhere else (which is logic btw). This separates what's happening from where it's used and creates more code that is harder to understand. 

### The _____ Way

This seems to be a rising problem with frameworks in general.  Often they have their own version of functionality that are less encompassing than what's already there.  This often results in constantly having to do things the _____ way, and unless the authors anticipated your application's goals, you'll end up writing klugey looking code, or worse, be blocked.

## Goals

### Play Nice

I find jQuery very useful, doT.js looks promising, and routing shouldn't be to tough.  I'd like all these pieces to work together and use what they've done vs. build on it.  I want to make it easy to call a route function from an OnClick tag, do something in a controller from outside it, and it all just work.

### Beyond CRUD

For my applications, I'm doing a lot more than modifying a single model at a time.  Most of what I do is verb based, not noun based.  So not sure I'm planning to even stick with MVC strictly.

### Native Asynchronicity

I want asynchronous calls to work the way the good JavaScript Lord intended.  A route start can make an async calls that'll later call the template render command or something along those lines.

### Keep It Simple

All and all, I don't want to pack in a bunch of automagic features that makes your first app a few lines of code.  It's not the first day of a project I care about.  It's all the other days. I want to take patterns that we'd normally do over and over and abstract them with easy to use functionality.

