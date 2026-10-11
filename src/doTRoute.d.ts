// Types for doTRoute: a hash router and doT.js templates.
//
// It's a plain script that defines the global DoTRoute, and a module that exports it, so this
// declares both: `DoTRoute.Application` in a page, `import DoTRoute = require("dotroute")` (or a
// default import with esModuleInterop) in a module.

export = DoTRoute;
export as namespace DoTRoute;

declare namespace DoTRoute {

    /** A compiled template: give it data, get html back. */
    type Template = (it?: any) => string;

    /** What an application needs of the window (or iframe window) it runs in. A Window fits. */
    interface Pane {
        location: { hash: string };
        document: {
            querySelectorAll(selector: string): { forEach(callback: (element: { innerHTML: string }) => void): void };
        };
        addEventListener(type: string, listener: (event: any) => void): void;
    }

    /** How one part of a route's path matches. */
    interface Pattern {
        /** Matches this text exactly, when the part isn't in curly braces. */
        exact?: string;
        /** Names the part, so the matched text is in `current.path`. */
        parameter?: string;
        /** Also requires the part to match this. */
        regex?: RegExp;
    }

    /** What the router found for the current hash. Everything is null until a route matches. */
    interface Current {
        /** The parts of the path, split on "/". */
        paths: string[] | null;
        controller: Controller | null;
        route: Route | null;
        /** The matched `{parameter}` parts of the path, by name. */
        path: { [parameter: string]: string } | null;
        /** The query string, decoded. A parameter with no value is null. */
        query: { [parameter: string]: string | null } | null;
    }

    /** Thrown when doTRoute can't do what it was asked: a template that won't compile, a hash no route matches, a link to a route that isn't there. */
    class Exception extends Error {
        constructor(message: string);
        name: "DoTRoute.Exception";
    }

    /** A bundle of related actions. Whatever's in `base` and `actions` becomes part of the controller. */
    class Controller {
        constructor(application: Application | null, name: string, base?: object | null, actions?: object | null);
        /** The data your actions build up for the template. */
        it: any;
        application: Application | null;
        name: string;
        [action: string]: any;
    }

    /** A path pattern mapped to what to show. Made for you by `Application.route`. */
    class Route {
        constructor(
            application: Application | null,
            name: string,
            path: string,
            template?: Template | null,
            controller?: Controller | null,
            enter?: (this: any, application: Application) => any,
            exit?: (this: any, application: Application) => any
        );
        application: Application | null;
        name: string;
        path: string;
        template?: Template | null;
        controller?: Controller | null;
        enter?: (this: any, application: Application) => any;
        exit?: (this: any, application: Application) => any;
        patterns: Pattern[];
    }

    class Application {
        /**
         * @param target A selector for where to render, "body" if none.
         * @param pane The window to listen to and render in, this page's window if none.
         * @param wait Don't start listening yet; call `start()` when you're ready.
         */
        constructor(target?: string | null, pane?: Pane | null, wait?: boolean);

        routes: { [name: string]: Route };
        /** Route names, in the order they were added, which is the order they're matched. */
        routing: string[];
        partials: { [name: string]: string };
        templates: { [name: string]: Template };
        controllers: { [name: string]: Controller };
        current: Current;
        target: string;
        pane: Pane;

        /** Start listening for hash changes, page loads and unloads. */
        start(): void;

        /** Save text to use as `{{#def.Name}}` in templates. */
        partial(name: string, text: string): string;

        /** Compile and save a template. `data` is what `{{#def.Name}}` can use, `custom` doT's settings. */
        template(name: string, text: string, custom?: object | null, data?: object | null): Template;

        /** Make a controller. `base` is a controller, or the name of one already made, to start from. */
        controller(name: string, base?: string | object | null, actions?: object | null): Controller;

        /**
         * Map a path to what to show. Parts in curly braces are parameters: `{id}`, `{id:\\d+}`,
         * `{id:\\d+:i}` (name, regex, regex options), or `{:\\d+}` for a match with no name.
         *
         * @param template A template, or the name of one already made.
         * @param controller A controller, or the name of one already made.
         * @param enter A function, or the name of one of the controller's, to call when the route is entered. Renders the template by default.
         * @param exit The same, for when the route is left.
         */
        route(
            name: string,
            path: string,
            template?: string | Template | null,
            controller?: string | Controller | null,
            enter?: string | ((this: any, application: Application) => any) | null,
            exit?: string | ((this: any, application: Application) => any) | null
        ): Route;

        /** Find the first route that matches a path like "/this/that?a=1", and make it current. */
        match(path: string): boolean;

        /** Leave the current route, if there is one. */
        last(): void;

        /** Match the current hash and enter the route. Throws if none matches. */
        router(): void;

        /** The hash for a route. Pass a value for each `{parameter}` in the path, then optionally an object for the query string. */
        link(route: string | Route, ...parameters: any[]): string;

        /** Change the hash to a route's, or to a hash that starts with "#". The router runs on the hashchange event. */
        go(route: string | Route, ...parameters: any[]): void;

        /** Whether the current route is this one. Pass values to also require the `{parameter}`s to equal them; null or undefined matches anything. */
        at(route: string | Route, ...parameters: any[]): boolean;

        /** Match and enter the current route again. */
        refresh(): void;

        /**
         * Render a template with data into every element the target matches.
         *
         * @param it The data. Whatever a controller's `it` holds, usually.
         * @param template A template or the name of one; the current route's by default.
         * @param target A selector; the application's target by default.
         * @param pane The window to render in; the application's by default.
         */
        render(it?: any, template?: string | Template | null, target?: string | null, pane?: Pane | null): void;
    }

}
