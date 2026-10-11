# Changelog

All notable changes to this project are recorded here, newest first. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-10-10

First release on npm, as `dotroute`. The code is the 2015 doTRoute.js with the changes below; its public
methods and signatures are the same.

### Added
- Published as an npm package with types (`src/doTRoute.d.ts`). `doT` is a peer dependency (`^1.1.3`).
- `doTRoute.js` is still a plain script that defines the global `DoTRoute`, and now also a module that exports it.
- Docker and make workflow: `make build|test|lint|setup|pack|publish|tag`. The tests run headless on `node:test` with jsdom, at 100% line, branch and function coverage; `make lint` runs ESLint and type-checks the types.
- `VERSION` and `LICENSE` (MIT).

### Changed
- **jQuery is no longer used or needed.** `render` sets `innerHTML` on every element the target matches; jQuery would also have run a `<script>` inside a template, which `innerHTML` does not. `link` builds query strings exactly as jQuery's `$.param` did (spaces as `+`, `a[b]=1`, `a[]=1`, nulls empty, functions called).
- `go()` only changes the hash; the `hashchange` event runs the router (#15). Going to the hash you're already on no longer re-renders (use `refresh()`), and an application made with `wait` must be started for `go()` to route.
- `route()` binds a controller's action with `bind`, so an action that isn't a function throws when the route is made instead of failing later.
- The tests moved from QUnit and popup windows to `node:test` and jsdom; the vendored QUnit, jQuery and doT are gone (doT comes from npm).

### Fixed
- A route's action can be an `async` function (jQuery's `$.proxy` dropped them).
- The `Controller` constructor no longer leaks a global named `controller`.
- `go()` no longer enters a route twice (#15).
