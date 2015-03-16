QUnit.module("DoTRoute.Exception");

QUnit.test("constructor", function(assert) {

    var exception = new DoTRoute.Exception("shit broke");

    assert.equal(exception.name,"DoTRoute.Exception");
    assert.equal(exception.message,"shit broke");

});

QUnit.module("DoTRoute.Controller", {
    setup: function() {
    },
    teardown: function() {
        if ("controllerWindow" in this) {
            this.controllerWindow.close();
        }
    }

});

QUnit.test("constructor", function(assert) {

    var controller = new DoTRoute.Controller("appy","controlly");

    assert.deepEqual(controller.it,{});
    assert.equal(controller.application,"appy");
    assert.equal(controller.name,"controlly");

});

QUnit.test("render", function(assert) {

    this.controllerWindow = window.open("", "_blank", "width=200, height=100");
    this.controllerWindow.document.write("<span>people</span>");

    var application = {
        target: "span",
        window: this.controllerWindow,
        templates: {
            ren: doT.template("<p>{{=it.stuff}}</p>")
        }
    };

    var controller = new DoTRoute.Controller(application,"controlly","ren");

    controller.it = {stuff: "things"};

    controller.render("ren");

    assert.equal($("span",this.controllerWindow.document).text(),"things");

});

QUnit.module("DoTRoute.Route");

QUnit.test("constructor", function(assert) {

    var simple = new DoTRoute.Route("appy","simple","/this/that/");
    assert.equal(simple.application,"appy");
    assert.equal(simple.name,"simple");
    assert.deepEqual(simple.patterns,[{exact: "this"},{exact: "that"},{exact: ""}]);
    assert.equal(simple.template,null);
    assert.equal(simple.controller,null);

    var named = new DoTRoute.Route("appy","named","/this/{that}/","tempy","controlly","entering()","exiting()");
    assert.equal(simple.application,"appy");
    assert.equal(named.name,"named");
    assert.deepEqual(named.patterns,[{exact: "this"},{parameter: "that"},{exact: ""}]);
    assert.equal(named.template,"tempy");
    assert.equal(named.controller,"controlly");
    assert.equal(named.enter,"entering()");
    assert.equal(named.exit,"exiting()");

    var words = new DoTRoute.Route("appy","words","/this/{:\\w+:i}/");
    assert.equal(simple.application,"appy");
    assert.equal(words.name,"words");
    assert.deepEqual(words.patterns,[{exact: "this"},{regex: /\w+/i},{exact: ""}]);

    var complex = new DoTRoute.Route(null,"complex","/this/{that:\\w+:i}/");
    assert.equal(complex.application,null);
    assert.equal(complex.name,"complex");
    assert.deepEqual(complex.patterns,[{exact: "this"},{parameter: "that",regex: /\w+/i},{exact: ""}]);

});

QUnit.module("DoTRoute.Application", {
    setup: function() {
    },
    teardown: function() {
        if ("applicationWindow" in this) {
            this.applicationWindow.close();
        }
    }

});

QUnit.test("constructor", function(assert) {

    this.applicationWindow = window.open("", "_blank", "width=200, height=100");
    this.applicationWindow.document.write("<span></span>");

    var application = new DoTRoute.Application("span",this.applicationWindow);

    assert.deepEqual(application.routes,[]);
    assert.deepEqual(application.templates,{});
    assert.deepEqual(application.controllers,{});
    assert.deepEqual(application.current, {
        controller: null,
        route: null,
        path: null,
        query: null
    });
    assert.equal(application.target,"span");
    assert.equal(application.window,this.applicationWindow);

});

QUnit.test("start", function(assert) {

    this.applicationWindow = window.open("", "_blank", "width=200, height=100");
    this.applicationWindow.document.write("<span></span>");

    var application = new DoTRoute.Application("span",this.applicationWindow);
    
    application.start();

    assert.ok(true);

});

QUnit.test("template", function(assert) {

    var application = new DoTRoute.Application();

    application.template("simple","<p>{{=it.stuff}}</p>");
    assert.equal(application.templates.simple({stuff: 'things'}),"<p>things</p>");

    application.template("complex","<p>{{#def.more}} {{=it.stuff}}</p>",null,{more: "people stuff"});
    assert.equal(application.templates.complex({stuff: 'things'}),"<p>people stuff things</p>");

});

