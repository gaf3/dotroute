var DoTRoute = {};

// Exception

DoTRoute.Exception = function(message) {
    
    this.name = "DoTRoute.Exception";
    this.message = message;

}

DoTRoute.Exception.prototype = Object.create(Error.prototype);
DoTRoute.Exception.prototype.constructor = DoTRoute.Exception;

// Application

DoTRoute.Application = function() {

    this.routes = {};

    $(window).on('hashchange',$.proxy(this.router,this));  
    $(window).on('load',$.proxy(this.router,this));  

}

// Use as constructor

DoTRoute.Application.prototype.constructor = DoTRoute.Application;

// Route - Map a pattern to a callable entity

DoTRoute.Application.prototype.route = function(name,path,callable) {

    var patterns = [];
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
            } else {
                throw new DoTRoute.Exception("Bad Regex: " + parameter_regex.join(':'));
            }

        } else {
            patterns.push(exact: paths[index]});
        }

        patterns.push(pattern);

    }

    this.routes[name] = {patterns: patterns, callable: callable};

}

// Match - find a route

DoTRoute.Application.prototype.match = function(path) {

    var path_query = path.split('?');
    var paths = path_query.shift().split('/');
    var match = {route: null, query: {}};
    
    if (path_query.length) {
        $.each(path_query.split('&'),function(index,parameter) {
            var name_value = parameter.split('=');
            match.query[name_value[0]] = name_value.length > 1 ? decodeURIComponent(name_value[1]) : null;
        });
    }

    $.each(this.routes,function (name,route) {

        match.name = name;
        match.route = route;
        match.path = {};

        if (paths.length != route.patterns.length) {
            continue;
        }

        for (var index = 0; index < route.patterns.length; index++) {

            if (("exact" in route.patterns[index] && route.patterns[index].exact != paths[index]) ||
                ("regex" in route.patterns[index] && !route.patterns[index].regex.test(paths[index])) {
                continue;
            }

            if ("parameter" in route.patterns[index]) {
                match.path[route.patterns[index].parameter] = = paths[index];
            }

        }

        return match;

    });

    return null;

}

// Router - match route and call

DoTRoute.Application.prototype.router = function() {

    var path = (location.hash.slice(1) || "/");

    var match = this.match(path);

    if (match) {
        match.route.callable(match.path,match.query);
    } else {
        throw new DoTRoute.Exception("Unable to route: " + location.hash);
    }

}

