# doTRoute.js

A simple, flexible javascript framework using doT.js and a custom router. No jQuery, no build step.

It isn't meant to be fancy or all encompassing. It's for when you have an API that does most of the work and you need something to make the pretty: route displays as if they were separate web pages, and from there just use regular ass code™.

## Install

```bash
npm install dotroute
```

That brings [doT](https://github.com/olado/doT) along as a peer dependency. Or skip npm and use two script tags:

```html
<script src="doT.js"></script>
<script src="doTRoute.js"></script>
```

Either way you get `DoTRoute`. In a module: `const DoTRoute = require("dotroute")`. Types are included.

## A taste

```html
<body></body>
<script>
    var app = new DoTRoute.Application();

    app.template("Hello", "<h1>Hello {{=it.name}}</h1>");

    app.controller("Greeter", null, {
        hello: function () {
            this.it.name = app.current.path.name;
            this.application.render(this.it);
        }
    });

    app.route("hello", "/hello/{name}", "Hello", "Greeter", "hello");
</script>
```

Open the page at `#/hello/there` and the body says "Hello there". Change the hash and the cycle repeats.

## Typical flow

1. You change the location hash, like `#/this/that`.
2. That triggers an event listener in your application object.
3. Your application tries to match the hash against the route paths you defined, in the order you registered them.
4. With the first matching route, it calls the route's enter function, usually one on a controller you registered.
5. The enter function grabs some data, merges it with a template, and displays a page in the body tag.
6. You do what you do on the page until you change the hash, and the cycle repeats.

## More

- [General overview](http://gaf3.github.io/dotroute/)
- [Tutorial](https://github.com/gaf3/dotroute/wiki/Tutorial)
- [Full documentation](https://github.com/gaf3/dotroute/wiki)
- [Changelog](CHANGELOG.md)

## Developing

Everything runs in Docker, so all you need is Docker and make:

```bash
make build   # the image (once, and after changing package.json)
make test    # the tests, with coverage
make lint    # ESLint, and a type-check of the types
make setup   # pack it, install it in an empty project, use it
```
