const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { JSDOM } = require('jsdom')

// How a page uses it: two script tags, doT and then doTRoute, in a window that has nothing else.

const load = () => {
    const window = new JSDOM('<!DOCTYPE html><body><span></span></body>', { url: 'http://localhost/', runScripts: 'outside-only' }).window
    const before = new Set(Object.getOwnPropertyNames(window))

    window.eval(readFileSync(require.resolve('dot/doT.js'), 'utf8'))
    window.eval(readFileSync(require.resolve('../doTRoute.js'), 'utf8'))

    return { window, added: Object.getOwnPropertyNames(window).filter((name) => !before.has(name)).sort() }
}

describe("DoTRoute as a script", () => {

    it("needs only doT, and adds nothing to the page but doT and DoTRoute", () => {

        const { window, added } = load()

        assert.equal(typeof window.DoTRoute, "object")
        assert.equal(window.jQuery, undefined)
        assert.deepEqual(added, ["DoTRoute", "doT"])

    })

    it("routes and renders", () => {

        const { window } = load()
        const DoTRoute = window.DoTRoute

        const application = new DoTRoute.Application("span", window, true)
        application.template("Home", "<p>{{=it.name}}</p>")
        application.route("home", "/", "Home", null, function () {
            this.application.render({ name: "there" })
        })

        application.router()

        assert.equal(window.document.querySelector("span").textContent, "there")

    })

    it("has the public surface it always has", () => {

        const { window } = load()
        const DoTRoute = window.DoTRoute

        assert.deepEqual(Object.keys(DoTRoute), ["Exception", "Controller", "Route", "Application"])

        assert.deepEqual(Object.getOwnPropertyNames(DoTRoute.Application.prototype), [
            "constructor", "start", "partial", "template", "controller", "route", "match",
            "last", "router", "link", "go", "at", "refresh", "render"
        ])

        for (const name of ["Controller", "Route", "Application"]) {
            assert.equal(DoTRoute[name].prototype.constructor, DoTRoute[name])
        }

        assert.equal(new DoTRoute.Exception("x") instanceof window.Error, true)

    })

})
