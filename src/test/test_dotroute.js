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

QUnit.test("enter", function(assert) {

    var controller = new DoTRoute.Controller("appy","controlly");

    controller.enter();
    assert.ok(true);

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

QUnit.test("exit", function(assert) {

    var controller = new DoTRoute.Controller("appy","controlly");

    controller.exit();
    assert.ok(true);

});

QUnit.module("DoTRoute.Route");

QUnit.test("constructor", function(assert) {

    var simple = new DoTRoute.Route("simple","/this/that/","simply","simple()");
    assert.equal(simple.name,"simple");
    assert.deepEqual(simple.patterns,[{exact: "this"},{exact: "that"},{exact: ""}]);
    assert.equal(simple.callable,"simple()");
    assert.equal(simple.template,"simply");

    var named = new DoTRoute.Route("named","/this/{that}/",null,"named()");
    assert.equal(named.name,"named");
    assert.deepEqual(named.patterns,[{exact: "this"},{parameter: "that"},{exact: ""}]);
    assert.equal(named.callable,"named()");
    assert.equal(named.template,"named");

    var words = new DoTRoute.Route("words","/this/{:\\w+:i}/",null,"words()");
    assert.equal(words.name,"words");
    assert.deepEqual(words.patterns,[{exact: "this"},{regex: /\w+/i},{exact: ""}]);
    assert.equal(words.callable,"words()");
    assert.equal(words.template,"words");

    var complex = new DoTRoute.Route("complex","/this/{that:\\w+:i}/",null,"complex()");
    assert.equal(complex.name,"complex");
    assert.deepEqual(complex.patterns,[{exact: "this"},{parameter: "that",regex: /\w+/i},{exact: ""}]);
    assert.equal(complex.callable,"complex()");
    assert.equal(complex.template,"complex");

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
        route: null,
        path: null,
        query: null,
        controller: null
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

    application.route("simple","/this/that/",null,"simple()");
    application.route("named","/this/{that}/",null,"named()");

    assert.equal(application.routes[0].name,"simple");
    assert.deepEqual(application.routes[0].patterns,[{exact: "this"},{exact: "that"},{exact: ""}]);
    assert.equal(application.routes[0].callable,"simple()");

    assert.equal(application.routes[1].name,"named");
    assert.deepEqual(application.routes[1].patterns,[{exact: "this"},{parameter: "that"},{exact: ""}]);
    assert.equal(application.routes[1].callable,"named()");

});

QUnit.test("match", function(assert) {

    var application = new DoTRoute.Application();

    application.route("wrong","/way/charlie/",null,"wrong()");
    assert.equal(application.match("/this/that/?a=1&b=2"),false);

    application.route("simple","/this/that/",null,"simple()");
    assert.equal(application.match("/this/that/?a=1&b=2"),true);
    assert.deepEqual(application.current.route,application.routes[1]);
    assert.deepEqual(application.current.query,{a:'1',b:'2'});
    assert.deepEqual(application.current.path,{});

    application.routes[1] = new DoTRoute.Route("named","/this/{that}/",null,"named()");
    assert.equal(application.match("/this/thang/?a=1&b=3"),true);
    assert.deepEqual(application.current.route,application.routes[1]);
    assert.deepEqual(application.current.query,{a:'1',b:'3'});
    assert.deepEqual(application.current.path,{that: "thang"});

    application.routes[1] = new DoTRoute.Route("words","/this/{:\\w+:i}/",null,"words()");
    assert.equal(application.match("/this/thang/?a=2&b=2"),true);
    assert.deepEqual(application.current.route,application.routes[1]);
    assert.deepEqual(application.current.query,{a:'2',b:'2'});
    assert.deepEqual(application.current.path,{});

    application.routes[1] = new DoTRoute.Route("complex","/this/{that:\\w+:i}/",null,"complex()");
    assert.equal(application.match("/this/thang/?a=1&b=1"),true);
    assert.deepEqual(application.current.route,application.routes[1]);
    assert.deepEqual(application.current.query,{a:'1',b:'1'});
    assert.deepEqual(application.current.path,{that: "thang"});

});

QUnit.test("router", function(assert) {

    this.applicationWindow = window.open("", "_blank", "width=200, height=100");
    this.applicationWindow.document.write("<span></span>");

    var application = new DoTRoute.Application("span",this.applicationWindow);

    try {
        this.applicationWindow.location.hash = "/any";
        application.router();
        assert.ok(false);
    } catch (exception) {
        assert.equal(exception.name,"DoTRoute.Exception");
        assert.equal(exception.message,"Unable to route: #/any");
    }

    var controller = application.controller("controlly",null,{
        enter: function (value) {
            this.it.direction = "routed";
        },
        arrayed: function (value) {
            this.it.direction = "arrayed";
        },
        objected: function (value) {
            this.it.direction = "objected";
        },
        proxied: function (value) {
            this.it.direction = "proxied";
        }
    });

    application.route("built-in","/",null,"controlly");
    this.applicationWindow.location.hash = "",
    application.router();
    assert.equal(controller.it.direction,"routed")

    application.route("listed","/this",null,["controlly","arrayed"]);
    this.applicationWindow.location.hash = "/this",
    application.router();
    assert.equal(controller.it.direction,"arrayed")

    application.route("specific","/that",null,{controller: "controlly", action: "objected"});
    this.applicationWindow.location.hash = "/that",
    application.router();
    assert.equal(controller.it.direction,"objected")

    application.route("special","/stuff",null,$.proxy(controller.proxied,controller));
    this.applicationWindow.location.hash = "/stuff",
    application.router();
    assert.equal(controller.it.direction,"proxied")

    try {
        application.route("numbered","/things",null,5);
        this.applicationWindow.location.hash = "/things";
        application.router();
        assert.ok(false);
    } catch (exception) {
        assert.equal(exception.name,"DoTRoute.Exception");
        assert.equal(exception.message,"Unable to call callable for: #/things");
    }

});
