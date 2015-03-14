# dotroute
A simple, flexible javascript framwork using jQuery, doT.js, and a custom router.

## Issues

I've been working with Ember.js and Angular.js and realized at the core my goals differ from their authors' goals. 

### Explicit/Implicit

Not a sligh against Ember.js and Angular.js specifically, I've found many frameworks do a lot of automagic under the hood.  While this pattern is great for getting simple applications up and running quickly, it often makes complex applications harder, especially if the framework's core philosophy didn't anticipate what your application is trying to do. 

I prefer to write more code if it's easier to read and understand, else you're merely trading initial dev time (fixed cost) later maintenance time (variable cost), and that just doens't add up.

### Data Binding

I neither need nor want data binding.  In the example Todo app for Ember, the ability to change a title multiple places simultaneously, while neato, is something I can't fathom ever needing.  I feel many of emberizing/angularizing hoops I'm having to jump through revolve around just that.  So for my needs, it's a high cost with little gain.  

### Logicless Templates

All templates have logic, that's what makes them a template and not a static file.  When you use a templating system that's called "logicless," it means you move the exact same logic you'd put in a template to some other part of the code.  You see this most common with simple boolean expressions have to be set as a variable in the model. This separates what's exactly going, and creates more code that is harder to understand. 

### The _____ Way

This seems to be a rising problem with frameworks in general.  Often they have their own version of functionality that are less encompassing than what's already there.  This often results in constantly having to do things the _____ way, and unless the authors anticipated your application's goals, you'll end up writing klugey looking code, or worse, be blocked.

## Goals

### Play Nice

I find jQuery very useful, doT.js looks promising, and routing shouldn't be to tough.  I'd like all these pieces to work together and use what they've done vs. build on it.  I want to make it easy to call a route function from an OnClick tag and it all just work.

### Beyond CRUD

For my applications, I'm doing a lot more than modifying a single model at a time.  Most of what I do is verb based, not noun based.  So not sure I'm planning to even stick with MVC strictly.

### Native Asynchronicity

I want asynchronous calls to work the way the good JavaScript Lord intended.  A route start can make an async calls that'll later call the template render command or something along those lines.

### Keep It Simple

All and all, I don't want to pack in a bunch of automagic features that makes your first app a few lines of code.  It's not the first day of a project I care about.  It's all the other days. I want to take patterns that we'd normally do over and over, and abstract them with easy to use functionality.

