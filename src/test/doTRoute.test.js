const { describe, it, afterEach, mock } = require('node:test')
const assert = require('node:assert/strict')
const { openPane, loaded } = require('./setup.js')
const DoTRoute = require('../doTRoute.js')

// application.go changes the hash, and the application routes when the hashchange event arrives.
// The event is asynchronous, so wait for it. Start the application first, or nothing is listening.

const going = async (application, pane, ...where) => {
    const changed = new Promise((resolve) => pane.addEventListener('hashchange', resolve, { once: true }))
    application.go(...where)
    await changed
}

describe("DoTRoute.Exception", () => {

    it("constructor", () => {

        var exception = new DoTRoute.Exception("shit broke");

        assert.equal(exception.name,"DoTRoute.Exception");
        assert.equal(exception.message,"shit broke");

    });
})

describe("DoTRoute.Controller", () => {

    it("constructor", () => {

        var basey = new DoTRoute.Controller("Appy","Basey");

        assert.deepEqual(basey.it,{});
        assert.equal(basey.application,"Appy");
        assert.equal(basey.name,"Basey");

        basey.extra = "fun";

        var controlly = new DoTRoute.Controller("Happy","Controlly",basey,{
            start: function (value) {
                this.it.begin = value;
            },
            finish: function (value) {
                this.it.end = value;
            }
        });

        assert.deepEqual(controlly.it,{});
        assert.equal(controlly.application,"Happy");
        assert.equal(controlly.name,"Controlly");
        assert.equal(controlly.extra,"fun");

        controlly.start("up");
        controlly.finish("down");

        assert.deepEqual(controlly.it,{begin: "up", end: "down"});
        assert.deepEqual(basey.it,{});

        var extendy = new DoTRoute.Controller("Nappy","Extendy",controlly,{
            start: function (value) {
                this.it.begin = "sideways";
            }
        });

        extendy.start("up");    
        extendy.finish("down");    

        assert.equal(extendy.application,"Nappy");
        assert.equal(extendy.name,"Extendy");
        assert.equal(extendy.extra,"fun");
        assert.deepEqual(extendy.it,{begin: "sideways", end: "down"});
        assert.deepEqual(controlly.it,{begin: "up", end: "down"});
        assert.deepEqual(basey.it,{});

    });
})

describe("DoTRoute.Route", () => {

    it("constructor", () => {

        var simple = new DoTRoute.Route("Appy","simple","/this/that/");
        assert.equal(simple.application,"Appy");
        assert.equal(simple.name,"simple");
        assert.deepEqual(simple.patterns,[{exact: "this"},{exact: "that"},{exact: ""}]);
        assert.equal(simple.template,undefined);
        assert.equal(simple.controller,undefined);

        var named = new DoTRoute.Route("Appy","named","/this/{that}/","Tempy","Controlly","entering()","exiting()");
        assert.equal(simple.application,"Appy");
        assert.equal(named.name,"named");
        assert.deepEqual(named.patterns,[{exact: "this"},{parameter: "that"},{exact: ""}]);
        assert.equal(named.template,"Tempy");
        assert.equal(named.controller,"Controlly");
        assert.equal(named.enter,"entering()");
        assert.equal(named.exit,"exiting()");

        var words = new DoTRoute.Route("Appy","words","/this/{:\\w+:i}/");
        assert.equal(simple.application,"Appy");
        assert.equal(words.name,"words");
        assert.deepEqual(words.patterns,[{exact: "this"},{regex: /\w+/i},{exact: ""}]);

        var complex = new DoTRoute.Route(null,"complex","/this/{that:\\w+:i}/");
        assert.equal(complex.application,null);
        assert.equal(complex.name,"complex");
        assert.deepEqual(complex.patterns,[{exact: "this"},{parameter: "that",regex: /\w+/i},{exact: ""}]);

    });
})

