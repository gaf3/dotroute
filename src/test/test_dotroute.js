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
    assert.equal(controller.template,"controlly");

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

    controller.render();

    assert.equal($("span",this.controllerWindow.document).text(),"things");

});

QUnit.module("DoTRoute.Route");

QUnit.test("constructor", function(assert) {

    var simple = new DoTRoute.Route("simple","/this/that/","simple()");
    assert.equal(simple.name,"simple");
    assert.deepEqual(simple.patterns,[{exact: "this"},{exact: "that"},{exact: ""}]);
    assert.equal(simple.callable,"simple()");

    var named = new DoTRoute.Route("named","/this/{that}/","named()");
    assert.equal(named.name,"named");
    assert.deepEqual(named.patterns,[{exact: "this"},{parameter: "that"},{exact: ""}]);
    assert.equal(named.callable,"named()");

    var words = new DoTRoute.Route("words","/this/{:\\w+:i}/","words()");
    assert.equal(words.name,"words");
    assert.deepEqual(words.patterns,[{exact: "this"},{regex: /\w+/i},{exact: ""}]);
    assert.equal(words.callable,"words()");

    var complex = new DoTRoute.Route("complex","/this/{that:\\w+:i}/","complex()");
    assert.equal(complex.name,"complex");
    assert.deepEqual(complex.patterns,[{exact: "this"},{parameter: "that",regex: /\w+/i},{exact: ""}]);
    assert.equal(complex.callable,"complex()");

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

    var application = new DoTRoute.Application();

    assert.deepEqual(application.routes,[]);
    assert.deepEqual(application.templates,{});
    assert.deepEqual(application.controllers,{});

});

QUnit.test("start", function(assert) {

    this.applicationWindow = window.open("", "_blank", "width=200, height=100");
    this.applicationWindow.document.write("<span></span>");

    var application = new DoTRoute.Application();
        
    application.start("span",this.applicationWindow);

    assert.equal(application.target,"span");
    assert.equal(application.window,this.applicationWindow);

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
    assert.equal(controller.template,"controlly");

    var controller = application.controller("controlly",{
        start: function (value) {
            this.it.finish = value;
        }
    },"tempy");

    controller.start("up");    

    assert.deepEqual(controller.it,{finish: "up"});
    assert.equal(controller.application,application);
    assert.equal(controller.name,"controlly");
    assert.equal(controller.template,"tempy");

});

QUnit.test("route", function(assert) {

    var application = new DoTRoute.Application();

    application.route("simple","/this/that/","simple()");
    application.route("named","/this/{that}/","named()");

    assert.equal(application.routes[0].name,"simple");
    assert.deepEqual(application.routes[0].patterns,[{exact: "this"},{exact: "that"},{exact: ""}]);
    assert.equal(application.routes[0].callable,"simple()");

    assert.equal(application.routes[1].name,"named");
    assert.deepEqual(application.routes[1].patterns,[{exact: "this"},{parameter: "that"},{exact: ""}]);
    assert.equal(application.routes[1].callable,"named()");

});

QUnit.test("match", function(assert) {

    var application = new DoTRoute.Application();

    application.route("wrong","/way/charlie/","wrong()");
    assert.equal(application.match("/this/that/?a=1&b=2"),null);

    application.route("simple","/this/that/","simple()");
    assert.deepEqual(application.match("/this/that/?a=1&b=2"),{
        route: application.routes[1],
        query: {a:'1',b:'2'},
        path: {}
    });

    application.routes[1] = new DoTRoute.Route("named","/this/{that}/","named()");
    assert.deepEqual(application.match("/this/thang/?a=1&b=2"),{
        route: application.routes[1],
        query: {a:'1',b:'2'},
        path: {that: "thang"}
    });

    application.routes[1] = new DoTRoute.Route("words","/this/{:\\w+:i}/","words()");
    assert.deepEqual(application.match("/this/thang/?a=1&b=2"),{
        route: application.routes[1],
        query: {a:'1',b:'2'},
        path: {}
    });

    application.routes[1] = new DoTRoute.Route("complex","/this/{that:\\w+:i}/","complex()");
    assert.deepEqual(application.match("/this/thang/?a=1&b=2"),{
        route: application.routes[1],
        query: {a:'1',b:'2'},
        path: {that: "thang"}
    });

});
