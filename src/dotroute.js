var DoTRoute = {};

// Exception

DoTRoute.Exception = function(message) {
    
    this.name = "DoTRoute.Exception";
    this.message = message;

}

DoTRoute.Exception.prototype = Object.create(Error.prototype);
DoTRoute.Exception.prototype.constructor = DoTRoute.Exception;

// Controller

DoTRoute.Controller = function(application,name) {

    this.it = {};
    this.application = application;
    this.name = name;

}

// Use as constructor

DoTRoute.Controller.prototype.constructor = DoTRoute.Controller;

// enter - When entered

DoTRoute.Controller.prototype.enter = function() {

}

// render - Apply to current data

DoTRoute.Controller.prototype.render = function(template) {

    $(this.application.target,this.application.window.document).html(this.application.templates[template](this.it));

}

// exit - When leaving

DoTRoute.Controller.prototype.exit = function() {

}

// Route

DoTRoute.Route = function(name,path,template,callable) {

    this.name = name;
    this.patterns = [];
    this.template = template ? template : this.name;
    this.callable = callable;

    var paths = path.split('/').slice(1);

    for (var index = 0; index < paths.length; index++) {

        var pattern = {};

        if (paths[index].length > 2 && '{' == paths[index][0] && paths[index].slice(-1) == '}') {

            var parameter_regex = paths[index].slice(1,-1).split(':');

            var parameter = parameter_regex.shift();

            if (parameter) {
                pattern.parameter = parameter;
            }

            if (parameter_regex.length == 1) {
                pattern.regex = new RegExp(parameter_regex[0]);
            } else if (parameter_regex.length == 2) {
                pattern.regex = new RegExp(parameter_regex[0],parameter_regex[1]);
            }

        } else {
            pattern.exact = paths[index];
        }

        this.patterns.push(pattern);

    }

}

// Use as constructor

DoTRoute.Route.prototype.constructor = DoTRoute.Route;

// Application

DoTRoute.Application = function(target,pane) {

    this.routes = [];
    this.templates = {};
    this.controllers = {};

    this.current = {
        route: null,
        path: null,
        query: null,
        controller: null
    };

    this.target = target ? target : "body";
    this.window = pane ? pane : window;

}

// Use as constructor

DoTRoute.Application.prototype.constructor = DoTRoute.Application;

// start - Start listening for events

DoTRoute.Application.prototype.start = function() {

    $(this.window).on('hashchange',$.proxy(this.router,this));  
    $(this.window).on('load',$.proxy(this.router,this));  

}

// template - Map a compiled template to a name

DoTRoute.Application.prototype.template = function(name,text,custom,data) {

    this.templates[name] = doT.template(text,custom,data);

}

// controller - Map a controller to a name

DoTRoute.Application.prototype.controller = function(name,base,actions) {

    var controller = new DoTRoute.Controller(this,name);

    if (base) {
        controller = $.extend(this.controllers[base],controller);
    }

    this.controllers[name] = $.extend(controller,actions);

    return this.controllers[name];

}

// route - Map a pattern to a callable entity

DoTRoute.Application.prototype.route = function(name,path,template,callable) {

    this.routes.push(new DoTRoute.Route(name,path,template,callable));

}

// match - Find a matching route

DoTRoute.Application.prototype.match = function(path) {

    var path_query = path.split('?');
    var paths = path_query.shift().split('/').slice(1);
    var query = {};
    
    if (path_query.length) {
        $.each(path_query[0].split('&'),function(index,parameter) {
            var name_value = parameter.split('=');
            query[name_value[0]] = name_value.length > 1 ? decodeURIComponent(name_value[1]) : null;
        });
    }

    route_loop: for (var route_index = 0; route_index < this.routes.length; route_index++) {

        var route = this.routes[route_index];
        var path = {};

        if (paths.length != route.patterns.length) {
            continue route_loop;
        }

        for (var pattern_index = 0; pattern_index < route.patterns.length; pattern_index++) {

            var pattern = route.patterns[pattern_index];

            if (("exact" in pattern && pattern.exact != paths[pattern_index]) ||
                ("regex" in pattern && !pattern.regex.test(paths[pattern_index]))) {
                continue route_loop;
            }

            if ("parameter" in pattern) {
                path[pattern.parameter] = paths[pattern_index];
            }

        }

        this.current.route = route;
        this.current.path = path;
        this.current.query = query;

        return true;

    }

    return false;

}

// router - match route and call

DoTRoute.Application.prototype.router = function() {

    var hash = this.window.location.hash;
    var path = (hash.slice(1) || "/");

    if (this.current.controller) {
        this.current.controller.exit();
    }

    this.current = {
        route: null,
        path: null,
        query: null,
        controller: null
    };

    if (!this.match(path)) {
        throw new DoTRoute.Exception("Unable to route: " + hash);
    }

    if (typeof(this.current.route.callable) == "string") {

        this.current.controller = this.controllers[this.current.route.callable];
        this.controllers[this.current.route.callable].enter();

    } else if (typeof(this.current.route.callable) == "object" && $.isArray(this.current.route.callable)) {

        this.current.controller = this.controllers[this.current.route.callable[0]];
        this.controllers[this.current.route.callable[0]][this.current.route.callable[1]]();

    } else if (typeof(this.current.route.callable) == "object") {

        this.current.controller = this.controllers[this.current.route.callable.controller];
        this.controllers[this.current.route.callable.controller][this.current.route.callable.action]();

    } else if (typeof(this.current.route.callable) == "function") {

        this.current.route.callable(this.current);

    } else {

        throw new DoTRoute.Exception("Unable to call callable for: " + hash);

    }

}