describe("DoTRoute.Application", () => {
    let applicationWindow
    let renderWindow

    afterEach(() => {
        for (const pane of [applicationWindow, renderWindow]) {
            if (pane) {
                pane.close()
            }
        }
        applicationWindow = renderWindow = undefined
    })

    it("constructor", () => {

        applicationWindow = openPane("<span></span>");

        var application = new DoTRoute.Application("span",applicationWindow,true);

        assert.deepEqual(application.routes,{});
        assert.deepEqual(application.routing,[]);
        assert.deepEqual(application.partials,{});
        assert.deepEqual(application.templates,{});
        assert.deepEqual(application.controllers,{});
        assert.deepEqual(application.current, {
            paths: null,
            controller: null,
            route: null,
            path: null,
            query: null
        });
        assert.equal(application.target,"span");
        assert.equal(application.pane,applicationWindow);

    });

    it("start", () => {

        applicationWindow = openPane("<span></span>");

        var application = new DoTRoute.Application("span",applicationWindow);
    
        application.start();

        assert.ok(true);

    });

    it("partial", () => {

        var application = new DoTRoute.Application(null,null,true);

        var partial = application.partial("Simple","<p>{{=it.stuff}}</p>");
        assert.deepEqual(partial,application.partials.Simple);
        assert.equal(partial,"<p>{{=it.stuff}}</p>");

    });

    it("template", () => {

        // doT logs the source of any template it can't compile, and one is broken on purpose below.
        const log = mock.method(console, "log", () => {});

        var application = new DoTRoute.Application(null,null,true);

        var template = application.template("Simple","<p>{{=it.stuff}}</p>");
        assert.deepEqual(template,application.templates.Simple);
        assert.equal(application.templates.Simple({stuff: 'things'}),"<p>things</p>");

        application.template("Complex","<p>{{#def.more}} {{=it.stuff}}</p>",null,{more: "people stuff"});
        assert.equal(application.templates.Complex({stuff: 'things'}),"<p>people stuff things</p>");

        try {
        var template = application.template("Broken","<p>{{!=it.stuff}}</p>");
            assert.ok(false);
        } catch (exception) {
            assert.equal(exception.name,"DoTRoute.Exception");
            // The rest of a SyntaxError's message is the engine's own wording, so only check what's ours.
            assert.ok(/^Failed to compile Broken: SyntaxError/.test(exception.message));
        }

        log.mock.restore();

    });

    it("controller", () => {

        var application = new DoTRoute.Application(null,null,true);

        var basey = application.controller("Basey");

        assert.deepEqual(basey.it,{});
        assert.equal(basey.application,application);
        assert.equal(basey.name,"Basey");

        basey.extra = "fun";

        var controlly = application.controller("Controlly",basey,{
            start: function (value) {
                this.it.begin = value;
            },
            finish: function (value) {
                this.it.end = value;
            }
        });

        assert.deepEqual(controlly.it,{});
        assert.equal(controlly.application,application);
        assert.equal(controlly.name,"Controlly");
        assert.equal(controlly.extra,"fun");

        controlly.start("up");
        controlly.finish("down");

        assert.deepEqual(controlly.it,{begin: "up", end: "down"});
        assert.deepEqual(basey.it,{});

        var extendy = application.controller("Extendy",controlly,{
            start: function (value) {
                this.it.begin = "sideways";
            }
        });

        extendy.start("up");    
        extendy.finish("down");    

        assert.equal(extendy.application,application);
        assert.equal(extendy.name,"Extendy");
        assert.equal(extendy.extra,"fun");
        assert.deepEqual(extendy.it,{begin: "sideways", end: "down"});
        assert.deepEqual(controlly.it,{begin: "up", end: "down"});
        assert.deepEqual(basey.it,{});



        // The base can be the name of a controller that's already registered.

        var namey = application.controller("Namey","Basey");

        assert.equal(namey.extra,"fun");
        assert.deepEqual(namey.it,{});

    });

    it("route", () => {

        applicationWindow = openPane("<span></span>");

        var application = new DoTRoute.Application("span",applicationWindow,true);
        var template = application.template("Simple","<p>things</p>");
        var controller = application.controller("Controlly",null,{
            start: function (value) {
                this.it.begin = value;
            },
            finish: function (value) {
                this.it.end = value;
            }
        });

        var route = application.route("simple","/this/that/","Simple");
        assert.deepEqual(application.routes.simple,route);
        assert.equal(application.routing[0],"simple");
        assert.equal(route.name,"simple");
        assert.deepEqual(route.application,application);
        assert.deepEqual(route.patterns,[{exact: "this"},{exact: "that"},{exact: ""}]);
        assert.deepEqual(route.template,template);
        assert.equal(route.controller,undefined);
        application.current.route = route;
        route.enter();
        assert.equal($("span",applicationWindow.document).text(),"things");
        route.exit();

        var route = application.route("named","/this/{that}/",template,"Controlly","start","finish");
        assert.deepEqual(application.routes.named,route);
        assert.equal(application.routing[1],"named");
        assert.equal(route.name,"named");
        assert.deepEqual(route.application,application);
        assert.deepEqual(route.patterns,[{exact: "this"},{parameter: "that"},{exact: ""}]);
        assert.deepEqual(route.template,template);
        assert.deepEqual(route.controller,controller);
        route.enter("up");
        assert.equal(controller.it.begin,"up");
        route.exit("down");
        assert.equal(controller.it.end,"down");

        function entering() {
            controller.it.result = "inny";
        }
        function exiting() {
            controller.it.result = "outty";
        }
        var route = application.route("complex","/this/{that:\\w+:i}/",template,null,entering,exiting);
        assert.deepEqual(application.routes.complex,route);
        assert.equal(application.routing[2],"complex");
        assert.equal(route.name,"complex");
        assert.deepEqual(route.application,application);
        assert.deepEqual(route.patterns,[{exact: "this"},{parameter: "that",regex: /\w+/i},{exact: ""}]);
        assert.deepEqual(route.template,template);
        assert.equal(route.controller,null);
        route.enter();
        assert.equal(controller.it.begin,"up");
        route.exit();
        assert.equal(controller.it.end,"down");

    });

    it("match", () => {

        var application = new DoTRoute.Application(null,null,true);
        var controller = application.controller("Simply");

        application.route("wrong","/way/charlie/");
        assert.equal(application.match("/this/that/?a=1&b=2"),false);

        application.route("simple","/this/that/",null,controller);
        assert.equal(application.match("/this/that/?a=1&b=2"),true);
        assert.deepEqual(application.current.paths,["this","that",""]);
        assert.deepEqual(application.current.controller,controller);
        assert.deepEqual(application.current.route,application.routes.simple);
        assert.deepEqual(application.current.query,{a:'1',b:'2'});
        assert.deepEqual(application.current.path,{});

        var application = new DoTRoute.Application(null,null,true);
        application.route("named","/this/{that}/");
        assert.equal(application.match("/this/thang/?a=1&b=3"),true);
        assert.deepEqual(application.current.paths,["this","thang",""]);
        assert.deepEqual(application.current.route,application.routes.named);
        assert.deepEqual(application.current.query,{a:'1',b:'3'});
        assert.deepEqual(application.current.path,{that: "thang"});

        var application = new DoTRoute.Application(null,null,true);
        application.route("words","/this/{:\\w+:i}/");
        assert.equal(application.match("/this/thang/?a=2&b=2"),true);
        assert.deepEqual(application.current.paths,["this","thang",""]);
        assert.deepEqual(application.current.route,application.routes.words);
        assert.deepEqual(application.current.query,{a:'2',b:'2'});
        assert.deepEqual(application.current.path,{});

        var application = new DoTRoute.Application(null,null,true);
        application.route("complex","/this/{that:\\w+:i}/");
        assert.equal(application.match("/this/thang/?a=1&b=1"),true);
        assert.deepEqual(application.current.paths,["this","thang",""]);
        assert.deepEqual(application.current.route,application.routes.complex);
        assert.deepEqual(application.current.query,{a:'1',b:'1'});
        assert.deepEqual(application.current.path,{that: "thang"});


        // A query parameter with no value is null.

        var application = new DoTRoute.Application(null,null,true);
        application.route("flagged","/this/that/");
        assert.equal(application.match("/this/that/?flag&a=1"),true);
        assert.deepEqual(application.current.query,{flag: null, a: '1'});

    });

    it("router", () => {

        applicationWindow = openPane("<span></span>");

        var application = new DoTRoute.Application("span",applicationWindow,true);
        var controller = application.controller("Controlly",null,{
            entering: function () {
                this.it.self = "inside";
            },
            exiting: function () {
                this.it.other = "outside";
            }
        });

        try {
            applicationWindow.location.hash = "/any";
            application.router();
            assert.ok(false);
        } catch (exception) {
            assert.equal(exception.name,"DoTRoute.Exception");
            assert.equal(exception.message,"Unable to route: #/any");
        }

        application.route("built-in","/",null,"Controlly","entering","exiting");
        applicationWindow.location.hash = "",
        application.router();
        assert.equal(controller.it.self,"inside");

        application.route("listed","/this",null,null,function () { controller.it.self = "in"; },function () { controller.it.other = "out"; });
        applicationWindow.location.hash = "/this",
        application.router();
        assert.equal(controller.it.self,"in");
        assert.equal(controller.it.other,"outside");

        applicationWindow.location.hash = "",
        application.router();
        assert.equal(controller.it.self,"inside");
        assert.equal(controller.it.other,"out");

    });

    it("link", () => {

        var application = new DoTRoute.Application(null,null,true);

        var people = application.route("people","/people/stuff/");
        var things = application.route("things","/things/{:\\+d}/{:\\+d}/");

        assert.equal(application.link(people),"#/people/stuff/");
        assert.equal(application.link("things",2,3,{a: 1}),"#/things/2/3/?a=1");

        try {
            application.link("stuff");
            assert.ok(false);
        } catch (exception) {
            assert.equal(exception.name,"DoTRoute.Exception");
            assert.equal(exception.message,"Can't find route: stuff");
        }

    });

    it("go", async () => {

        applicationWindow = openPane("<span></span>");
        await loaded(applicationWindow);

        var application = new DoTRoute.Application("span",applicationWindow);
        application.template("People","<p>stuff</p>");
        application.template("Stuff","<p>things</p>");

        application.route("people","/people/","People");
        application.route("stuff","/stuff/{:\\d+}/{:\\d+}","Stuff");

        await going(application, applicationWindow, "#/people/");
        assert.equal($("span",applicationWindow.document).text(),"stuff");

        await going(application, applicationWindow, "stuff",1,2);
        assert.equal($("span",applicationWindow.document).text(),"things");
        assert.equal(applicationWindow.location.hash,"#/stuff/1/2");

    });

    it("go enters a route once", async () => {

        applicationWindow = openPane("<span></span>");
        await loaded(applicationWindow);

        // Changing the hash triggers the router through the hashchange event, so go must not
        // also call it, or the route is entered twice.

        var application = new DoTRoute.Application("span",applicationWindow);
        var entered = 0;

        application.template("People","<p>stuff</p>");
        application.route("people","/people/","People",null,function () {
            entered++;
            this.application.render();
        });

        await going(application, applicationWindow, "people");

        assert.equal(entered,1);
        assert.equal($("span",applicationWindow.document).text(),"stuff");

    });

    it("at", async () => {

        applicationWindow = openPane("<span></span>");
        await loaded(applicationWindow);

        var application = new DoTRoute.Application("span",applicationWindow);
        application.template("Things","<p>things</p>");

        var route = application.route("people","/people/","Things");
        application.route("stuff","/stuff/{:\\d+}/{:\\d+}","Things");

        assert.equal(application.at("people"),false);

        await going(application, applicationWindow, route);
        assert.equal(application.at(route),true);
        assert.equal(application.at("people"),true);
        assert.equal(application.at("stuff"),false);

        await going(application, applicationWindow, "stuff",1,2);
        assert.equal(application.at("stuff"),true);
        assert.equal(application.at("stuff",1),true);
        assert.equal(application.at("stuff",2),false);
        assert.equal(application.at("stuff",1,2),true);
        assert.equal(application.at("stuff",null,2),true);
        assert.equal(application.at("stuff",null,1),false);

    });

    it("refresh", async () => {

        applicationWindow = openPane("<span></span>");
        await loaded(applicationWindow);

        var application = new DoTRoute.Application("span",applicationWindow);
        application.template("People","<p>stuff</p>");
        application.template("Stuff","<p>things</p>");

        application.route("people","/people/","People");
        application.route("stuff","/stuff/{:\\d+}/{:\\d+}","Stuff");

        await going(application, applicationWindow, "stuff",1,2);
        assert.equal($("span",applicationWindow.document).text(),"things");

        $("span",applicationWindow.document).html(application.templates.People());
        assert.equal($("span",applicationWindow.document).text(),"stuff");

        application.refresh();
        assert.equal($("span",applicationWindow.document).text(),"things");

    });

    it("render", () => {

        applicationWindow = openPane("<span></span>");

        var application = new DoTRoute.Application("span",applicationWindow,true);
        var template = application.template("simple","<p>{{=it.stuff}}</p>");
        application.current.route = {template: template};

        application.render({stuff: "things"});

        assert.equal($("span",applicationWindow.document).text(),"things");

        renderWindow = openPane("<div></div>");

        application.render({stuff: "people"},"simple","div",renderWindow);

        assert.equal($("span",applicationWindow.document).text(),"things");
        assert.equal($("div",renderWindow.document).text(),"people");


        // A template can be sent as the function itself, not just by name.

        application.render({stuff: "directly"},template,"span",applicationWindow);

        assert.equal($("span",applicationWindow.document).text(),"directly");

    });
})
