// The globals doTRoute.js reaches for: a window, jQuery on that window, and doT. The tests
// load the library the way a module would, through its export, so these are set up first.

const { JSDOM } = require('jsdom')
const jquery = require('jquery')

const page = (html) => new JSDOM(`<!DOCTYPE html><body>${html}</body>`, { url: 'http://localhost/', pretendToBeVisual: true })

const dom = page('')

// jQuery 1.x gives back a factory when there's no window yet; hand it the one we made.
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.$ = jquery(dom.window)
globalThis.doT = require('dot')

// A pane for an application to run in: a window of its own with some html in it.
const openPane = (html) => page(html).window

// Resolves once a pane has finished loading. A new window fires its load event a moment after it's
// made, and an application started before then routes again when it does.
const loaded = (pane) => new Promise((resolve) => {
    if (pane.document.readyState === 'complete') {
        resolve()
    } else {
        pane.addEventListener('load', resolve, { once: true })
    }
})

module.exports = { dom, openPane, loaded }