QUnit.test("controller", function(assert) {

    var application = new DoTRoute.Application();

    var controller = application.controller("controlly");

    assert.deepEqual(controller,application.controllers.controlly);
    assert.deepEqual(controller.it,{});
    assert.equal(controller.application,application);
    assert.equal(controller.name,"controlly");

    var controller = application.controller("controlly",null,{
        start: function (value) {
            this.it.begin = value;
        },
        finish: function (value) {
            this.it.end = value;
        }
    });

    controller.start("up");    
    controller.finish("down");    

    assert.equal(controller.application,application);
    assert.equal(controller.name,"controlly");
    assert.deepEqual(controller.it,{begin: "up", end: "down"});

    var controller = application.controller("extendy","controlly",{
        start: function (value) {
            this.it.begin = "sideways";
        }
    });

    controller.start("up");    
    controller.finish("down");    

    assert.equal(controller.application,application);
    assert.equal(controller.name,"extendy");
    assert.deepEqual(controller.it,{begin: "sideways", end: "down"});

});

QUnit.test("route", function(assert) {

    var application = new DoTRoute.Application();
    var template = application.template("simple","<p>{{=it.stuff}}</p>");
    var controller = application.controller("controlly",null,{
        start: function (value) {
            this.it.begin = value;
        },
        finish: function (value) {
            this.it.end = value;
        }
    });

    var route = application.route("simple","/this/that/");
    assert.deepEqual(application.routes[0],route);
    assert.equal(route.name,"simple");
    assert.deepEqual(route.application,application);
    assert.deepEqual(route.patterns,[{exact: "this"},{exact: "that"},{exact: ""}]);
    assert.deepEqual(route.template,template);
    assert.equal(route.controller,null);
    route.enter();
    route.exit();

    var route = application.route("named","/this/{that}/",template,"controlly","start","finish");
    assert.deepEqual(application.routes[1],route);
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
    assert.deepEqual(application.routes[2],route);
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

QUnit.test("match", function(assert) {

    var application = new DoTRoute.Application();
    var controller = application.controller("simply");

    application.route("wrong","/way/charlie/");
    assert.equal(application.match("/this/that/?a=1&b=2"),false);

    application.route("simple","/this/that/",null,"simply");
    assert.equal(application.match("/this/that/?a=1&b=2"),true);
    assert.deepEqual(application.current.controller,controller);
    assert.deepEqual(application.current.route,application.routes[1]);
    assert.deepEqual(application.current.query,{a:'1',b:'2'});
    assert.deepEqual(application.current.path,{});

    application.routes[1] = new DoTRoute.Route(application,"named","/this/{that}/",null,"named()");
    assert.equal(application.match("/this/thang/?a=1&b=3"),true);
    assert.deepEqual(application.current.route,application.routes[1]);
    assert.deepEqual(application.current.query,{a:'1',b:'3'});
    assert.deepEqual(application.current.path,{that: "thang"});

    application.routes[1] = new DoTRoute.Route(application,"words","/this/{:\\w+:i}/",null,"words()");
    assert.equal(application.match("/this/thang/?a=2&b=2"),true);
    assert.deepEqual(application.current.route,application.routes[1]);
    assert.deepEqual(application.current.query,{a:'2',b:'2'});
    assert.deepEqual(application.current.path,{});

    application.routes[1] = new DoTRoute.Route(application,"complex","/this/{that:\\w+:i}/",null,"complex()");
    assert.equal(application.match("/this/thang/?a=1&b=1"),true);
    assert.deepEqual(application.current.route,application.routes[1]);
    assert.deepEqual(application.current.query,{a:'1',b:'1'});
    assert.deepEqual(application.current.path,{that: "thang"});

});

QUnit.test("router", function(assert) {

    this.applicationWindow = window.open("", "_blank", "width=200, height=100");
    this.applicationWindow.document.write("<span></span>");

    var application = new DoTRoute.Application("span",this.applicationWindow);
    var controller = application.controller("controlly",null,{
        entering: function () {
            this.it.self = "inside";
        },
        exiting: function () {
            this.it.other = "outside";
        }
    });

    try {
        this.applicationWindow.location.hash = "/any";
        application.router();
        assert.ok(false);
    } catch (exception) {
        assert.equal(exception.name,"DoTRoute.Exception");
        assert.equal(exception.message,"Unable to route: #/any");
    }

    application.route("built-in","/",null,"controlly","entering","exiting");
    this.applicationWindow.location.hash = "",
    application.router();
    assert.equal(controller.it.self,"inside");

    application.route("listed","/this",null,null,function () { controller.it.self = "in"; },function () { controller.it.other = "out"; });
    this.applicationWindow.location.hash = "/this",
    application.router();
    assert.equal(controller.it.self,"in");
    assert.equal(controller.it.other,"outside");

    this.applicationWindow.location.hash = "",
    application.router();
    assert.equal(controller.it.self,"inside");
    assert.equal(controller.it.other,"out");

});
