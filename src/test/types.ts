// Not run: `make lint` type-checks it, which checks that doTRoute.d.ts says what the library does.

import DoTRoute = require("../doTRoute");

const application = new DoTRoute.Application("#app", window, true);

application.partial("Header", "<h1>{{=it.title}}</h1>");

const template: DoTRoute.Template = application.template("Home", "{{#def.Header}}", null, application.partials);

const controller: DoTRoute.Controller = application.controller("Home", null, {
    home: function (this: DoTRoute.Controller) {
        this.it.title = "Hi";
    }
});

const route: DoTRoute.Route = application.route("home", "/", "Home", "Home", "home");
const parameterized: DoTRoute.Route = application.route("thing", "/thing/{id:\\d+}", template, controller, "home", () => undefined);

const link: string = application.link("thing", 3, { a: 1 });
const matched: boolean = application.match("/thing/3?a=1");
const there: boolean = application.at("thing", 3);
const id: string | undefined = application.current.path?.id;
const names: string[] = application.routing;

application.start();
application.go(route);
application.go("#/thing/3");
application.render({ title: "Hello" }, template, "#app", window);
application.refresh();

const failure: DoTRoute.Exception = new DoTRoute.Exception("broke");

// A route needs a name and a path.
// @ts-expect-error
application.route("nameless");

export { parameterized, link, matched, there, id, names, failure };
